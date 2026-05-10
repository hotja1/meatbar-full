import Plus from 'lucide-react/dist/esm/icons/plus.js'
import Save from 'lucide-react/dist/esm/icons/save.js'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { api } from '../../lib/api'
import type { RestaurantTable } from '../../lib/types'
import { useToast } from '../components/Toast'

const ZONES: Array<{ key: RestaurantTable['zone']; label: string; box: { x: number; y: number; w: number; h: number } }> = [
  { key: 'window', label: 'У окна', box: { x: 4, y: 12, w: 70, h: 22 } },
  { key: 'grill', label: 'Гриль-центр', box: { x: 14, y: 36, w: 64, h: 18 } },
  { key: 'bar', label: 'Бар', box: { x: 78, y: 14, w: 18, h: 44 } },
  { key: 'lounge', label: 'Лаунж', box: { x: 14, y: 58, w: 64, h: 18 } },
  { key: 'banquet', label: 'Банкет', box: { x: 18, y: 78, w: 56, h: 16 } },
]

export function TablesEditor() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const [loading, setLoading] = useState(true)
  const floorRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)
  const toast = useToast()

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

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>, table: RestaurantTable) => {
    event.preventDefault()
    setSelected(table)
    if (!table.id) return
    dragState.current = {
      id: table.id,
      offsetX: 0,
      offsetY: 0,
    }
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !floorRef.current) return
    const rect = floorRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setTables((current) =>
      current.map((t) =>
        t.id === dragState.current!.id ? { ...t, x: clamp(x, 1, 99), y: clamp(y, 1, 99) } : t,
      ),
    )
  }

  const onPointerUp = async (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return
    ;(event.target as HTMLElement).releasePointerCapture?.(event.pointerId)
    const id = dragState.current.id
    dragState.current = null
    const updated = tables.find((t) => t.id === id)
    if (!updated) return
    try {
      await api.updateTable(id, { x: updated.x, y: updated.y })
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Не сохранилось')
    }
  }

  const addTable = async () => {
    try {
      const created = await api.createTable({
        title: `Стол ${tables.length + 1}`,
        zone: 'window',
        seats: 2,
        status: 'free',
        x: 50,
        y: 50,
        hall: 1,
        number: tables.length + 1,
        width: 70,
        height: 60,
        shape: 'rect',
        scene: 'новое место',
      })
      toast('success', 'Стол добавлен')
      setTables([...tables, created])
      setSelected(created)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const updateSelected = async (patch: Partial<RestaurantTable>) => {
    if (!selected || !selected.id) return
    const next = { ...selected, ...patch }
    setSelected(next)
    setTables((all) => all.map((t) => (t.id === selected.id ? next : t)))
  }

  const saveSelected = async () => {
    if (!selected || !selected.id) return
    try {
      const saved = await api.updateTable(selected.id, selected)
      toast('success', 'Сохранено')
      setTables((all) => all.map((t) => (t.id === selected.id ? saved : t)))
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const deleteSelected = async () => {
    if (!selected || !selected.id) return
    if (!confirm(`Удалить стол «${selected.title}»?`)) return
    try {
      await api.deleteTable(selected.id)
      toast('success', 'Удалено')
      setTables((all) => all.filter((t) => t.id !== selected.id))
      setSelected(null)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Контент</div>
          <h1>Зал · {tables.length} {plural(tables.length, ['стол', 'стола', 'столов'])}</h1>
        </div>
        <button className="btn btn-primary" onClick={addTable}><Plus size={14} /> Новый стол</button>
      </div>

      {loading ? (
        <div className="admin-card empty-state">Загружаем зал…</div>
      ) : (
        <div className="admin-grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Схема зала</h2>
                <p>Перетаскивайте столы прямо по плану. Изменения сохраняются автоматически.</p>
              </div>
            </div>
            <div
              className="tables-floor"
              ref={floorRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {ZONES.map((zone) => (
                <div
                  key={zone.key}
                  className="floor-zone"
                  style={{
                    left: `${zone.box.x}%`,
                    top: `${zone.box.y}%`,
                    width: `${zone.box.w}%`,
                    height: `${zone.box.h}%`,
                  }}
                >
                  {zone.label}
                </div>
              ))}
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`table-pin ${table.status} ${selected?.id === table.id ? 'selected' : ''}`}
                  style={{ left: `${table.x}%`, top: `${table.y}%` }}
                  onPointerDown={(e) => onPointerDown(e, table)}
                >
                  {table.seats}
                  <small>{table.title}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Свойства</h2>
                <p>{selected ? selected.title : 'Выберите стол на схеме'}</p>
              </div>
            </div>
            {selected ? (
              <div>
                <div className="field-row">
                  <label>Название</label>
                  <input className="input" value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} />
                </div>
                <div className="field-grid">
                  <div className="field-row">
                    <label>Зона</label>
                    <select className="select" value={selected.zone} onChange={(e) => updateSelected({ zone: e.target.value as RestaurantTable['zone'] })}>
                      {ZONES.map((z) => (
                        <option key={z.key} value={z.key}>{z.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-row">
                    <label>Мест</label>
                    <input type="number" min={1} max={20} className="input" value={selected.seats} onChange={(e) => updateSelected({ seats: Number(e.target.value) })} />
                  </div>
                  <div className="field-row">
                    <label>Статус</label>
                    <select className="select" value={selected.status} onChange={(e) => updateSelected({ status: e.target.value as RestaurantTable['status'] })}>
                      <option value="free">Свободен</option>
                      <option value="reserved">Забронирован</option>
                      <option value="held">Удерживается</option>
                      <option value="disabled">Выключен</option>
                    </select>
                  </div>
                </div>
                <div className="field-grid">
                  <div className="field-row">
                    <label>Зал</label>
                    <select className="select" value={selected.hall ?? 1} onChange={(e) => updateSelected({ hall: Number(e.target.value) as 1 | 2 | 3 })}>
                      <option value={1}>Зал 1</option>
                      <option value={2}>Зал 2</option>
                      <option value={3}>Зал 3</option>
                    </select>
                  </div>
                  <div className="field-row">
                    <label>№ стола</label>
                    <input type="number" min={1} max={300} className="input" value={selected.number ?? selected.id} onChange={(e) => updateSelected({ number: Number(e.target.value) })} />
                  </div>
                  <div className="field-row">
                    <label>Форма</label>
                    <select className="select" value={selected.shape ?? 'rect'} onChange={(e) => updateSelected({ shape: e.target.value as 'rect' | 'round' })}>
                      <option value="rect">Прямоугольный</option>
                      <option value="round">Круглый</option>
                    </select>
                  </div>
                  <div className="field-row">
                    <label>Ширина</label>
                    <input type="number" min={30} max={300} className="input" value={selected.width ?? 70} onChange={(e) => updateSelected({ width: Number(e.target.value) })} />
                  </div>
                  <div className="field-row">
                    <label>Высота</label>
                    <input type="number" min={30} max={300} className="input" value={selected.height ?? 60} onChange={(e) => updateSelected({ height: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="field-row">
                  <label>Атмосфера</label>
                  <input className="input" value={selected.scene ?? ''} onChange={(e) => updateSelected({ scene: e.target.value })} placeholder="у окна, мягкий свет" />
                </div>
                <div className="field-row">
                  <label>Заметка</label>
                  <input className="input" value={selected.notes ?? ''} onChange={(e) => updateSelected({ notes: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveSelected}><Save size={14} /> Сохранить</button>
                  <button className="btn btn-danger" onClick={deleteSelected}><Trash2 size={14} /> Удалить</button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Кликните по столу</h3>
                <p>На схеме слева, чтобы редактировать или передвинуть его.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}
