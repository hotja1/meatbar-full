import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { formatSeats, getTableNoise, TOP_TABLES, type TableNoise } from '../data/tables-layout'
import { getTableScene } from '../data/tables-scenes'
import './tablemap.css'

export type MapTable = {
  id: number
  number: number
  hall: 1 | 2 | 3
  zone: 'window' | 'grill' | 'bar' | 'lounge' | 'banquet'
  seats: number
  seatsMax?: number
  status: 'free' | 'reserved' | 'held' | 'disabled'
  x: number
  y: number
  width: number
  height: number
  shape?: 'rect' | 'round'
  points?: ReadonlyArray<readonly [number, number]>
  scene?: string
}

type TableMapProps = {
  tables: MapTable[]
  selected?: MapTable | null
  onSelect?: (table: MapTable) => void
}

type HoverState = {
  table: MapTable
  left: number
  top: number
}

const VIEW_WIDTH = 1448
const VIEW_HEIGHT = 1086
const VIEWBOX = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`
const HALLS: ReadonlyArray<1 | 2 | 3> = [1, 2, 3]

const HALL_IMAGE: Record<1 | 2 | 3, string> = {
  1: '/assets/tables/hall-1-first-layout.png',
  2: '/assets/tables/hall-2-open-grill-layout.png',
  3: '/assets/tables/hall-3-lounge-bar-layout.png',
}

const HALL_BADGE: Record<
  1 | 2 | 3,
  {
    title: string
    titleX: number
    titleY: number
    titleSize: number
    logoX: number
    logoY: number
    logoW: number
    logoH: number
    mask?: { x: number; y: number; w: number; h: number }
  }
> = {
  1: {
    title: 'ЗАЛ 1 · ПЕРВЫЙ ЗАЛ',
    titleX: 22,
    titleY: 66,
    titleSize: 60,
    logoX: 24,
    logoY: 82,
    logoW: 152,
    logoH: 92,
  },
  2: {
    title: 'ЗАЛ 2 · ОТКРЫТЫЙ ГРИЛЬ',
    titleX: 22,
    titleY: 66,
    titleSize: 58,
    logoX: 24,
    logoY: 82,
    logoW: 152,
    logoH: 92,
    mask: { x: 0, y: 0, w: 430, h: 44 },
  },
  3: {
    title: 'ЗАЛ 3 · ЛАУНЖ И БАР',
    titleX: 22,
    titleY: 66,
    titleSize: 58,
    logoX: 24,
    logoY: 82,
    logoW: 152,
    logoH: 92,
    mask: { x: 0, y: 0, w: 406, h: 44 },
  },
}

const BADGE_LOGO = '/assets/meatbar-logo-mark.webp'

const HALL_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Зал 1 · Первый зал',
  2: 'Зал 2 · Открытый гриль',
  3: 'Зал 3 · Лаунж и бар',
}

export function TableMap({ tables, selected, onSelect }: TableMapProps) {
  const [activeHall, setActiveHall] = useState<1 | 2 | 3>(1)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const hoverRafRef = useRef<number | null>(null)
  const hoverPendingPosRef = useRef<{ left: number; top: number } | null>(null)
  const hoverTableIdRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (hoverRafRef.current != null) {
        window.cancelAnimationFrame(hoverRafRef.current)
      }
    }
  }, [])

  const hallTables = useMemo(
    () => tables.filter((t) => t.hall === activeHall && t.status !== 'disabled'),
    [tables, activeHall],
  )

  const counts = useMemo(() => {
    const byHall = (hall: 1 | 2 | 3) => tables.filter((t) => t.hall === hall && t.status !== 'disabled')
    const free = (hall: 1 | 2 | 3) => byHall(hall).filter((t) => t.status === 'free').length
    return {
      1: { free: free(1), total: byHall(1).length },
      2: { free: free(2), total: byHall(2).length },
      3: { free: free(3), total: byHall(3).length },
    }
  }, [tables])

  const selectedInHall = selected && selected.hall === activeHall && selected.status !== 'disabled' ? selected : null

  const applyTooltipPosition = useCallback(() => {
    hoverRafRef.current = null
    const tooltip = tooltipRef.current
    const pos = hoverPendingPosRef.current
    if (!tooltip || !pos) return
    const x = Math.max(14, Math.min(pos.left + 14, 980))
    const y = Math.max(12, pos.top - 18)
    tooltip.style.transform = `translate(${x}px, ${y}px)`
  }, [])

  const scheduleTooltipPosition = useCallback(
    (left: number, top: number) => {
      hoverPendingPosRef.current = { left, top }
      if (hoverRafRef.current != null) return
      hoverRafRef.current = window.requestAnimationFrame(applyTooltipPosition)
    },
    [applyTooltipPosition],
  )

  const setHoverFromPointer = useCallback(
    (table: MapTable, event: ReactPointerEvent<SVGGElement>) => {
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      const left = event.clientX - rect.left
      const top = event.clientY - rect.top
      scheduleTooltipPosition(left, top)
      if (hoverTableIdRef.current === table.id) return
      hoverTableIdRef.current = table.id
      setHovered({ table, left, top })
    },
    [scheduleTooltipPosition],
  )

  const clearHover = useCallback(() => {
    if (hoverRafRef.current != null) {
      window.cancelAnimationFrame(hoverRafRef.current)
      hoverRafRef.current = null
    }
    hoverPendingPosRef.current = null
    hoverTableIdRef.current = null
    setHovered(null)
  }, [])

  const liveStatus = selected
    ? `Выбран стол №${selected.number}, ${formatSeats(selected.seats, selected.seatsMax)}, ${statusWord(selected.status)}.`
    : 'Стол еще не выбран.'

  return (
    <div className="floorplan">
      <div className="floorplan-controls">
        <div className="floorplan-tabs" role="tablist" aria-label="Залы">
          {HALLS.map((hall) => (
            <button
              key={hall}
              type="button"
              role="tab"
              aria-selected={activeHall === hall}
              aria-controls="floorplan-stage"
              className={activeHall === hall ? 'active' : ''}
              onClick={() => setActiveHall(hall)}
            >
              <span>{HALL_LABEL[hall]}</span>
              <small>{counts[hall].free} из {counts[hall].total} свободно</small>
            </button>
          ))}
        </div>
      </div>

      <div
        id="floorplan-stage"
        ref={stageRef}
        className={`floorplan-stage hall-${activeHall}${selectedInHall ? ' has-selected' : ''}`}
        role="tabpanel"
      >
        <svg viewBox={VIEWBOX} className="floor-svg" aria-label={`Схема зала ${activeHall}`} preserveAspectRatio="xMidYMid meet">
          <image
            href={HALL_IMAGE[activeHall]}
            x="0"
            y="0"
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
            opacity="1"
            style={{ filter: 'contrast(1.07) saturate(1.1) brightness(1.08)' }}
          />
          <rect x="0" y="0" width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="rgba(168,120,72,0.08)" />

          {(() => {
            const badge = HALL_BADGE[activeHall]
            return (
              <g className="hall-badge" pointerEvents="none">
                {badge.mask ? (
                  <rect
                    x={badge.mask.x}
                    y={badge.mask.y}
                    width={badge.mask.w}
                    height={badge.mask.h}
                    fill="rgba(0,0,0,0.96)"
                  />
                ) : null}
                <text
                  x={badge.titleX}
                  y={badge.titleY}
                  fill="#ffffff"
                  fontSize={badge.titleSize}
                  fontWeight="800"
                  style={{
                    textShadow: '0 2px 5px rgba(0,0,0,.55)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {badge.title}
                </text>
                <image
                  href={BADGE_LOGO}
                  x={badge.logoX}
                  y={badge.logoY}
                  width={badge.logoW}
                  height={badge.logoH}
                  preserveAspectRatio="xMinYMin meet"
                />
              </g>
            )
          })()}

          {hallTables.map((table) => {
            const isSelected = selected?.id === table.id
            const isTop = TOP_TABLES.has(table.number)
            const polygonPoints = table.points?.map(([x, y]) => `${x},${y}`).join(' ')
            const polygonCenter = table.points?.reduce(
              (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
              { x: 0, y: 0 },
            )
            const polygonCount = table.points?.length ?? 0
            const className = [
              'floor-table',
              `floor-table-${table.status}`,
              isSelected ? 'is-selected' : '',
              isTop ? 'floor-table-top-tier' : '',
            ].join(' ')
            const cx = polygonCenter && polygonCount > 0 ? polygonCenter.x / polygonCount : table.x + table.width / 2
            const cy = polygonCenter && polygonCount > 0 ? polygonCenter.y / polygonCount : table.y + table.height / 2
            const baseInset = 4
            const outlineInset = 5
            const rx = table.x + outlineInset
            const ry = table.y + outlineInset
            const rw = Math.max(10, table.width - outlineInset * 2)
            const rh = Math.max(10, table.height - outlineInset * 2)
            const hitX = table.x + baseInset
            const hitY = table.y + baseInset
            const hitW = Math.max(12, table.width - baseInset * 2)
            const hitH = Math.max(12, table.height - baseInset * 2)
            const ellipseHitRx = Math.max(6, table.width / 2)
            const ellipseHitRy = Math.max(6, table.height / 2)
            const ellipseRx = Math.max(5, table.width / 2)
            const ellipseRy = Math.max(5, table.height / 2)

            return (
              <g
                key={table.id}
                className={className}
                tabIndex={0}
                onClick={() => onSelect?.(table)}
                onPointerEnter={(event) => setHoverFromPointer(table, event)}
                onPointerMove={(event) => setHoverFromPointer(table, event)}
                onPointerLeave={clearHover}
                onBlur={clearHover}
                onFocus={() => {
                  hoverTableIdRef.current = table.id
                  scheduleTooltipPosition(cx, cy)
                  setHovered({ table, left: cx, top: cy })
                }}
                aria-label={`Стол №${table.number}, ${formatSeats(table.seats, table.seatsMax)}, ${statusWord(table.status)}`}
              >
                {polygonPoints ? (
                  <>
                    <polygon points={polygonPoints} className="floor-table-hit" />
                    <polygon points={polygonPoints} className={`floor-table-outline floor-table-outline-${table.status}`} />
                    {isSelected ? <polygon points={polygonPoints} className={`floor-table-highlight floor-table-highlight-${table.status}`} /> : null}
                  </>
                ) : table.shape === 'round' ? (
                  <>
                    <ellipse cx={cx} cy={cy} rx={ellipseHitRx} ry={ellipseHitRy} className="floor-table-hit" />
                    <ellipse cx={cx} cy={cy} rx={ellipseRx} ry={ellipseRy} className={`floor-table-outline floor-table-outline-${table.status}`} />
                    {isSelected ? <ellipse cx={cx} cy={cy} rx={ellipseRx} ry={ellipseRy} className={`floor-table-highlight floor-table-highlight-${table.status}`} /> : null}
                  </>
                ) : (
                  <>
                    <rect x={hitX} y={hitY} width={hitW} height={hitH} rx={12} className="floor-table-hit" />
                    <rect x={rx} y={ry} width={rw} height={rh} rx={12} className={`floor-table-outline floor-table-outline-${table.status}`} />
                    {isSelected ? <rect x={rx} y={ry} width={rw} height={rh} rx={12} className={`floor-table-highlight floor-table-highlight-${table.status}`} /> : null}
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {hovered ? <TableTooltip state={hovered} tooltipRef={tooltipRef} /> : null}
      </div>

      <div className="floorplan-legend" aria-hidden="true">
        <span><i className="legend-dot legend-free" /> свободен</span>
        <span><i className="legend-dot legend-reserved" /> занят</span>
        <span><i className="legend-dot legend-held" /> на удержании</span>
      </div>

      <p className="floorplan-live" role="status" aria-live="polite">{liveStatus}</p>

      {selectedInHall ? (
        <div className="floorplan-selected">
          <strong>Стол №{selectedInHall.number}</strong>
          <span>{formatSeats(selectedInHall.seats, selectedInHall.seatsMax)} · {zoneLabel(selectedInHall.zone)}</span>
        </div>
      ) : null}
    </div>
  )
}

function TableTooltip({ state, tooltipRef }: { state: HoverState; tooltipRef: { current: HTMLDivElement | null } }) {
  const { table, left, top } = state
  const scene = getTableScene(table.number)
  const noise: TableNoise = getTableNoise(table)

  const x = Math.max(14, Math.min(left + 14, 980))
  const y = Math.max(12, top - 18)

  return (
    <div ref={tooltipRef} className="floor-tooltip" style={{ transform: `translate(${x}px, ${y}px)` }}>
      {scene ? (
        <img className="floor-tooltip__photo" src={scene.imageWebpSm} alt="" loading="lazy" decoding="async" />
      ) : null}
      <div className="floor-tooltip__body">
        <strong>Стол №{table.number}</strong>
        <span className="floor-tooltip__meta">{formatSeats(table.seats, table.seatsMax)} · {zoneLabel(table.zone)}</span>
        <span className={`floor-tooltip__noise floor-tooltip__noise--${noise}`}>{noiseLabel(noise)}</span>
        <span className={`floor-tooltip__status floor-tooltip__status--${table.status}`}>{statusLabel(table.status)}</span>
      </div>
    </div>
  )
}

function noiseLabel(noise: TableNoise) {
  switch (noise) {
    case 'quiet':
      return 'тихо'
    case 'moderate':
      return 'умеренно'
    case 'lively':
      return 'живо'
  }
}

function zoneLabel(zone: MapTable['zone']) {
  switch (zone) {
    case 'window': return 'У окна'
    case 'grill': return 'Открытый гриль'
    case 'bar': return 'Бар'
    case 'lounge': return 'Лаунж'
    case 'banquet': return 'Банкет'
  }
}

function statusLabel(status: MapTable['status']) {
  switch (status) {
    case 'free': return 'Свободен'
    case 'reserved': return 'Занят'
    case 'held': return 'На удержании'
    case 'disabled': return 'Отключен'
  }
}

function statusWord(status: MapTable['status']) {
  switch (status) {
    case 'free': return 'свободен'
    case 'reserved': return 'занят'
    case 'held': return 'на удержании'
    case 'disabled': return 'отключен'
  }
}
