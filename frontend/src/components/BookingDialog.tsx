import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import X from 'lucide-react/dist/esm/icons/x.js'
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left.js'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js'
import { FireButton } from './FireButton'
import { formatSeats } from '../data/tables-layout'
import type { MapTable } from './TableMap'
import { getTableScene, getTableSceneCopy } from '../data/tables-scenes'
import './booking-dialog.css'

export type BookingForm = {
  guests: number
  date: string
  time: string
  name: string
  phone: string
  comment: string
  menuChoice: 'on-site' | 'pre-order'
}

type Props = {
  open: boolean
  table: MapTable | null
  booking: BookingForm
  onChange: (next: BookingForm) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onOpenMenu?: () => void
  menuItems: Array<{ title: string; price: number; image?: string }>
  preOrderItems: Map<string, number>
  onPreOrderAdd: (title: string, price: number) => void
  onPreOrderRemove: (title: string) => void
  state: 'idle' | 'sent'
  error?: string
}

/* Часы работы: 11:00–24:00. Последний слот — 23:30. */
const OPEN_HOUR = 11
const CLOSE_HOUR = 24
const SLOT_STEP = 30

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP) {
      if (h === CLOSE_HOUR - 1 && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateRu(dateStr: string): string {
  if (!dateStr) return 'Выберите дату'
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].toLowerCase().slice(0, 3)}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/* ─── Dropdown Calendar ─── */

function CalendarDropdown({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const today = useMemo(() => new Date(), [])
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewMonth, setViewMonth] = useState(() => selected ? selected.getMonth() : today.getMonth())
  const [viewYear, setViewYear] = useState(() => selected ? selected.getFullYear() : today.getFullYear())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }, [viewMonth])

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startDay = (first.getDay() + 6) % 7
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: Array<{ date: Date; inMonth: boolean }> = []
    for (let i = 0; i < startDay; i++) {
      cells.push({ date: new Date(viewYear, viewMonth, 1 - startDay + i), inMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(viewYear, viewMonth, i), inMonth: true })
    }
    while (cells.length < 42) {
      const d = new Date(viewYear, viewMonth + 1, cells.length - startDay - daysInMonth + 1)
      cells.push({ date: d, inMonth: false })
    }
    return cells
  }, [viewYear, viewMonth])

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())

  return (
    <div ref={ref} className="bcal-dropdown">
      <div className="bcal__header">
        <button type="button" className="bcal__nav" onClick={prevMonth} disabled={!canGoPrev} aria-label="Предыдущий месяц">
          <ChevronLeft size={14} />
        </button>
        <span className="bcal__title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className="bcal__nav" onClick={nextMonth} aria-label="Следующий месяц">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="bcal__days">
        {DAY_NAMES.map((d) => <span key={d} className="bcal__dayname">{d}</span>)}
      </div>
      <div className="bcal__grid">
        {days.map(({ date, inMonth }, i) => {
          const isPast = date < today && !isSameDay(date, today)
          const isSelected = selected ? isSameDay(date, selected) : false
          const isToday = isSameDay(date, today)
          const disabled = isPast || !inMonth
          return (
            <button
              key={i}
              type="button"
              className={[
                'bcal__cell',
                isSelected ? 'bcal__cell--selected' : '',
                isToday ? 'bcal__cell--today' : '',
                !inMonth ? 'bcal__cell--out' : '',
              ].join(' ')}
              disabled={disabled}
              onClick={() => { onChange(toDateStr(date)); onClose() }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Time dropdown ─── */

function TimeDropdown({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="btime-dropdown">
      {TIME_SLOTS.map((slot) => (
        <button
          key={slot}
          type="button"
          className={`btime__slot${value === slot ? ' btime__slot--active' : ''}`}
          onClick={() => { onChange(slot); onClose() }}
        >
          {slot}
        </button>
      ))}
    </div>
  )
}

/* ─── Iframe-обёртка для меню предзаказа ─── */

function BookingMenuPanel({
  preOrderItems,
  onPreOrderAdd,
  onPreOrderRemove,
}: {
  preOrderItems: Map<string, number>
  onPreOrderAdd: (title: string, price: number) => void
  onPreOrderRemove: (title: string) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const sentRestore = useRef(false)
  // Фиксируем версию один раз при монтировании — иначе Date.now() при каждом
  // ре-рендере меняет src и iframe перезагружается (скролл к верху, потеря состояния)
  const iframeSrc = useRef(`/booking-menu.html?v=${Date.now()}`)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== 'booking-menu-update') return
      const incoming: Record<string, number> = e.data.selected || {}
      const incomingPrices: Record<string, number> = e.data.prices || {}

      const currentKeys = new Set(preOrderItems.keys())
      const incomingKeys = new Set(Object.keys(incoming))

      for (const title of incomingKeys) {
        const newQty = incoming[title]
        const oldQty = preOrderItems.get(title) ?? 0
        const price = incomingPrices[title] ?? 0
        if (newQty > oldQty) {
          for (let i = 0; i < newQty - oldQty; i++) onPreOrderAdd(title, price)
        } else if (newQty < oldQty) {
          for (let i = 0; i < oldQty - newQty; i++) onPreOrderRemove(title)
        }
      }
      for (const title of currentKeys) {
        if (!incomingKeys.has(title)) {
          const oldQty = preOrderItems.get(title) ?? 0
          for (let i = 0; i < oldQty; i++) onPreOrderRemove(title)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [preOrderItems, onPreOrderAdd, onPreOrderRemove])

  const handleLoad = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return
    if (preOrderItems.size > 0) {
      const sel: Record<string, number> = {}
      preOrderItems.forEach((qty, title) => { sel[title] = qty })
      iframeRef.current.contentWindow.postMessage({
        type: 'booking-menu-restore',
        selected: sel,
      }, '*')
    }
    sentRestore.current = true
  }, [preOrderItems])

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc.current}
      className="bmenu-iframe"
      title="Меню предзаказа"
      onLoad={handleLoad}
    />
  )
}

/* ─── Основной диалог ─── */

export function BookingDialog({ open, table, booking, onChange, onClose, onSubmit, preOrderItems, onPreOrderAdd, onPreOrderRemove, state, error }: Props) {
  const firstFocusRef = useRef<HTMLInputElement | null>(null)
  const [calOpen, setCalOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const scene = table ? getTableScene(table.number) : null
  const copy = table ? getTableSceneCopy(table.number) : null

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => firstFocusRef.current?.focus(), 80)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!table) return null
  if (!open) return null

  const seatsLabel = formatSeats(table.seats, table.seatsMax)

  return (
    <div className="booking-dialog-overlay" onClick={onClose}>
      <div className="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" onClick={(e) => e.stopPropagation()}>
        <div className="booking-dialog__shell" role="document">
          <button type="button" className="booking-dialog__close" onClick={onClose} aria-label="Закрыть">
            <X size={18} aria-hidden="true" />
          </button>

        <div className="booking-dialog__media">
          {scene ? (
            <picture className="booking-dialog__photo">
              <source media="(max-width: 720px)" srcSet={scene.imageAvifSm} type="image/avif-disabled" />
              <source media="(max-width: 720px)" srcSet={scene.imageWebpSm} />
              <source srcSet={scene.imageAvif} type="image/avif-disabled" />
              <img src={scene.imageWebp} alt="" loading="lazy" decoding="async" />
            </picture>
          ) : null}
          <div className="booking-dialog__media-overlay">
            <span className="booking-dialog__kicker">{copy?.kicker ?? `Зал ${table.hall}`}</span>
            <h3 id="booking-dialog-title" className="booking-dialog__title">
              {copy?.headline ?? `Стол №${table.number}`}
            </h3>
            <p className="booking-dialog__desc">{copy?.description ?? table.scene ?? ''}</p>
            <span className="booking-dialog__seats">{seatsLabel}</span>
          </div>
        </div>

        <form className="booking-dialog__form" onSubmit={onSubmit}>
          <div className="booking-dialog__row">
            <label className="booking-dialog__field">
              Гостей
              <input
                ref={firstFocusRef}
                min={1}
                max={Math.max(1, table.seatsMax ?? table.seats)}
                type="number"
                value={booking.guests}
                onChange={(e) => onChange({ ...booking, guests: Number(e.target.value) })}
              />
            </label>

            <div className="booking-dialog__field booking-dialog__field--picker">
              Дата
              <button type="button" className="booking-dialog__picker-btn" onClick={() => { setCalOpen(!calOpen); setTimeOpen(false) }}>
                {formatDateRu(booking.date)}
              </button>
              {calOpen ? (
                <CalendarDropdown
                  value={booking.date}
                  onChange={(date) => onChange({ ...booking, date })}
                  onClose={() => setCalOpen(false)}
                />
              ) : null}
            </div>

            <div className="booking-dialog__field booking-dialog__field--picker">
              Время
              <button type="button" className="booking-dialog__picker-btn" onClick={() => { setTimeOpen(!timeOpen); setCalOpen(false) }}>
                {booking.time || 'Выберите'}
              </button>
              {timeOpen ? (
                <TimeDropdown
                  value={booking.time}
                  onChange={(time) => onChange({ ...booking, time })}
                  onClose={() => setTimeOpen(false)}
                />
              ) : null}
            </div>
          </div>

          <label className="booking-dialog__field">
            Имя
            <input value={booking.name} onChange={(e) => onChange({ ...booking, name: e.target.value })} />
          </label>
          <label className="booking-dialog__field">
            Телефон
            <input inputMode="tel" placeholder="+7" value={booking.phone} onChange={(e) => onChange({ ...booking, phone: e.target.value })} />
          </label>
          <label className="booking-dialog__field">
            Пожелания
            <textarea rows={2} placeholder="Детский стул, поздний приход, аллергии..." value={booking.comment} onChange={(e) => onChange({ ...booking, comment: e.target.value })} />
          </label>

          <div className="bmenu-choice">
            <span className="bmenu-choice__label">Меню</span>
            <div className="bmenu-choice__options">
              <button type="button" className={`bmenu-choice__btn${booking.menuChoice === 'on-site' ? ' bmenu-choice__btn--active' : ''}`} onClick={() => onChange({ ...booking, menuChoice: 'on-site' })}>
                Закажу на месте
              </button>
              <button type="button" className={`bmenu-choice__btn${booking.menuChoice === 'pre-order' ? ' bmenu-choice__btn--active' : ''}`} onClick={() => onChange({ ...booking, menuChoice: 'pre-order' })}>
                Выбрать заранее
              </button>
            </div>
            {booking.menuChoice === 'pre-order' ? (
              <BookingMenuPanel
                preOrderItems={preOrderItems}
                onPreOrderAdd={onPreOrderAdd}
                onPreOrderRemove={onPreOrderRemove}
              />
            ) : null}
          </div>

          <div className="booking-dialog__actions">
            {error ? (
              <p className="booking-dialog__error" role="alert">{error}</p>
            ) : null}
            {booking.menuChoice === 'pre-order' && preOrderItems.size > 0 ? (
              <FireButton type="submit" variant="outline" className="full booking-dialog__submit booking-dialog__submit--pay" data-payment="online">
                Бронь с оплатой
              </FireButton>
            ) : (
              <FireButton type="submit" variant="outline" className="full booking-dialog__submit">
                Забронировать · Стол №{table.number}
              </FireButton>
            )}
          </div>

          {state === 'sent' ? (
            <p className="booking-dialog__success">Заявка сохранена. Администратор свяжется для подтверждения.</p>
          ) : null}
        </form>
      </div>
      </div>
    </div>
  )
}
