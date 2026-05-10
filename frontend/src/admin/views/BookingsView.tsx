import Check from 'lucide-react/dist/esm/icons/check.js'
import Filter from 'lucide-react/dist/esm/icons/filter.js'
import Search from 'lucide-react/dist/esm/icons/search.js'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js'
import X from 'lucide-react/dist/esm/icons/x.js'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { Booking } from '../../lib/types'
import { useToast } from '../components/Toast'

type ServerBooking = Booking & { table_title?: string }

export function BookingsView() {
  const [items, setItems] = useState<ServerBooking[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.listBookings()
      setItems(list as ServerBooking[])
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Не удалось загрузить брони')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    return items
      .filter((b) => (filter === 'all' ? true : (b.status ?? 'pending') === filter))
      .filter((b) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          b.name.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          (b.table_title ?? b.table ?? '').toLowerCase().includes(q)
        )
      })
  }, [items, filter, query])

  const setStatus = async (id: number, status: string) => {
    try {
      await api.updateBooking(id, { status: status as Booking['status'] })
      toast('success', 'Статус обновлён')
      reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Удалить бронь?')) return
    try {
      await api.deleteBooking(id)
      toast('success', 'Бронь удалена')
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
          <h1>Брони</h1>
        </div>
        <div className="admin-search">
          <Search size={14} color="var(--admin-muted)" />
          <input
            placeholder="Поиск по имени, телефону, столу"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2>{filtered.length} {plural(filtered.length, ['заявка', 'заявки', 'заявок'])}</h2>
            <p>Можно подтверждать, отменять, переключать статус и удалять.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={14} color="var(--admin-muted)" />
            {[
              { key: 'all', label: 'Все' },
              { key: 'pending', label: 'Ожидают' },
              { key: 'confirmed', label: 'Подтверждены' },
              { key: 'arrived', label: 'Пришли' },
              { key: 'cancelled', label: 'Отменены' },
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
          <div className="empty-state">
            <h3>Ничего не найдено</h3>
            <p>Попробуйте сменить фильтр или поиск.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Гость</th>
                  <th>Стол</th>
                  <th>Дата · время</th>
                  <th>Гостей</th>
                  <th>Статус</th>
                  <th>Создана</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.name}</strong>
                      <br />
                      <small style={{ color: 'var(--admin-muted)' }}>
                        <a href={`tel:${b.phone}`} style={{ color: 'inherit' }}>{b.phone}</a>
                      </small>
                      {b.comment ? (
                        <>
                          <br />
                          <small style={{ color: 'var(--admin-muted)' }}>{b.comment}</small>
                        </>
                      ) : null}
                    </td>
                    <td>{b.table_title ?? b.table}</td>
                    <td>{b.date} <small style={{ color: 'var(--admin-muted)' }}>{b.time}</small></td>
                    <td>{b.guests}</td>
                    <td>
                      <select
                        className="select"
                        value={b.status ?? 'pending'}
                        onChange={(e) => b.id && setStatus(b.id, e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="confirmed">Подтверждена</option>
                        <option value="arrived">Пришли</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    </td>
                    <td><small style={{ color: 'var(--admin-muted)' }}>{formatTime(b.createdAt)}</small></td>
                    <td>
                      <div className="actions">
                        {b.status !== 'confirmed' && (
                          <button className="btn btn-success btn-icon" title="Подтвердить" onClick={() => b.id && setStatus(b.id, 'confirmed')}>
                            <Check size={14} />
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button className="btn btn-icon" title="Отменить" onClick={() => b.id && setStatus(b.id, 'cancelled')}>
                            <X size={14} />
                          </button>
                        )}
                        <button className="btn btn-danger btn-icon" title="Удалить" onClick={() => b.id && remove(b.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}
