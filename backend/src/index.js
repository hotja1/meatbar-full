import compression from 'compression'
import cors from 'cors'
import express from 'express'
import expressStaticGzip from 'express-static-gzip'
import helmet from 'helmet'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server as SocketIOServer } from 'socket.io'
import { config } from './config.js'
import { bootstrap } from './db.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { publicRoutes } from './routes/public.js'
import { buildAllowedOrigins, isAllowedOrigin } from './security.js'
import { buildRobotsTxt, buildSitemapXml, seoPayload } from './seo.js'

bootstrap()

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
const allowedOrigins = buildAllowedOrigins(config)
/* helmet: CSP вешать не будем (не хотим блокировать inline-стили
   в LQIP); cross-origin ресурсы (логотипы, видео, картинки) — разрешены. */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
)
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  const proto = String(_req.headers['x-forwarded-proto'] || '').toLowerCase()
  if (_req.secure || proto === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  next()
})
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true)
      return callback(new Error('CORS origin is not allowed'))
    },
    credentials: true,
  }),
)
/* Phase 9.5 — compression для динамических ответов (JSON /api/*).
   Статические asset'ы отдаёт expressStaticGzip ниже, который сам
   подбирает .br/.gz файл и не дублирует работу. */
app.use(
  compression({
    /* skip, если клиент уже получает сжатый файл (статика) */
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false
      return compression.filter(req, res)
    },
    threshold: 1024,
  }),
)
app.use(express.json({ limit: '2mb' }))

const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true)
      return callback(new Error('Socket.IO origin is not allowed'))
    },
    credentials: true,
  },
})

io.on('connection', (socket) => {
  socket.emit('hello', { ok: true })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    integrations: {
      yookassa: config.yookassa.enabled,
      smsru: config.smsru.enabled,
      telegram: config.telegram.enabled,
      vk: config.vk.enabled,
    },
  })
})

app.use('/api', publicRoutes(io))
app.use('/api/auth', authRoutes())
app.use('/api/admin', adminRoutes(io))

app.get('/robots.txt', (req, res) => {
  const payload = seoPayload(req, config)
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.type('text/plain; charset=utf-8').send(buildRobotsTxt(payload))
})

app.get('/sitemap.xml', (req, res) => {
  const payload = seoPayload(req, config)
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  res.type('application/xml; charset=utf-8').send(buildSitemapXml(payload))
})

// Serve static frontend build (Phase 9.D — отдаёт pre-compressed .br/.gz).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')
const spaIndexFile = path.join(publicDir, 'index.html')

app.get(['/admin', '/admin/*'], (_req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  res.sendFile(spaIndexFile)
})

app.use(
  expressStaticGzip(publicDir, {
    enableBrotli: true,
    orderPreference: ['br', 'gz'],
    serveStatic: {
      etag: true,
      lastModified: true,
      maxAge: '7d',
      setHeaders: (res, filePath) => {
        /* hashed bundle (vite) → immutable, длинный кэш */
        if (/[-_.][A-Za-z0-9]{8,}\.(?:js|css|woff2?|avif|webp|png|jpe?g|svg|mp4|webm)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        } else if (/\.(?:webp|avif|png|jpe?g|svg)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=604800')
        } else if (/\.(?:mp4|webm|m4v)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=604800')
        } else if (/index\.html$/.test(filePath)) {
          /* SPA shell — всегда свежий, ETag спасёт от лишнего трафика. */
          res.setHeader('Cache-Control', 'no-cache')
        } else if (/\.webmanifest$|sw\.js$/.test(filePath)) {
          res.setHeader('Cache-Control', 'no-cache')
        }
      },
    },
  }),
)

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(spaIndexFile)
})

app.use((err, _req, res, _next) => {
  if (err?.message === 'CORS origin is not allowed' || err?.message === 'Socket.IO origin is not allowed') {
    return res.status(403).json({ error: err.message })
  }
  console.error('[server] error:', err)
  res.status(500).json({ error: err?.message ?? 'Internal Server Error' })
})

server.listen(config.port, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${config.port}`)
  console.log(`[server] integrations:`, {
    yookassa: config.yookassa.enabled,
    smsru: config.smsru.enabled,
    telegram: config.telegram.enabled,
    vk: config.vk.enabled,
  })
})
