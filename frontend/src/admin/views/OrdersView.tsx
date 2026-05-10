import Filter from 'lucide-react/dist/esm/icons/filter.js'
import Search from 'lucide-react/dist/esm/icons/search.js'
import Truck from 'lucide-react/dist/esm/icons/truck.js'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { Order } from '../../lib/types'
import { useToast } from '../components/Toast'

type ServerOrder = Order & { items: Array<{ id?: number; title: string; price: number; quantity: number }> }

const STATUS_FLOW: Order['status'][] = ['new', 'confirmed', 'cooking', 'ready', 'done']

export function OrdersView() {
  const [items, setItems] = useState<ServerOrder[]>([])
  const [filter, setFilter] = useState<string>('active')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const reload = async () => {
    setLoading(true)
    try {
      const list = (await api.listOrders()) as ServerOrder[]
      setItems(list)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    return items
      .filter((o) => {
        if (filter === 'active') return o.status !== 'done' && o.status !== 'cancelled'
        if (filter === 'all') return true
        return o.status === filter
      })
      .filter((o) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          (o.phone ?? '').toLowerCase().includes(q) ||
          (o.name ?? '').toLowerCase().includes(q) ||
          String(o.id).includes(q)
        )
      })
  }, [items, filter, query])

  const setStatus = async (id: number, status: string) => {
    try {
      await api.updateOrder(id, { status: status as Order['status'] })
      toast('success', 'Статус обновлён')
      reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Управление</div>
          <h1>Заказы</h1>
        </div>
        <div className="admin-search">
          <Search size={14} color="var(--admin-muted)" />
          <input
            placeholder="Поиск по телефону, имени или #id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>{filtered.length} в работе</h2>
            <p>Двигайте статус по этапам: новый → подтверждён → готовится → готов → завершён.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={14} color="var(--admin-muted)" />
            {[
              { key: 'active', label: 'Активные' },
              { key: 'new', label: 'Новые' },
              { key: 'cooking', label: 'Готовятся' },
              { key: 'ready', label: 'Готовы' },
              { key: 'done', label: 'Завершённые' },
              { key: 'all', label: 'Все' },
            ].map((f) => (
              <button
                key={f.key}
                className={filter === f.key ? 'btn btn-primary' : 'btn btn-ghost'}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Загружаем…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><h3>Заказов нет</h3><p>Когда появятся — увидите здесь.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((o) => (
              <div key={o.id} className="admin-card" style={{ padding: 16, background: 'var(--admin-panel-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Заказ #{o.id}</h3>
                    <p style={{ margin: '2px 0 8px', color: 'var(--admin-muted)', fontSize: '0.86rem' }}>
                      {o.name ? `${o.name} · ` : ''}<a href={`tel:${o.phone}`} style={{ color: 'inherit' }}>{o.phone}</a>
                      {' · '}
                      <Truck size={11} style={{ verticalAlign: 'middle' }} /> {o.delivery === 'delivery' ? `доставка${o.address ? ` (${o.address})` : ''}` : 'самовывоз'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatPrice(o.total)} ₽</div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                      <span className={`status-pill ${o.payment === 'paid' ? 'paid' : 'pending'}`}>{o.payment}</span>
                      <span className={`status-pill ${o.status ?? 'new'}`}>{statusLabel(o.status ?? 'new')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--admin-line)', paddingTop: 10, marginTop: 6 }}>
                  {o.items.map((line) => (
                    <div key={line.itemId ?? line.title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '3px 0', color: 'var(--admin-muted)' }}>
                      <span>{line.title}</span>
                      <span>× {line.quantity} · {formatPrice(line.price * line.quantity)} ₽</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s}
                      className={(o.status ?? 'new') === s ? 'btn btn-primary' : 'btn'}
                      onClick={() => o.id && setStatus(o.id, s ?? 'new')}
                    >
                      {statusLabel(s ?? 'new')}
                    </button>
                  ))}
                  <button className="btn btn-danger" onClick={() => o.id && setStatus(o.id, 'cancelled')}>
                    Отменить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    new: 'Новый',
    confirmed: 'Подтверждён',
    cooking: 'Готовится',
    ready: 'Готов',
    done: 'Завершён',
    cancelled: 'Отменён',
  }
  return map[status] ?? status
}
