import { Router } from 'express'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { db } from '../db.js'
import { sendSmsCode, verifySmsCode } from '../integrations/sms.js'
import {
  formatBookingMessage,
  formatOrderMessage,
} from '../integrations/telegram.js'
import { notifyStaff } from '../integrations/notifier.js'
import { createYooKassaPayment } from '../integrations/yookassa.js'
import { bookingLimiter, orderLimiter, rumLimiter, smsLimiter } from '../security.js'
import { clearBrotliCache, sendJsonWithBrotli } from '../brotli-json.js'

const API_CACHE_TTL_MS = 60 * 1000
const API_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=600'
const apiCache = new Map()

export function clearPublicApiCache(...keys) {
  if (!keys.length) {
    apiCache.clear()
    clearBrotliCache()
    return
  }
  for (const key of keys) apiCache.delete(key)
  clearBrotliCache(...keys)
}

function getCachedPayload(cacheKey, producer) {
  const now = Date.now()
  const cached = apiCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return { payload: cached.payload, etag: cached.etag, cacheHit: true }
  }
  const payload = producer()
  const etag = weakEtagFor(payload)
  apiCache.set(cacheKey, { payload, etag, expiresAt: now + API_CACHE_TTL_MS })
  return { payload, etag, cacheHit: false }
}

/* Task E24 — weak ETag по содержимому JSON-ответа.
   Хэш md5(JSON) → `W/"<12 hex>"`. Weak-вариант безопасен для JSON,
   где пробелы/порядок ключей могут отличаться между сериализациями
   на разных рантаймах. Клиент шлёт If-None-Match → мы отвечаем 304
   с тем же Cache-Control, чтобы SW/браузер продлили свежесть без
   перекачки body. */
function weakEtagFor(payload) {
  const body = JSON.stringify(payload)
  const hex = createHash('md5').update(body).digest('hex').slice(0, 12)
  return `W/"${hex}"`
}

function sendCachedJson(req, res, startedAt, cacheHit, etag, payload, cacheKey) {
  setServerTiming(res, startedAt, cacheHit)
  res.setHeader('Cache-Control', API_CACHE_CONTROL)
  res.setHeader('ETag', etag)
  const inm = req.headers['if-none-match']
  if (inm && inm === etag) {
    res.status(304).end()
    return
  }
  sendJsonWithBrotli(req, res, payload, etag, cacheKey)
}

function setServerTiming(res, startedAt, cacheHit) {
  const appDuration = Math.max(0, performance.now() - startedAt)
  const cache = cacheHit ? 'hit' : 'miss'
  res.setHeader('Server-Timing', `app;dur=${appDuration.toFixed(1)}, cache;desc="${cache}"`)
}

export function publicRoutes(io) {
  const router = Router()

  router.get('/menu', (req, res) => {
    const startedAt = performance.now()
    const { payload, etag, cacheHit } = getCachedPayload('menu', () => {
      const cats = db
        .prepare('SELECT id, name, position FROM menu_categories ORDER BY position, id')
        .all()
      const itemsByCat = db
        .prepare(
          'SELECT id, category_id, title, weight, price, description, image, available, featured, spicy, position FROM menu_items WHERE available = 1 ORDER BY position, id',
        )
        .all()
      return cats.map((cat) => ({
        id: cat.id,
        name: cat.name,
        order: cat.position,
        items: itemsByCat
          .filter((item) => item.category_id === cat.id)
          .map((item) => ({
            id: item.id,
            title: item.title,
            weight: item.weight ?? undefined,
            price: item.price,
            description: item.description ?? undefined,
            image: item.image ?? undefined,
            available: Boolean(item.available),
            featured: Boolean(item.featured),
            spicy: Boolean(item.spicy),
          })),
      }))
    })
    sendCachedJson(req, res, startedAt, cacheHit, etag, payload, 'menu')
  })

  router.get('/tables', (req, res) => {
    const startedAt = performance.now()
    const { payload, etag, cacheHit } = getCachedPayload('tables', () =>
      db
        .prepare(
          'SELECT id, title, zone, seats, status, x, y, scene, notes, hall, number, width, height, shape FROM tables ORDER BY id',
        )
        .all(),
    )
    sendCachedJson(req, res, startedAt, cacheHit, etag, payload, 'tables')
  })

  router.get('/content', (req, res) => {
    const startedAt = performance.now()
    const { payload, etag, cacheHit } = getCachedPayload('content', () => {
      const row = db.prepare('SELECT data FROM site_content WHERE id = 1').get()
      if (!row) return {}
      try {
        return JSON.parse(row.data)
      } catch {
        return {}
      }
    })
    sendCachedJson(req, res, startedAt, cacheHit, etag, payload, 'content')
  })

  router.post('/bookings', bookingLimiter, async (req, res) => {
    const { name, phone, date, time, guests, table, tableId, comment, preOrder, paymentMethod } = req.body || {}
    if (!name || !phone || !date || !time || !guests || !table) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' })
    }
    if (tableId) {
      const tableRow = db.prepare('SELECT id, status, title FROM tables WHERE id = ?').get(Number(tableId))
      if (!tableRow) return res.status(400).json({ error: 'Стол не найден' })
      if (tableRow.status === 'disabled') return res.status(409).json({ error: 'Стол временно отключен' })
      if (tableRow.status === 'reserved') return res.status(409).json({ error: 'Стол уже забронирован' })
    }

    const preOrderJson = Array.isArray(preOrder) && preOrder.length > 0 ? JSON.stringify(preOrder) : null
    const payment = paymentMethod === 'online' ? 'online' : 'none'
    const paymentStatus = payment === 'online' ? 'pending' : 'none'

    const result = db
      .prepare(
        `INSERT INTO bookings (table_id, table_title, guests, date, time, name, phone, comment, pre_order, payment_method, payment_status, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .run(tableId ?? null, table, Number(guests), date, time, name, phone, comment ?? null, preOrderJson, payment, paymentStatus)
    const booking = db
      .prepare('SELECT * FROM bookings WHERE id = ?')
      .get(Number(result.lastInsertRowid))

    if (tableId) {
      db.prepare("UPDATE tables SET status = 'reserved' WHERE id = ?").run(tableId)
      clearPublicApiCache('tables')
      io?.emit('tables:updated', { id: tableId, status: 'reserved' })
    }
    io?.emit('bookings:new', booking)
    notifyStaff(formatBookingMessage(booking)).catch(() => {})
    res.json(booking)
  })

  router.post('/orders', orderLimiter, async (req, res) => {
    const { items, phone, name, address, delivery } = req.body || {}
    if (!Array.isArray(items) || items.length === 0 || !phone) {
      return res.status(400).json({ error: 'Корзина пуста или нет телефона' })
    }
    const total = items.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity || 1),
      0,
    )
    const result = db
      .prepare(
        `INSERT INTO orders (phone, name, total, payment, delivery, address, status)
         VALUES (?, ?, ?, 'pending', ?, ?, 'new')`,
      )
      .run(phone, name ?? null, total, delivery ?? 'pickup', address ?? null)
    const orderId = Number(result.lastInsertRowid)
    const itemStmt = db.prepare(
      'INSERT INTO order_items (order_id, item_id, title, price, quantity) VALUES (?, ?, ?, ?, ?)',
    )
    const tx = db.transaction((rows) => {
      for (const r of rows) itemStmt.run(orderId, r.itemId ?? null, r.title, r.price, r.quantity || 1)
    })
    tx(items)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    const orderItems = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(orderId)

    io?.emit('orders:new', { ...order, items: orderItems })
    notifyStaff(formatOrderMessage(order, orderItems)).catch(() => {})

    // Try to create payment link if YooKassa configured
    let paymentUrl = null
    const payment = await createYooKassaPayment({
      amount: total,
      description: `Заказ #${orderId} Мясо Бар`,
      orderId,
    })
    if (payment.ok && payment.data?.confirmation?.confirmation_url) {
      paymentUrl = payment.data.confirmation.confirmation_url
      db.prepare('UPDATE orders SET yookassa_payment_id = ? WHERE id = ?').run(
        payment.data.id,
        orderId,
      )
    }

    res.json({ ...order, items: orderItems, paymentUrl })
  })

  router.post('/sms/send', smsLimiter, async (req, res) => {
    const { phone } = req.body || {}
    if (!phone) return res.status(400).json({ error: 'phone required' })
    const result = await sendSmsCode(phone)
    res.json(result)
  })

  router.post('/sms/verify', smsLimiter, (req, res) => {
    const { phone, code } = req.body || {}
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' })
    const result = verifySmsCode(phone, code)
    if (!result.ok) return res.status(400).json(result)
    res.json(result)
  })

  router.post('/payments/yookassa-webhook', (req, res) => {
    const event = req.body
    const paymentId = event?.object?.id
    const status = event?.object?.status
    if (paymentId && status === 'succeeded') {
      db.prepare(
        "UPDATE orders SET payment = 'paid' WHERE yookassa_payment_id = ?",
      ).run(paymentId)
      io?.emit('orders:paid', { paymentId })
    }
    res.json({ ok: true })
  })

  /* Phase 9.E — RUM endpoint.
     Принимает JSON { events: [{ name, value, rating, ... }] } и
     складывает в SQLite-таблицу `rum_events`. Если таблицы нет —
     создаём на лету (без миграции). Это даёт нам p50/p75/p95
     web-vitals без сторонних аналитик. */
  try {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS rum_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        rating TEXT,
        navigation_type TEXT,
        delta REAL,
        pathname TEXT,
        ua TEXT,
        conn TEXT,
        save_data INTEGER,
        dpr REAL,
        vw INTEGER,
        ts INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      )`,
    ).run()
  } catch (err) {
    console.warn('[rum] failed to ensure table:', err?.message)
  }

  router.post('/rum', rumLimiter, (req, res) => {
    const events = Array.isArray(req.body?.events) ? req.body.events : []
    if (!events.length) {
      return res.status(204).end()
    }
    const insert = db.prepare(
      `INSERT INTO rum_events
        (name, value, rating, navigation_type, delta, pathname, ua, conn, save_data, dpr, vw, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const insertMany = db.transaction((rows) => {
      for (const r of rows) {
        insert.run(
          String(r.name ?? ''),
          Number(r.value ?? 0),
          String(r.rating ?? ''),
          String(r.navigationType ?? ''),
          Number(r.delta ?? 0),
          String(r.pathname ?? ''),
          String(r.ua ?? '').slice(0, 240),
          String(r.conn ?? ''),
          r.saveData ? 1 : 0,
          Number(r.dpr ?? 1),
          Number(r.vw ?? 0),
          Number(r.ts ?? Date.now()),
        )
      }
    })
    try {
      insertMany(events)
    } catch (err) {
      console.warn('[rum] insert failed:', err?.message)
    }
    res.status(204).end()
  })

  return router
}
