/* Мясо Бар Service Worker (Phase 9.C).
 *
 * Стратегии:
 *   - HTML / navigate:        network-first (фолбэк на /index.html)
 *   - hashed JS/CSS:          cache-first (immutable)
 *   - изображения:            stale-while-revalidate с LRU 60
 *   - видео:                  не перехватываем (range-request streaming)
 *   - /api/menu:              SWR — сразу отдаём кэш, в фоне обновляем
 *   - /api/tables:            SWR с TTL 60 секунд
 *   - /api/* всё остальное:   network-only (POST не должны кэшироваться)
 *   - всё прочее GET:         cache-first fallback
 *
 * App-shell precache намеренно содержит только критические asset'ы
 * (logo, hero poster, cloud-hero). Полный список hashed JS/CSS
 * добавится при первой навигации через runtime cache (cache-first
 * для /assets/*-HASH.* — это уже immutable).
 */

const VERSION = 'v27'
const CACHE_NAME = `meatbar-pwa-${VERSION}`
const RUNTIME_CACHE = `meatbar-runtime-${VERSION}`
const IMAGE_CACHE = `meatbar-images-${VERSION}`
const API_CACHE = `meatbar-api-${VERSION}`

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/meatbar-logo-mark.webp',
  '/assets/meatbar-logo-mark-square-large.webp',
  '/assets/meatbar-logo-mark-square-large-192.webp',
  '/assets/apple-touch-icon-180.png',
  '/assets/hero-poster.webp',
]

const KNOWN_CACHES = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE]
const PRECACHE_MANIFEST_URL = '/precache-manifest.json'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.all(
        APP_SHELL.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((response) => (response.ok ? cache.put(url, response.clone()) : null))
            .catch(() => null),
        ),
      )

      // Optional build-time precache for hashed /assets/* (fast warm start, better offline).
      // If the manifest is missing (dev server), we silently skip.
      try {
        const resp = await fetch(PRECACHE_MANIFEST_URL, { cache: 'no-cache' })
        if (resp.ok) {
          const list = await resp.json().catch(() => null)
          if (Array.isArray(list)) {
            await Promise.all(
              list.map((url) =>
                fetch(url, { cache: 'no-cache' })
                  .then((r) => (r.ok ? cache.put(url, r.clone()) : null))
                  .catch(() => null),
              ),
            )
          }
        }
      } catch {
        /* noop */
      }
    })(),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => !KNOWN_CACHES.includes(key)).map((key) => caches.delete(key)),
        ),
      ),
      self.registration?.navigationPreload?.enable().catch(() => {}),
    ]),
  )
  self.clients.claim()
})

/* ── helpers ───────────────────────────────────────── */

function isApiRequest(url) {
  return url.pathname.startsWith('/api')
}

function isSocket(url) {
  return url.pathname.startsWith('/socket.io')
}

function isMenuApi(url) {
  return url.pathname === '/api/menu'
}

function isTablesApi(url) {
  return url.pathname === '/api/tables'
}

function isImage(request) {
  return (
    request.destination === 'image' ||
    /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(new URL(request.url).pathname)
  )
}

function isHashedAsset(url) {
  return /\/assets\/.+-[A-Za-z0-9]{8,}\.(?:js|css)$/.test(url.pathname)
}

function isVideo(request) {
  return (
    request.destination === 'video' ||
    /\.(mp4|webm|m4v)$/i.test(new URL(request.url).pathname)
  )
}

/* LRU-эвикция для runtime/image кэшей (Phase 9.C). */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxItems) return
  const toDelete = keys.slice(0, keys.length - maxItems)
  await Promise.all(toDelete.map((req) => cache.delete(req)))
}

async function swrFetch({ request, cacheName, maxItems = 64 }) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
        if (maxItems) await trimCache(cacheName, maxItems)
      }
      return response
    })
    .catch(() => cached)
  return cached || networkPromise
}

/* ── fetch handler ─────────────────────────────────── */

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (isSocket(url)) return

  /* /api/menu — SWR. Меню редко меняется, но мы не хотим, чтобы
     пользователь видел старые цены при онлайн-сеансе → одновременно
     даём кэш и обновляем. */
  if (isMenuApi(url)) {
    event.respondWith(swrFetch({ request: event.request, cacheName: API_CACHE, maxItems: 8 }))
    return
  }

  /* /api/tables — SWR, но с TTL 60 секунд: если кэшу больше минуты,
     ждём свежий ответ; это критично для админки. */
  if (isTablesApi(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE)
        const cached = await cache.match(event.request)
        const isFresh = (() => {
          if (!cached) return false
          const ts = cached.headers.get('sw-cached-at')
          if (!ts) return false
          return Date.now() - Number(ts) < 60_000
        })()
        if (isFresh) {
          /* Перезапрашиваем в фоне всё равно, чтобы не залежалось. */
          fetch(event.request)
            .then(async (resp) => {
              if (resp.ok) {
                const cloned = new Response(await resp.clone().blob(), {
                  status: resp.status,
                  headers: { ...Object.fromEntries(resp.headers), 'sw-cached-at': String(Date.now()) },
                })
                cache.put(event.request, cloned)
              }
            })
            .catch(() => {})
          return cached
        }
        try {
          const fresh = await fetch(event.request)
          if (fresh.ok) {
            const stamped = new Response(await fresh.clone().blob(), {
              status: fresh.status,
              headers: { ...Object.fromEntries(fresh.headers), 'sw-cached-at': String(Date.now()) },
            })
            cache.put(event.request, stamped)
          }
          return fresh
        } catch {
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  /* Прочие /api/* — не кэшируем. */
  if (isApiRequest(url)) return

  /* Видео — не перехватываем (range streaming). */
  if (isVideo(event.request) || event.request.headers.get('range')) return

  /* Hashed JS/CSS — cache-first (immutable). */
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached
          ? cached
          : fetch(event.request).then((response) => {
              if (response.ok) {
                const copy = response.clone()
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(event.request, copy).then(() => trimCache(RUNTIME_CACHE, 80))
                })
              }
              return response
            }),
      ),
    )
    return
  }

  /* Навигация — network-first c фолбэком на index.html. */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloaded = await event.preloadResponse
          if (preloaded) {
            const copy = preloaded.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
            return preloaded
          }
          const response = await fetch(event.request)
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        } catch {
          return caches.match('/index.html').then((m) => m || caches.match('/'))
        }
      })(),
    )
    return
  }

  /* Изображения — SWR с lru. */
  if (isImage(event.request)) {
    event.respondWith(swrFetch({ request: event.request, cacheName: IMAGE_CACHE, maxItems: 60 }))
    return
  }

  /* Всё остальное — cache-first fallback. */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, copy).then(() => trimCache(RUNTIME_CACHE, 80))
            })
          }
          return response
        })
        .catch(() => cached)
    }),
  )
})
