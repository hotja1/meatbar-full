import { useEffect, useRef } from 'react'
import X from 'lucide-react/dist/esm/icons/x.js'
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
}

type Props = {
  open: boolean
  table: MapTable | null
  booking: BookingForm
  onChange: (next: BookingForm) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  state: 'idle' | 'sent'
}

export function BookingDialog({ open, table, booking, onChange, onClose, onSubmit, state }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null)
  const firstFocusRef = useRef<HTMLInputElement | null>(null)
  const scene = table ? getTableScene(table.number) : null
  const copy = table ? getTableSceneCopy(table.number) : null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) {
        try {
          dialog.showModal()
        } catch {
          dialog.setAttribute('open', '')
        }
      }
      const t = window.setTimeout(() => firstFocusRef.current?.focus(), 80)
      return () => window.clearTimeout(t)
    }
    if (dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('close', onClose)
    }
  }, [onClose])

  if (!table) return null

  const seatsLabel = formatSeats(table.seats, table.seatsMax)

  return (
    <dialog ref={ref} className="booking-dialog" aria-labelledby="booking-dialog-title">
      <div className="booking-dialog__backdrop" aria-hidden="true" onClick={onClose} />
      <div className="booking-dialog__shell" role="document">
        <button
          type="button"
          className="booking-dialog__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
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
                onChange={(event) => onChange({ ...booking, guests: Number(event.target.value) })}
              />
            </label>
            <label className="booking-dialog__field">
              Дата
              <input
                required
                type="date"
                value={booking.date}
                onChange={(event) => onChange({ ...booking, date: event.target.value })}
              />
            </label>
            <label className="booking-dialog__field">
              Время
              <input
                required
                type="time"
                value={booking.time}
                onChange={(event) => onChange({ ...booking, time: event.target.value })}
              />
            </label>
          </div>
          <label className="booking-dialog__field">
            Имя
            <input
              required
              value={booking.name}
              onChange={(event) => onChange({ ...booking, name: event.target.value })}
            />
          </label>
          <label className="booking-dialog__field">
            Телефон
            <input
              required
              inputMode="tel"
              placeholder="+7"
              value={booking.phone}
              onChange={(event) => onChange({ ...booking, phone: event.target.value })}
            />
          </label>
          <label className="booking-dialog__field">
            Пожелания
            <textarea
              rows={3}
              placeholder="Например: стол у окна, детский стул, поздний приход..."
              value={booking.comment}
              onChange={(event) => onChange({ ...booking, comment: event.target.value })}
            />
          </label>

          <FireButton type="submit" variant="outline" className="full booking-dialog__submit">
            Подтвердить бронь · Стол №{table.number}
          </FireButton>

          {state === 'sent' ? (
            <p className="booking-dialog__success">
              Заявка сохранена. Администратор свяжется с вами для подтверждения.
            </p>
          ) : null}
        </form>
      </div>
    </dialog>
  )
}
