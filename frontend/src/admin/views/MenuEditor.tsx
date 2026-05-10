import Pencil from 'lucide-react/dist/esm/icons/pencil.js'
import Plus from 'lucide-react/dist/esm/icons/plus.js'
import Save from 'lucide-react/dist/esm/icons/save.js'
import Star from 'lucide-react/dist/esm/icons/star.js'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { MenuCategory, MenuItem } from '../../lib/types'
import { useToast } from '../components/Toast'

export function MenuEditor() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const toast = useToast()

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.getMenu()
      setCategories(list)
      if (list.length && (activeId == null || !list.find((c) => c.id === activeId))) {
        setActiveId(list[0].id ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const active = useMemo(
    () => categories.find((c) => c.id === activeId) ?? categories[0],
    [categories, activeId],
  )

  const addCategory = async () => {
    const name = prompt('Название новой категории:')
    if (!name) return
    try {
      await api.createCategory(name, categories.length)
      toast('success', 'Категория создана')
      await reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const renameCategory = async (cat: MenuCategory) => {
    const name = prompt('Новое название:', cat.name)
    if (!name || !cat.id) return
    try {
      await api.updateCategory(cat.id, { name })
      toast('success', 'Сохранено')
      await reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const deleteCategory = async (cat: MenuCategory) => {
    if (!cat.id) return
    if (!confirm(`Удалить категорию «${cat.name}» со всеми блюдами?`)) return
    try {
      await api.deleteCategory(cat.id)
      toast('success', 'Удалено')
      await reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const startNewItem = () => {
    if (!active?.id) return
    setEditingItem({ title: '', price: 0, weight: '', description: '', available: true, featured: false })
  }

  const editItem = (item: MenuItem) => setEditingItem({ ...item })
  const cancelEdit = () => setEditingItem(null)

  const saveItem = async () => {
    if (!editingItem || !active?.id) return
    if (!editingItem.title || editingItem.price == null) {
      toast('error', 'Нужны название и цена')
      return
    }
    try {
      if (editingItem.id) {
        await api.updateMenuItem(editingItem.id, editingItem)
      } else {
        await api.createMenuItem(active.id, editingItem)
      }
      toast('success', 'Сохранено')
      setEditingItem(null)
      await reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const deleteItem = async (item: MenuItem) => {
    if (!item.id) return
    if (!confirm(`Удалить блюдо «${item.title}»?`)) return
    try {
      await api.deleteMenuItem(item.id)
      toast('success', 'Удалено')
      await reload()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Контент</div>
          <h1>Меню</h1>
        </div>
        <button className="btn btn-primary" onClick={startNewItem} disabled={!active}>
          <Plus size={14} /> Добавить блюдо
        </button>
      </div>

      {loading ? (
        <div className="admin-card empty-state">Загружаем меню…</div>
      ) : (
        <div className="menu-editor-layout">
          <div className="cat-list">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={cat.id === active?.id ? 'active' : ''}
                onClick={() => setActiveId(cat.id ?? null)}
              >
                <strong>{cat.name}</strong>
                <small>{cat.items.length} {plural(cat.items.length, ['позиция', 'позиции', 'позиций'])}</small>
              </button>
            ))}
            <button className="add-btn" onClick={addCategory}>
              <Plus size={14} /> Новая категория
            </button>
          </div>

          <div className="admin-card">
            {active ? (
              <>
                <div className="admin-card-header">
                  <div>
                    <h2>{active.name}</h2>
                    <p>{active.items.length} позиций</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" onClick={() => renameCategory(active)}>
                      <Pencil size={12} /> Переименовать
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteCategory(active)}>
                      <Trash2 size={12} /> Удалить категорию
                    </button>
                  </div>
                </div>

                {editingItem ? (
                  <div className="admin-card" style={{ marginBottom: 12, background: 'var(--admin-panel-2)' }}>
                    <h3 style={{ marginTop: 0 }}>{editingItem.id ? 'Редактирование блюда' : 'Новое блюдо'}</h3>
                    <div className="field-grid">
                      <div className="field-row">
                        <label>Название</label>
                        <input className="input" value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
                      </div>
                      <div className="field-row">
                        <label>Цена ₽</label>
                        <input type="number" className="input" value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })} />
                      </div>
                      <div className="field-row">
                        <label>Вес</label>
                        <input className="input" value={editingItem.weight ?? ''} onChange={(e) => setEditingItem({ ...editingItem, weight: e.target.value })} />
                      </div>
                      <div className="field-row">
                        <label>Картинка (URL)</label>
                        <input className="input" value={editingItem.image ?? ''} onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })} placeholder="/assets/clean-ribs-plate.webp" />
                      </div>
                    </div>
                    <div className="field-row">
                      <label>Описание</label>
                      <textarea className="textarea" value={editingItem.description ?? ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                        <input type="checkbox" checked={editingItem.available !== false} onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })} />
                        Доступно
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                        <input type="checkbox" checked={Boolean(editingItem.featured)} onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })} />
                        Хит
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" onClick={saveItem}><Save size={14} /> Сохранить</button>
                      <button className="btn btn-ghost" onClick={cancelEdit}>Отмена</button>
                    </div>
                  </div>
                ) : null}

                {active.items.length === 0 ? (
                  <div className="empty-state"><h3>Пусто</h3><p>Добавьте первое блюдо в эту категорию.</p></div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Название</th>
                        <th>Вес</th>
                        <th>Цена</th>
                        <th>Доступно</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.featured ? <Star size={14} color="var(--admin-gold)" /> : null}</td>
                          <td>
                            <strong>{item.title}</strong>
                            {item.description ? <><br /><small style={{ color: 'var(--admin-muted)' }}>{item.description}</small></> : null}
                          </td>
                          <td>{item.weight ?? '—'}</td>
                          <td>{formatPrice(item.price)} ₽</td>
                          <td>{item.available !== false ? <span className="status-pill confirmed">в меню</span> : <span className="status-pill cancelled">скрыто</span>}</td>
                          <td>
                            <div className="actions">
                              <button className="btn btn-icon" title="Редактировать" onClick={() => editItem(item)}><Pencil size={14} /></button>
                              <button className="btn btn-danger btn-icon" title="Удалить" onClick={() => deleteItem(item)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div className="empty-state"><h3>Нет категорий</h3><p>Создайте первую категорию слева.</p></div>
            )}
          </div>
        </div>
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

function formatPrice(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}
