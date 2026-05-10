import { Router } from 'express'
import { authMiddleware, hashPassword } from '../auth.js'
import { db } from '../db.js'
import { clearPublicApiCache } from './public.js'

export function adminRoutes(io) {
  const router = Router()
  router.use(authMiddleware)

  // ---- Bookings ----
  router.get('/bookings', (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM bookings ORDER BY created_at DESC')
      .all()
    res.json(rows)
  })
  router.patch('/bookings/:id', (req, res) => {
    const id = Number(req.params.id)
    const allowed = ['status', 'comment', 'date', 'time', 'guests', 'name', 'phone', 'table_title']
    const fields = []
    const values = []
    for (const key of allowed) {
      if (key in req.body) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'no fields' })
    values.push(id)
    db.prepare(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
    io?.emit('bookings:updated', updated)
    res.json(updated)
  })
  router.delete('/bookings/:id', (req, res) => {
    const id = Number(req.params.id)
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id)
    io?.emit('bookings:deleted', { id })
    res.json({ ok: true })
  })

  // ---- Orders ----
  router.get('/orders', (_req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    const items = db.prepare('SELECT * FROM order_items').all()
    const result = orders.map((order) => ({
      ...order,
      items: items.filter((it) => it.order_id === order.id),
    }))
    res.json(result)
  })
  router.patch('/orders/:id', (req, res) => {
    const id = Number(req.params.id)
    const allowed = ['status', 'payment', 'address', 'name']
    const fields = []
    const values = []
    for (const key of allowed) {
      if (key in req.body) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'no fields' })
    values.push(id)
    db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
    io?.emit('orders:updated', updated)
    res.json(updated)
  })

  // ---- Menu Categories ----
  router.post('/menu/categories', (req, res) => {
    const { name, order } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })
    const result = db
      .prepare('INSERT INTO menu_categories (name, position) VALUES (?, ?)')
      .run(name, Number(order ?? 999))
    const cat = db
      .prepare('SELECT id, name, position FROM menu_categories WHERE id = ?')
      .get(Number(result.lastInsertRowid))
    clearPublicApiCache('menu')
    res.json({ ...cat, items: [] })
  })
  router.patch('/menu/categories/:id', (req, res) => {
    const id = Number(req.params.id)
    const fields = []
    const values = []
    if ('name' in req.body) {
      fields.push('name = ?')
      values.push(req.body.name)
    }
    if ('order' in req.body) {
      fields.push('position = ?')
      values.push(Number(req.body.order))
    }
    if (!fields.length) return res.status(400).json({ error: 'no fields' })
    values.push(id)
    db.prepare(`UPDATE menu_categories SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    clearPublicApiCache('menu')
    res.json(db.prepare('SELECT id, name, position FROM menu_categories WHERE id = ?').get(id))
  })
  router.delete('/menu/categories/:id', (req, res) => {
    const id = Number(req.params.id)
    db.prepare('DELETE FROM menu_categories WHERE id = ?').run(id)
    clearPublicApiCache('menu')
    res.json({ ok: true })
  })

  // ---- Menu Items ----
  router.post('/menu/categories/:catId/items', (req, res) => {
    const categoryId = Number(req.params.catId)
    const { title, weight, price, description, image, available, featured } = req.body || {}
    if (!title || price == null) return res.status(400).json({ error: 'title and price required' })
    const result = db
      .prepare(
        `INSERT INTO menu_items (category_id, title, weight, price, description, image, available, featured, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 999)`,
      )
      .run(
        categoryId,
        title,
        weight ?? null,
        Number(price),
        description ?? null,
        image ?? null,
        available === false ? 0 : 1,
        featured ? 1 : 0,
      )
    clearPublicApiCache('menu')
    res.json(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(Number(result.lastInsertRowid)))
  })
  router.patch('/menu/items/:id', (req, res) => {
    const id = Number(req.params.id)
    const allowed = ['title', 'weight', 'price', 'description', 'image', 'available', 'featured', 'position']
    const fields = []
    const values = []
    for (const key of allowed) {
      if (key in req.body) {
        fields.push(`${key} = ?`)
        let v = req.body[key]
        if (key === 'available' || key === 'featured') v = v ? 1 : 0
        values.push(v)
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'no fields' })
    values.push(id)
    db.prepare(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    clearPublicApiCache('menu')
    res.json(db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id))
  })
  router.delete('/menu/items/:id', (req, res) => {
    const id = Number(req.params.id)
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id)
    clearPublicApiCache('menu')
    res.json({ ok: true })
  })

  // ---- Tables ----
  router.post('/tables', (req, res) => {
    const { title, zone, seats, status, x, y, scene, notes, hall, number, width, height, shape } = req.body || {}
    if (!title) return res.status(400).json({ error: 'title required' })
    const result = db
      .prepare(
        'INSERT INTO tables (title, zone, seats, status, x, y, scene, notes, hall, number, width, height, shape) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        title,
        zone ?? 'window',
        Number(seats ?? 2),
        status ?? 'free',
        Number(x ?? 50),
        Number(y ?? 50),
        scene ?? null,
        notes ?? null,
        hall ?? null,
        number ?? null,
        width ?? null,
        height ?? null,
        shape ?? null,
      )
    const table = db
      .prepare('SELECT * FROM tables WHERE id = ?')
      .get(Number(result.lastInsertRowid))
    clearPublicApiCache('tables')
    io?.emit('tables:created', table)
    res.json(table)
  })
  router.patch('/tables/:id', (req, res) => {
    const id = Number(req.params.id)
    const allowed = ['title', 'zone', 'seats', 'status', 'x', 'y', 'scene', 'notes', 'hall', 'number', 'width', 'height', 'shape']
    const fields = []
    const values = []
    for (const key of allowed) {
      if (key in req.body) {
        fields.push(`${key} = ?`)
        values.push(req.body[key])
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'no fields' })
    values.push(id)
    db.prepare(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(id)
    clearPublicApiCache('tables')
    io?.emit('tables:updated', updated)
    res.json(updated)
  })
  router.delete('/tables/:id', (req, res) => {
    const id = Number(req.params.id)
    db.prepare('DELETE FROM tables WHERE id = ?').run(id)
    clearPublicApiCache('tables')
    io?.emit('tables:deleted', { id })
    res.json({ ok: true })
  })

  // ---- Content ----
  router.put('/content', (req, res) => {
    const data = JSON.stringify(req.body || {})
    db.prepare(
      `INSERT INTO site_content (id, data, updated_at) VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    ).run(data)
    clearPublicApiCache('content')
    io?.emit('content:updated', JSON.parse(data))
    res.json(req.body || {})
  })

  // ---- Settings ----
  router.get('/settings', (_req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    rows.forEach((r) => {
      settings[r.key] = r.value
    })
    res.json(settings)
  })
  router.put('/settings', (req, res) => {
    const settings = req.body || {}
    const upsert = db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    const tx = db.transaction((entries) => {
      for (const [key, value] of entries) upsert.run(key, String(value))
    })
    tx(Object.entries(settings))
    res.json(settings)
  })

  // ---- Stats ----
  router.get('/stats', (_req, res) => {
    const bookingsTotal = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c
    const ordersTotal = db.prepare('SELECT COUNT(*) as c FROM orders').get().c
    const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE payment = 'paid'").get().s
    const tablesFree = db.prepare("SELECT COUNT(*) as c FROM tables WHERE status = 'free'").get().c
    const tablesTotal = db.prepare('SELECT COUNT(*) as c FROM tables').get().c
    const itemsTotal = db.prepare('SELECT COUNT(*) as c FROM menu_items').get().c
    const today = new Date().toISOString().slice(0, 10)
    const bookingsToday = db
      .prepare("SELECT COUNT(*) as c FROM bookings WHERE date(created_at) = ?")
      .get(today).c
    const ordersToday = db
      .prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = ?")
      .get(today).c
    res.json({
      bookingsTotal,
      bookingsToday,
      ordersTotal,
      ordersToday,
      revenue,
      tablesFree,
      tablesTotal,
      itemsTotal,
    })
  })

  // ---- Admin users ----
  router.post('/users', (req, res) => {
    if (req.user.role !== 'owner') return res.status(403).json({ error: 'owner only' })
    const { username, password, role } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'username/password required' })
    try {
      const hash = hashPassword(password)
      const result = db
        .prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)')
        .run(username, hash, role ?? 'manager')
      res.json({ id: Number(result.lastInsertRowid), username, role: role ?? 'manager' })
    } catch (e) {
      res.status(400).json({ error: e?.message ?? 'failed' })
    }
  })
  router.post('/change-password', (req, res) => {
    const { password } = req.body || {}
    if (!password) return res.status(400).json({ error: 'password required' })
    const hash = hashPassword(password)
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.user.id)
    res.json({ ok: true })
  })

  return router
}
