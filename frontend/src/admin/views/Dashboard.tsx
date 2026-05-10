import Activity from 'lucide-react/dist/esm/icons/activity.js'
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2.js'
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.js'
import CreditCard from 'lucide-react/dist/esm/icons/credit-card.js'
import Flame from 'lucide-react/dist/esm/icons/flame.js'
import Soup from 'lucide-react/dist/esm/icons/soup.js'
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js'
import Wallet from 'lucide-react/dist/esm/icons/wallet.js'
import { useEffect, useState } from 'react'
import { API_BASE, getToken } from '../../lib/api'
import type { Booking, Order } from '../../lib/types'

type Stats = {
  bookingsTotal: number
  bookingsToday: number
  ordersTotal: number
  ordersToday: number
  revenue: number
  tablesFree: number
  tablesTotal: number
  itemsTotal: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [latestBookings, setLatestBookings] = useState<Booking[]>([])
  const [latestOrders, setLatestOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    try {
      const token = getToken()
      const [s, b, o] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ])
      setStats(s)
      setLatestBookings(b.slice(0, 5))
      setLatestOrders(o.slice(0, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить статистику')
    }
  }

  useEffect(() => {
    reload()
    const interval = setInterval(reload, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Сводка</div>
          <h1>Добрый вечер, владелец 🔥</h1>
        </div>
        <button className="btn btn-primary" onClick={reload}>
          <Activity size={14} /> Обновить
        </button>
      </div>

      {error ? <div className="admin-card" style={{ marginBottom: 18, color: '#ffb1b6' }}>{error}</div> : null}

      <div className="kpi-grid">
        <KpiCard label="Брони · сегодня" value={stats?.bookingsToday ?? '—'} delta={`всего ${stats?.bookingsTotal ?? 0}`} icon={CalendarCheck2} />
        <KpiCard label="Заказы · сегодня" value={stats?.ordersToday ?? '—'} delta={`всего ${stats?.ordersTotal ?? 0}`} icon={ClipboardList} />
        <KpiCard label="Свободные столы" value={stats ? `${stats.tablesFree}/${stats.tablesTotal}` : '—'} delta="зал в реальном времени" icon={Sparkles} deltaKind="muted" />
        <KpiCard label="Выручка (оплачено)" value={stats ? `${formatPrice(stats.revenue)} ₽` : '—'} delta="через ЮKassa" icon={Wallet} deltaKind="success" />
        <KpiCard label="Позиций в меню" value={stats?.itemsTotal ?? '—'} delta="управляйте в разделе «Меню»" icon={Soup} deltaKind="muted" />
        <KpiCard label="Атмосфера" value="Огонь горит" delta="гриль · бар · север" icon={Flame} deltaKind="muted" />
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Последние брони</h2>
              <p>5 самых свежих заявок на стол</p>
            </div>
          </div>
          {latestBookings.length === 0 ? (
            <div className="empty-state"><h3>Пока тихо</h3><p>Брони появятся здесь автоматически.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Имя</th><th>Стол</th><th>Дата</th><th>Гости</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {latestBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.name}</strong><br /><small style={{ color: 'var(--admin-muted)' }}>{b.phone}</small></td>
                    <td>{(b as Booking & { table_title?: string }).table_title ?? b.table}</td>
                    <td>{b.date} {b.time}</td>
                    <td>{b.guests}</td>
                    <td><span className={`status-pill ${b.status ?? 'pending'}`}>{statusLabel(b.status ?? 'pending')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Последние заказы</h2>
              <p>5 свежих заказов на доставку/самовывоз</p>
            </div>
          </div>
          {latestOrders.length === 0 ? (
            <div className="empty-state"><h3>Корзина пуста</h3><p>Заказы появятся здесь.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Телефон</th><th>Сумма</th><th>Оплата</th><th>Статус</th></tr>
              </thead>
              <tbody>
                {latestOrders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.phone}</td>
                    <td>{formatPrice(o.total)} ₽</td>
                    <td>
                      <span className={`status-pill ${o.payment === 'paid' ? 'paid' : 'pending'}`}>
                        <CreditCard size={11} /> {o.payment}
                      </span>
                    </td>
                    <td><span className={`status-pill ${o.status ?? 'new'}`}>{statusLabel(o.status ?? 'new')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  deltaKind = 'success',
}: {
  label: string
  value: string | number
  delta?: string
  icon: React.ComponentType<{ size?: number }>
  deltaKind?: 'success' | 'warn' | 'muted'
}) {
  return (
    <div className="kpi-card">
      <div className="icon-pill"><Icon size={16} /></div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta ? <div className={`delta ${deltaKind === 'success' ? '' : deltaKind}`}>{delta}</div> : null}
    </div>
  )
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Подтверждена',
    cancelled: 'Отменена',
    arrived: 'Гость пришёл',
    new: 'Новый',
    cooking: 'Готовится',
    ready: 'Готов',
    done: 'Завершён',
  }
  return map[status] ?? status
}
