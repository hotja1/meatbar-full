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
  hall: 1 | 2
  zone: 'window' | 'grill' | 'bar' | 'lounge' | 'banquet'
  seats: number
  seatsMax?: number
  status: 'free' | 'reserved' | 'held' | 'disabled'
  x: number
  y: number
  width: number
  height: number
  shape?: 'rect' | 'round'
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

const HALL_IMAGE: Record<1 | 2, string> = {
  1: '/assets/tables/hall-1-layout.png',
  2: '/assets/tables/hall-2-lounge-layout.png',
}

export function TableMap({ tables, selected, onSelect }: TableMapProps) {
  const [activeHall, setActiveHall] = useState<1 | 2>(1)
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
    const byHall = (hall: 1 | 2) => tables.filter((t) => t.hall === hall && t.status !== 'disabled')
    const free = (hall: 1 | 2) => byHall(hall).filter((t) => t.status === 'free').length
    return {
      free1: free(1),
      free2: free(2),
      total1: byHall(1).length,
      total2: byHall(2).length,
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
          <button
            type="button"
            role="tab"
            aria-selected={activeHall === 1}
            aria-controls="floorplan-stage"
            className={activeHall === 1 ? 'active' : ''}
            onClick={() => setActiveHall(1)}
          >
            <span>Зал 1 · Открытый гриль</span>
            <small>{counts.free1} из {counts.total1} свободно</small>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeHall === 2}
            aria-controls="floorplan-stage"
            className={activeHall === 2 ? 'active' : ''}
            onClick={() => setActiveHall(2)}
          >
            <span>Зал 2 · Лаунж и бар</span>
            <small>{counts.free2} из {counts.total2} свободно</small>
          </button>
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

          {hallTables.map((table) => {
            const isSelected = selected?.id === table.id
            const isTop = TOP_TABLES.has(table.number)
            const className = [
              'floor-table',
              `floor-table-${table.status}`,
              isSelected ? 'is-selected' : '',
              isTop ? 'floor-table-top-tier' : '',
            ].join(' ')
            const cx = table.x + table.width / 2
            const cy = table.y + table.height / 2

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
                {table.shape === 'round' ? (
                  <>
                    <circle cx={cx} cy={cy} r={Math.min(table.width, table.height) / 2} className="floor-table-hit" />
                    {isSelected ? <circle cx={cx} cy={cy} r={Math.min(table.width, table.height) / 2} className={`floor-table-highlight floor-table-highlight-${table.status}`} /> : null}
                  </>
                ) : (
                  <>
                    <rect x={table.x} y={table.y} width={table.width} height={table.height} rx={12} className="floor-table-hit" />
                    {isSelected ? <rect x={table.x} y={table.y} width={table.width} height={table.height} rx={12} className={`floor-table-highlight floor-table-highlight-${table.status}`} /> : null}
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
        <span className={`floor-tooltip__noise floor-tooltip__noise--${noise}`}>{noise}</span>
        <span className={`floor-tooltip__status floor-tooltip__status--${table.status}`}>{statusLabel(table.status)}</span>
      </div>
    </div>
  )
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
