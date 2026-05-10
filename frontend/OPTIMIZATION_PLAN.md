# План оптимизации Мясо Бар

Этот документ — официальный roadmap оптимизации фронтенда, разделённый на
**7 направлений**. Все пункты делятся на: ✅ сделано в Phase 9, 🟡 сделано
частично, ⏳ в работе/далее.

---

## 1. Видео + Canvas

### Цель
Минимизировать нагрузку GPU/CPU на главной с видео и канвасами (огонь,
облака, эмберы, FireText), не теряя визуального качества для целевых
устройств.

### Сделано (Phase 9.A)
- ✅ Подбор качества `hero-reel` адаптивно: `360p` для save-data/2G,
  `540p` для телефонов до 480 px, `720p` для 768+, `1080p` для десктопа
  с быстрым соединением.
- ✅ Все canvas-компоненты (EmberField, AnimatedFire, DriftingClouds,
  FireText) — IntersectionObserver-paused когда вне viewport.
- ✅ Capped `devicePixelRatio` ≤ 2 на десктопе, =1 на мобиле.
- ✅ Все рендеры уважают `prefers-reduced-motion: reduce` — fallback
  на статический кадр без rAF.
- ✅ `lib/animationLoop.ts` — единый адаптивный rAF-цикл с FPS-окном
  и `quality ∈ {low | mid | high}`.
- ✅ FPS cap 30 у EmberField (плотный канвас) для экономии батареи.

### Дальше
- ⏳ Плотность EmberField динамически опускать при `quality = 'low'`
  (через `getQuality()`).
- ⏳ AVIF-постер для `<video>` (poster=hero-poster.avif с fallback на webp).
- ⏳ Прогрессивный VOD: попробовать `hls.js` для стейджа `1080p` с
  адаптивным битрейтом (только для десктопа на сети ≥ 4g).
- ⏳ Один глобальный rAF-scheduler, в который подписываются все
  канвасы — устранит N независимых rAF-циклов.

---

## 2. Изображения

### Цель
Снизить вес и сэкономить байты на LCP-фотографии (`cloud-hero`) и на
карточках меню/бара.

### Сделано (Phase 9.B)
- ✅ Все растровые ассеты переведены в WebP (`public/assets/menu/*.webp`,
  `public/assets/bar/*.webp`). PNG/JPG в репо отсутствуют.
- ✅ LQIP-плейсхолдер (24×16, ~140 b base64) под `cloud-hero` —
  показывается мгновенно, при `<img>.onLoad` фон сбрасывается.
- ✅ `fetchPriority="high"` + `loading="eager"` для LCP-картинки
  (cloud-hero), `loading="lazy" decoding="async"` для всех остальных.
- ✅ `<picture>`-source с `media="(max-width: 768px)"` → отдельный SM-вариант
  cloud-hero / hero-photo.

### Дальше
- ⏳ Сгенерировать AVIF-варианты для `cloud-hero`, `meatbar-hall`,
  `hero-poster` (≈ 25–30 % выигрыш по сравнению с WebP при том же качестве).
  Подключить через дополнительный `<source type="image/avif">` в `<picture>`.
- ⏳ Для всех `dish-card` фото — `srcSet` с 400/800/1200 px (текущая —
  одна 800×600 для всех ширин).
- ⏳ LQIP в формате data: для всех `dish-card` фото (генерация на этапе
  build, плагин типа `vite-plugin-image-presets`).
- ⏳ Сгенерировать реальные «фото-баристические» иллюстрации для
  бар-меню (сейчас — стилизованные SVG-композиции).

---

## 3. JS / CSS

### Цель
Уменьшить размер и количество критических запросов; разнести редко
обновляемые vendor-чанки от часто-меняющегося приложения.

### Сделано (Phase 9.D)
- ✅ Vite `manualChunks`: `react-vendor`, `router-vendor`, `icons-vendor`.
- ✅ Pre-compression на этапе build: `.js.gz` и `.js.br` рядом с
  оригиналом (плагин `vite-plugin-compression2`).
- ✅ Lazy-load: `CartDrawer`, `TableMap`, `BarMenuSection`, `AdminApp`.
- ✅ `cssCodeSplit: true` + content hashing. Долгий cache-control
  гарантируется immutable hash в имени.
- ✅ Source-maps генерируются — для дебага RUM-ошибок.

### Дальше
- ⏳ Tree-shake `lucide-react`: переключиться на индивидуальные
  импорты `lucide-react/icons/Phone` (сейчас именованные, но vite
  всё ещё тянет весь icon-vendor 17.5 kB → 4 kB gzipped).
- ⏳ CSS purge / atomic-CSS — оценить размер `index.css`.
- ⏳ Inline critical-CSS для above-the-fold секции (hero) через
  `vite-plugin-inline-css-modules` или Critters.
- ⏳ Перевести все импорты CSS компонентов на `?inline` для
  components-island'ов с приватной стилизацией.

---

## 4. Service Worker / PWA

### Цель
Мгновенный повторный запуск, оффлайн для главной + меню, минимизация
сетевых RTT для статики.

### Сделано (Phase 9.C)
- ✅ Маршрутизация SW (`public/sw.js`):
  - cache-first для hashed `/assets/*-HASH.js|css`
  - network-first для navigate
  - SWR для изображений (LRU 60)
  - **SWR для `/api/menu`** (LRU 8)
  - **SWR с TTL 60 c для `/api/tables`** (sw-cached-at header)
  - не перехватываем range/video, не перехватываем `socket.io`
- ✅ `LRU trim` для runtime / image кэшей.
- ✅ Versioned cache namespaces; cleanup на `activate`.
- ✅ App-shell precache (logo, hero-poster, cloud-hero × sm).
- ✅ Manifest, install prompt (`PWAInstallPrompt`), maskable icons.

### Дальше
- ⏳ Workbox-precache манифеста build-output: автоматически
  заполнять список hashed `/assets/*` при сборке (плагин `workbox-build`
  или собственный rollup-плагин, который пишет `precache.json`).
- ⏳ `BackgroundSync` для оффлайн-заказов (`POST /api/order` ставится в
  очередь и отправляется при восстановлении сети).
- ⏳ `Push API` для уведомлений «стол готов» / «заказ принят».

---

## 5. Сеть / бэкенд

### Цель
Сократить TTFB и количество round-trip'ов между клиентом и API.

### Сделано
- ✅ Express (`meatbar-server`) отвечает с `Cache-Control` для статичных
  ассетов; SPA отдаёт `index.html` через `etag`.
- ✅ Socket.IO для real-time tables вместо polling.
- ✅ Все `/api/*` запросы относительные → один origin → нет CORS-pre-flight.

### Дальше
- ⏳ Bun/Node 22 для бэкенда — JIT-warmup до старта.
- ⏳ Включить `compression`-middleware (gzip + brotli) для `/api/menu` JSON.
- ⏳ HTTP/2 priority hints через `Link: rel=preload` для cloud-hero.webp.
- ⏳ CDN перед Express — Cloudflare / Bunny → cache-edge для статики.
- ⏳ `Server-Timing` headers для разбивки TTFB по фазам.

---

## 6. Шрифты

### Цель
Минимум sub-resources до first paint, чтобы шрифт не блокировал текст.

### Сделано
- ✅ Используются системные шрифты + `Helvetica, Arial, sans-serif`
  fallback; нет внешних шрифт-файлов в репо.
- ✅ В `<head>` нет `<link href="fonts.googleapis...`.

### Дальше
- ⏳ Если будет принято решение добавить кастомный шрифт (например,
  «Stolzl» для логотипа) — формат `WOFF2` + subset (только Cyrillic +
  Latin Extended), `font-display: swap`.
- ⏳ `<link rel="preload" as="font" type="font/woff2" crossorigin>` в
  `index.html` для критичных вариантов начертаний.
- ⏳ Локально хранить, не запрашивать с Google Fonts.

---

## 7. Метрики (RUM)

### Цель
Видеть реальные показатели у пользователей, а не только локальный
Lighthouse.

### Сделано (Phase 9.E)
- ✅ `web-vitals` (v4) подключены, шлём `CLS / LCP / INP / TTFB` в
  `/api/rum`.
- ✅ `sendBeacon` приоритетно, `fetch keepalive` в фолбэке.
- ✅ Контекст: `pathname`, `connection.effectiveType`, `saveData`,
  `dpr`, `vw`, `userAgent`.
- ✅ Уважается `localStorage['rum.disabled']='1'`.
- ✅ Бэкенд endpoint `/api/rum` принимает batches (см. server/index.ts).

### Дальше
- ⏳ Дашборд (Grafana / Vercel Analytics / собственный) с p50 / p75 / p95
  по каждой метрике, разрезы по conn/device.
- ⏳ Alert-правила:
  - p75 LCP > 2.5 s — слать в Slack.
  - p75 INP > 200 ms — слать в Slack.
- ⏳ Связать ошибочные RUM-события с источниками через source-maps
  (Sentry / собственный stack-trace store).
- ⏳ Long-task observer (`PerformanceObserver` { type: 'longtask' }) —
  лог, какие функции блокируют main thread > 50 ms.

---

## Замер до / после Phase 9

|                            | До        | После Phase 9 |
| -------------------------- | --------- | ------------- |
| index JS gzip              | 119.7 kB  | 103.4 kB      |
| Vendor chunks (gzip)       | в index   | 22 kB total   |
| Critical чанки на главной  | index     | index + react |
| LCP-картинка               | lazy      | eager + LQIP  |
| Pre-compressed assets      | нет       | .gz + .br     |
| SW SWR для /api/menu       | нет       | да            |
| RUM (web-vitals)           | нет       | да (4 метрики)|

Целевой бюджет (web.dev):
- LCP ≤ 2.5 s p75
- CLS ≤ 0.1
- INP ≤ 200 ms p75
- TTFB ≤ 800 ms p75

---

## Запуск проверок

```bash
# Локальный production build + анализ размера
cd ~/work/meatbar
npm run build
ls -la dist/assets | head -20
# Проверка наличия .gz/.br файлов
find dist -name "*.gz" | head; find dist -name "*.br" | head

# Lighthouse в headless
npx lighthouse http://localhost:4173 --preset=desktop --view
```

---

_Документ актуализируется при каждом релизе Phase 9.x. Текущий
владелец: команда фронтенда Мясо Бар._

---

## Phase 9 — Карточки-сцены и медиа столов

- 14 слугов медиа в `public/assets/tables/<slug>-...` —
  WebP `q=80 / sm q=76`, MP4 в трёх ступенях
  (1080p CRF 21 / 720p CRF 22 / 360p CRF 25, all `+faststart`,
  bitrate cap 4500k / 2400k / 800k).
- `<source media="(min-width: 1100px)">` отдаёт 1080p только
  десктопу, иначе 720p, иначе 360p — мобильный никогда не качает
  больше ~10 МБ на карточку.
- Видео грузится `preload="metadata"` и стартует **только** в видимой
  зоне (`IntersectionObserver`, threshold 0.4); пауза при выходе.
- Фото остаётся под видео — пока ролик не запустился, карточка не
  «мерцает» на чёрном фоне постера.
- Кадры-постеры: один JPEG `q=82, w=1280` на слаг (общий для всех
  трёх MP4), отдаётся как `poster=` атрибут.

Эффект: на десктопе карточки выглядят живыми (премиум-видео без
лагов), на мобильном остаются лёгкими (≈ 0.6–1.4 МБ за карточку
вместо исходных 6–9 МБ).
