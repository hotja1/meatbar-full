---
inclusion: fileMatch
fileMatchPattern: 'frontend/public/sw.js,frontend/public/manifest.webmanifest,backend/public/sw.js,backend/public/manifest.webmanifest'
---

# Service Worker и PWA

## Жёсткие правила

- Никогда не кэшировать `/api/*` POST.
- Никогда не кэшировать `/socket.io/*`.
- Не перехватывать видео и range-запросы (`range` header) — ломает streaming.
- Перед релизом бампать `VERSION` (сейчас `v20`) — иначе старые клиенты застрянут на старых assets.
- После бампа `VERSION` проверять install / activate / fetch flow в DevTools.

## Стратегии (подтверждены в `sw.js`)

- **HTML / navigate** → network-first, fallback на закэшированный `/index.html`.
- **Hashed JS/CSS** (`/assets/*-[hash].{js,css}`) → cache-first, immutable.
- **Images** (.webp/.avif/.png/.jpg/.svg/.gif) → stale-while-revalidate, LRU 60.
- **Videos** → не перехватываем, браузер сам.
- **`/api/menu`** → SWR (сразу кэш, в фоне обновляем). LRU 8.
- **`/api/tables`** → SWR с TTL 60s через `sw-cached-at` header.
- **Прочие `/api/*` GET** → network-only (не кэшируем).
- **Socket.IO** → не перехватываем.
- **Остальные GET** → cache-first fallback с LRU 80.

## App-shell precache

Сейчас статический список в `APP_SHELL`. Планируется читать `precache-manifest.json` (generates `frontend/scripts/write-precache-manifest.mjs`) динамически — planopt D18.

Не добавлять в precache:

- Большие видео (hero-reel).
- Тяжёлые фото галереи.
- `/api/*`.

## Auto-update flow

В `main.tsx`:

- При `load` → `navigator.serviceWorker.register('/sw.js')`.
- `reg.update()` сразу + каждые 60 минут.
- `controllerchange` → пока `window.location.reload()`. Планируется заменить на тост «обновление готово» — planopt H42.

## Dev-режим

В dev (`!import.meta.env.PROD`) SW автоматически **unregister** через `getRegistrations().forEach(r => r.unregister())`. Иначе закэшированные старые ассеты маскируют правки.

## IndexedDB / BackgroundSync

- Offline-queue бронирований уже работает через `localStorage` + `online` event в `frontend/src/lib/api.ts`.
- BackgroundSync для `/api/orders` запланирован — planopt D19.

## Manifest

- `display: "standalone"`.
- `start_url: "/"`.
- `scope: "/"`.
- Иконки: `/assets/meatbar-logo-mark-square-large*.{webp,avif}` + `apple-touch-icon-180.png`.
- Shortcuts — для `booking`, `menu`, `order`, `contacts`.
- Не менять `name`, `short_name`, `theme_color` без согласия.

## Проверки

- DevTools → Application → Service Workers: статус `activated and is running`.
- Network → Offline → перезагрузить → сайт работает с кэша.
- Application → Manifest: нет 404 на иконках, корректный manifest JSON.
- Lighthouse → PWA category: installable + offline ready.

## Антипаттерны

- Кэширование `Response` без `response.ok` проверки.
- `cache.add(url)` без try/catch — падает весь install на одном 404.
- Не-версионированный `CACHE_NAME` → вечно залипающие старые ассеты.
- Кэширование `Content-Type: text/html` для SPA-fallback с `/api/*` 404 ответа.
