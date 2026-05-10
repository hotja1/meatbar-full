import { useEffect, useMemo, useState } from 'react'
import Activity from 'lucide-react/dist/esm/icons/activity.js'
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw.js'
import { api } from '../../lib/api'
import type { RestaurantTable } from '../../lib/types'
import { TableMap, type MapTable } from '../../components/TableMap'
import { realisticTables } from '../../data/tables-layout'
import { useRealtimeTables } from '../../hooks/useRealtimeTables'

export function TableMonitor() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.getTables()
      setTables(list)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  useRealtimeTables(setTables)

  const mapped = useMemo<MapTable[]>(() => {
    return (tables as Array<RestaurantTable & { id: number }>).map((t) => {
      const rt = realisticTables.find((r) => r.number === ((t as { number?: number }).number ?? t.id))
      return {
        id: t.id,
        number: (t as { number?: number }).number ?? t.id,
        hall:
          (rt?.hall ??
            (t as { hall?: 1 | 2 | 3 }).hall ??
            (((t as { number?: number }).number ?? t.id) <= 7
              ? 1
              : ((t as { number?: number }).number ?? t.id) <= 21
                ? 2
                : 3)) as 1 | 2 | 3,
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

  const selected = useMemo(
    () => mapped.find((t) => t.number === selectedNumber) ?? null,
    [mapped, selectedNumber],
  )

  const free = mapped.filter((t) => t.status === 'free').length
  const reserved = mapped.filter((t) => t.status === 'reserved').length
  const held = mapped.filter((t) => t.status === 'held').length
  const disabled = mapped.filter((t) => t.status === 'disabled').length

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Зал · мониторинг</div>
          <h1>Карта зала · {mapped.length} {plural(mapped.length, ['стол', 'стола', 'столов'])}</h1>
        </div>
        <button className="btn btn-secondary" onClick={reload}>
          <RefreshCcw size={14} /> Обновить
        </button>
      </div>

      <div className="admin-grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginBottom: 16 }}>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-label">Свободны сейчас</div>
            <div className="admin-stat-value" style={{ color: '#7fc275' }}>{free}</div>
          </div>
          <Activity size={20} color="#7fc275" />
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-label">Забронированы</div>
            <div className="admin-stat-value" style={{ color: '#e87a3a' }}>{reserved}</div>
          </div>
          <Activity size={20} color="#e87a3a" />
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-label">На удержании</div>
            <div className="admin-stat-value" style={{ color: '#d4af37' }}>{held}</div>
          </div>
          <Activity size={20} color="#d4af37" />
        </div>
        <div className="admin-card admin-stat">
          <div>
            <div className="admin-stat-label">Отключены</div>
            <div className="admin-stat-value" style={{ color: '#9ca3af' }}>{disabled}</div>
          </div>
          <Activity size={20} color="#9ca3af" />
        </div>
      </div>

      {loading ? (
        <div className="admin-card empty-state">Загружаем карту…</div>
      ) : (
        <>
          <div className="admin-card" style={{ padding: 18 }}>
            <TableMap
              tables={mapped}
              selected={selected}
              onSelect={(table) => setSelectedNumber(table.number)}
            />
            {selected ? (
              <div style={{ marginTop: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div className="admin-stat-label">Стол</div>
                  <strong>№{selected.number} ({selected.hall === 1 ? 'Зал 1' : selected.hall === 2 ? 'Зал 2' : 'Зал 3'})</strong>
                </div>
                <div>
                  <div className="admin-stat-label">Мест</div>
                  <strong>{selected.seats}</strong>
                </div>
                <div>
                  <div className="admin-stat-label">Зона</div>
                  <strong>{zoneLabel(selected.zone)}</strong>
                </div>
                <div>
                  <div className="admin-stat-label">Статус</div>
                  <strong style={{ color: selected.status === 'free' ? '#7fc275' : selected.status === 'reserved' ? '#e87a3a' : selected.status === 'held' ? '#d4af37' : '#9ca3af' }}>
                    {statusLabel(selected.status)}
                  </strong>
                </div>
              </div>
            ) : null}
          </div>

          <div className="admin-card" style={{ padding: 18, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Все столы списком</h3>
            <div className="admin-tables-grid">
              {mapped
                .slice()
                .sort((a, b) => a.number - b.number)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`admin-table-tile status-${t.status} ${selectedNumber === t.number ? 'is-selected' : ''}`}
                    onClick={() => setSelectedNumber(t.number)}
                  >
                    <div className="row-top">
                      <strong>Стол №{t.number}</strong>
                      <span className={`status-pill status-${t.status}`}>{statusLabel(t.status)}</span>
                    </div>
                    <div className="row-meta">
                      <span>{t.seats} мест</span>
                      <span>· {zoneLabel(t.zone)}</span>
                    </div>
                    <div className="row-scene">{t.scene ?? ''}</div>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
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

function zoneLabel(z: MapTable['zone']) {
  switch (z) {
    case 'window': return 'У окна'
    case 'grill': return 'Гриль-центр'
    case 'bar': return 'Бар'
    case 'lounge': return 'Лаунж'
    case 'banquet': return 'Банкет'
  }
}

function statusLabel(s: MapTable['status']) {
  switch (s) {
    case 'free': return 'свободен'
    case 'reserved': return 'занят'
    case 'held': return 'на удержании'
    case 'disabled': return 'выключен'
  }
}
