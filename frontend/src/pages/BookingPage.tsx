import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { MenuCategory } from '../data/menu'
import { FireText } from '../components/FireText'
import { SharedHeader } from '../components/SharedHeader'
import { realisticTables } from '../data/tables-layout'
import type { MapTable } from '../components/TableMap'
import { useRealtimeTables } from '../hooks/useRealtimeTables'
import { api } from '../lib/api'
import type { RestaurantTable } from '../lib/types'
import { trackEvent } from '../lib/analytics'
import '../App.css'

const TableMap = lazy(() => import('../components/TableMap').then((m) => ({ default: m.TableMap })))
const BookingDialog = lazy(() =>
  import('../components/BookingDialog').then((m) => ({ default: m.BookingDialog })),
)

type Table = RestaurantTable

type Booking = {
  table: string
  tableId?: number
  guests: number
  date: string
  time: string
  name: string
  phone: string
  comment: string
  menuChoice: 'on-site' | 'pre-order'
}

const fallbackTables: Table[] = realisticTables.map((table) => ({
  id: table.id,
  title: `Стол №${table.number}`,
  zone: table.zone,
  seats: table.seats,
  status: table.status,
  x: table.x,
  y: table.y,
  scene: table.scene ?? '',
  hall: table.hall,
  number: table.number,
  width: table.width,
  height: table.height,
  shape: table.shape,
}))

const tablesByNumber = new Map(realisticTables.map((t) => [t.number, t]))
const tablesById = new Map(realisticTables.map((t) => [t.id, t]))

const MY_TABLE_KEY = 'meatbar:my-table'
const MENU_CACHE_KEY = 'meatbar:menu-cache'

function readMyTableId(): number | null {
  try {
    const raw = window.localStorage.getItem(MY_TABLE_KEY)
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch { return null }
}

function writeMyTableId(id: number) {
  try { window.localStorage.setItem(MY_TABLE_KEY, String(id)) } catch { /* noop */ }
}

function readMenuCache(): MenuCategory[] {
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) =>
      c && typeof c === 'object' && typeof (c as { name?: unknown }).name === 'string' && Array.isArray((c as { items?: unknown[] }).items),
    ) as MenuCategory[]
  } catch { return [] }
}

function normalizeTable(table: RestaurantTable): Table | null {
  const mapTable = tablesByNumber.get(table.number ?? table.id) ?? tablesById.get(table.id)
  if (!mapTable) {
    const number = table.number ?? table.id
    return {
      id: table.id,
      title: table.title?.startsWith('Стол №') ? table.title : `Стол №${number}`,
      zone: table.zone,
      seats: table.seats,
      status: table.status,
      x: table.x,
      y: table.y,
      scene: table.scene ?? '',
      hall: table.hall ?? (number <= 21 ? 1 : 2),
      number,
      width: table.width,
      height: table.height,
      shape: table.shape,
      notes: table.notes,
    }
  }
  return {
    id: table.id,
    title: table.title?.startsWith('Стол №') ? table.title : `Стол №${mapTable.number}`,
    zone: mapTable.zone,
    seats: mapTable.seats,
    status: table.status ?? mapTable.status,
    x: mapTable.x,
    y: mapTable.y,
    scene: mapTable.scene ?? table.scene ?? '',
    hall: mapTable.hall,
    number: mapTable.number,
    width: mapTable.width,
    height: mapTable.height,
    shape: mapTable.shape,
    notes: table.notes,
  }
}

export function BookingPage() {
  const [menu, setMenu] = useState<MenuCategory[]>(() => readMenuCache())
  const [tables, setTables] = useState<Table[]>(fallbackTables)
  const [selectedTable, setSelectedTable] = useState<Table>(() => {
    const savedId = readMyTableId()
    if (savedId != null) {
      const saved = fallbackTables.find((t) => t.id === savedId)
      if (saved) return saved
    }
    return fallbackTables[0]
  })
  const [booking, setBooking] = useState<Booking>({
    table: fallbackTables[0].title,
    tableId: fallbackTables[0].id,
    guests: 2,
    date: '',
    time: '',
    name: '',
    phone: '',
    comment: '',
    menuChoice: 'on-site',
  })
  const [bookingState, setBookingState] = useState<'idle' | 'sent'>('idle')
  const [bookingError, setBookingError] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [preOrderItems, setPreOrderItems] = useState<Map<string, number>>(new Map())
  const sectionRef = useRef<HTMLElement | null>(null)

  useRealtimeTables(setTables)

  useEffect(() => {
    let mounted = true
    api.getMenu().then((m) => {
      if (Array.isArray(m) && m.length && mounted) setMenu(m as MenuCategory[])
    }).catch(() => {
      // Fallback: load from local data
      import('../data/menu').then((mod) => {
        if (mounted && mod.menu.length) setMenu(mod.menu)
      }).catch(() => {})
    })
    api.getTables().then((t) => {
      if (!Array.isArray(t) || !t.length) return
      const normalized = t.map(normalizeTable).filter((x): x is Table => x !== null)
      if (!normalized.length || !mounted) return
      setTables(normalized)
      const savedId = readMyTableId()
      const savedTable = savedId != null ? normalized.find((x) => x.id === savedId && x.status !== 'reserved') : null
      const firstFree = savedTable ?? normalized.find((x) => x.status === 'free') ?? normalized[0]
      setSelectedTable(firstFree)
      setBooking((c) => ({ ...c, table: firstFree.title, tableId: firstFree.id }))
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const mappedTables = useMemo<MapTable[]>(() => {
    return (tables as Array<Table & { id: number }>).map((t) => {
      const rt = realisticTables.find((r) => r.number === ((t as { number?: number }).number ?? t.id))
      return {
        id: t.id,
        number: (t as { number?: number }).number ?? t.id,
        hall: (rt?.hall ?? (t as { hall?: 1 | 2 | 3 }).hall ?? (((t as { number?: number }).number ?? t.id) <= 7 ? 1 : ((t as { number?: number }).number ?? t.id) <= 21 ? 2 : 3)) as 1 | 2 | 3,
        zone: rt?.zone ?? t.zone,
        seats: rt?.seats ?? t.seats,
        status: rt?.status ?? t.status,
        x: rt?.x ?? t.x,
        y: rt?.y ?? t.y,
        width: rt?.width ?? t.width ?? 70,
        height: rt?.height ?? t.height ?? 60,
        shape: (rt?.shape ?? t.shape ?? 'rect') as 'rect' | 'round',
        scene: rt?.scene ?? t.scene,
      }
    })
  }, [tables])

  const chooseTable = (table: Table) => {
    if (table.status === 'reserved') return
    setSelectedTable(table)
    writeMyTableId(table.id)
    setBooking((c) => ({ ...c, table: table.title, tableId: table.id, guests: Math.min(c.guests, table.seats) }))
    setBookingState('idle')
  }

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!booking.name || !booking.phone || !booking.date || !booking.time) {
      setBookingError('Укажите имя, телефон, дату и время')
      trackEvent('booking_submit_invalid', { table_id: selectedTable.id, guests: booking.guests })
      return
    }
    setBookingError('')
    const preOrder = booking.menuChoice === 'pre-order' && preOrderItems.size > 0
      ? Array.from(preOrderItems.entries()).map(([title, qty]) => {
          const item = menu.flatMap((c) => c.items).find((i) => i.title === title)
          return { title, qty, price: item?.price ?? 0 }
        })
      : undefined
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const paymentMethod = submitter?.dataset.payment === 'online' ? 'online' as const : 'none' as const
    try {
      const result = await api.createBooking({
        table: selectedTable.title,
        tableId: selectedTable.id,
        guests: booking.guests,
        date: booking.date,
        time: booking.time,
        name: booking.name,
        phone: booking.phone,
        comment: booking.comment.trim() || undefined,
        preOrder,
        paymentMethod,
      })
      setBookingState('sent')
      trackEvent('booking_submit_success', { table_id: selectedTable.id, guests: booking.guests, payment: paymentMethod })
      if (paymentMethod === 'online' && result) {
        trackEvent('booking_payment_initiated', { table_id: selectedTable.id })
      }
    } catch {
      setBookingState('sent')
      trackEvent('booking_submit_failed', { table_id: selectedTable.id, guests: booking.guests })
    }
  }

  return (
    <>
      <SharedHeader onOpenCart={() => {}} />
      <main className="booking-page">
        <section ref={sectionRef} className="booking-section booking-section--floor" id="booking">
          <div className="section-intro row">
            <div>
              <span className="chapter">Бронь столика</span>
              <FireText as="h2" intensity="strong" stagger={26}>Выберите место в зале — как в жизни.</FireText>
            </div>
            <p className="subtitle-reveal">
              Откройте зал и нажмите на свой столик — откроется большой просмотр
              с живым фото места и форма брони в одном экране. Администратор
              подтвердит время звонком.
            </p>
          </div>

          <div className="booking-experience booking-experience--floor">
            <div className="booking-floor booking-floor--solo">
              <Suspense
                fallback={
                  <div className="floorplan" aria-hidden="true">
                    <div className="floorplan-stage" style={{ minHeight: 520 }} />
                  </div>
                }
              >
                <TableMap
                  tables={mappedTables}
                  selected={mappedTables.find((t) => t.id === selectedTable.id) ?? null}
                  onSelect={(t) => {
                    const matched = (tables as Table[]).find((x) => x.id === t.id)
                    if (!matched) return
                    chooseTable({ ...matched, seats: t.seats, hall: t.hall, number: t.number } as Table)
                    setBookingState('idle')
                    setBookingOpen(true)
                    if (!menu.length) {
                      api.getMenu().then((m) => {
                        if (Array.isArray(m) && m.length) setMenu(m as MenuCategory[])
                      }).catch(() => {})
                    }
                    trackEvent('booking_dialog_open', { table_id: matched.id, table_number: matched.number, hall: t.hall })
                  }}
                />
              </Suspense>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <BookingDialog
            open={bookingOpen}
            table={bookingOpen ? mappedTables.find((t) => t.id === selectedTable.id) ?? null : null}
            booking={{
              guests: booking.guests,
              date: booking.date,
              time: booking.time,
              name: booking.name,
              phone: booking.phone,
              comment: booking.comment,
              menuChoice: booking.menuChoice,
            }}
            onChange={(next) => setBooking({ ...booking, guests: next.guests, date: next.date, time: next.time, name: next.name, phone: next.phone, comment: next.comment, menuChoice: next.menuChoice })}
            onClose={() => setBookingOpen(false)}
            onOpenMenu={() => {}}
            menuItems={menu.flatMap((cat) => cat.items.filter((i) => i.available !== false).map((item) => ({ title: item.title, price: item.price, image: item.image })))}
            preOrderItems={preOrderItems}
            onPreOrderAdd={(title) => {
              setPreOrderItems((prev) => { const next = new Map(prev); next.set(title, (next.get(title) ?? 0) + 1); return next })
            }}
            onPreOrderRemove={(title) => {
              setPreOrderItems((prev) => { const next = new Map(prev); const qty = (next.get(title) ?? 0) - 1; if (qty <= 0) next.delete(title); else next.set(title, qty); return next })
            }}
            onSubmit={submitBooking}
            state={bookingState}
            error={bookingError}
          />
        </Suspense>
      </main>
    </>
  )
}
