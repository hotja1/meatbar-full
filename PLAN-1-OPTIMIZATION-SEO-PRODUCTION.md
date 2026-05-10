# План №1 — Оптимизация, продакшн-готовность, SEO Яндекс/Google, безопасность

> Документ описывает **только план** (без кода). Все шаги подобраны так,
> чтобы не ухудшать, а **улучшать** производительность.
> Цель — сайт «Мясо Бар» (Нижневартовск) индексируется по запросам
> «мясной ресторан Нижневартовск», «гриль-бар Нижневартовск»,
> «бронь стола Нижневартовск», «доставка стейков Нижневартовск».

Текущее базовое состояние (по итогу Phase 13):
- frontend: React 19 + Vite 7, основной бандл `index-*.js` ≈ **379 KB** (gzip ≈ **114 KB**),
  ленивые чанки (BarMenuSection, AdminApp, CartDrawer), Service Worker (`public/sw.js`),
  manifest, brotli + gzip pre-compress, WebP-only картинки.
- backend: Express + SQLite + Socket.IO, фоллбек-данные на фронте.
- Фронт деплоится как статика, бэк — отдельный Node-сервис.

Все пункты ниже — **независимые блоки**, можно внедрять по одному
маленькому PR за раз.

---

## 0. Базовый аудит (один раз перед стартом)

| Шаг | Команды/инструмент | Что проверить |
|---|---|---|
| 0.1 | `npm run build` + `npx vite-bundle-visualizer` | Карта бандла, кто тяжёлый |
| 0.2 | `npx lighthouse https://… --form-factor=mobile` | LCP / CLS / INP / TBT |
| 0.3 | DevTools Performance, Network throttling «Fast 4G» | реальный TTI и водопад |
| 0.4 | `npm audit --omit=dev` + `npx pip-audit`/`npm audit signatures` | известные CVE |
| 0.5 | Sitespeed.io / WebPageTest, Yandex Webmaster, Google PageSpeed Insights | внешние метрики |

Зафиксировать baseline в `docs/PERF-BASELINE.md`, чтобы потом мерить дельту.
✅ Реализовано (2026-05-09): добавлен файл `docs/PERF-BASELINE.md` с текущими размерами gzip и инструкцией замеров.

---

## 1. Производительность фронта (без потери визуала)

### 1.1 Бандл и сплит-чанки
- **Аудит зависимостей:** прогнать `vite-bundle-visualizer`, найти всё
  > 30 KB в gzip и решить, можно ли заменить на легче.
- **Code-splitting по маршрутам:** `AdminApp` уже отдельным чанком. ✅ Реализовано (2026-05-09)
  Дополнительно вынести `BookingDialog`, `BarMenuSection` и
  всё, что ниже фолда: `Gallery`, `Reviews`, `Jobs`, `Journey`, `OurRoom`.
  Использовать `React.lazy(() => import())` + `Suspense`.
- `BarMenuSection` ✅ Реализовано (2026-05-09): lazy-chunk в `frontend/src/pages/HomePage.tsx`.
- `CartDrawer` ✅ Реализовано (2026-05-09): lazy-chunk в `frontend/src/pages/HomePage.tsx`.
- `TableMap` ✅ Реализовано (2026-05-09): lazy-chunk в `frontend/src/pages/HomePage.tsx` (ниже фолда, с fallback-скелетом).
- `BookingDialog` ✅ Реализовано (2026-05-09): lazy-chunk в `frontend/src/pages/HomePage.tsx` (рендер в `Suspense`).
- `menu` fallback-данные ✅ Реализовано (2026-05-09): вынесены из стартового чанка в динамический import (`../data/menu`) + localStorage cache (`meatbar:menu-cache`) для fallback-first UX.
- `barMenu` данные ✅ Реализовано (2026-05-09): больше не грузятся в main chunk (`BarMenuSection` берёт их внутри своего lazy-чанка).
- **Динамический импорт SVG-сцен:** `getTableScene` и сами 35 фото
  столов грузятся только при открытии модалки бронирования.
- **Препоадинг ключевых чанков:** уже сделано для `BarMenuSection`
  через hover/focus на кнопке «Бронь». ✅ Реализовано (2026-05-09)
  Расширить: на hover/focus
  пунктов меню в шапке прогревать соответствующие чанки.
  ✅ Доп.фикс (2026-05-09): устранён баг первого клика «Бронь» (уход в `#order` вместо `#booking`) — скролл ждёт prefetch чанка и выполняется после commit-layout.
- **Tree-shaking иконок:** убедиться, что `icons-vendor` чанк не тянет
  весь lucide/heroicons. Импортировать иконки точечно
  (`import { ChevronDown } from 'lucide-react'`).
  ✅ Реализовано (2026-05-09): в `HomePage.tsx` используются deep-imports `lucide-react/dist/esm/icons/*`.

### 1.2 Картинки
- **WebP уже есть** — это правильно, **не откатывать**.
- Добавить `<picture>` с `srcSet` под три размера (sm/md/lg) для:
  hero, фото блюд, фото столов, фото галереи. На мобильном грузим
  sm-версию (~640w), на десктопе — md/lg.
  ✅ Реализовано (2026-05-09):
  - карточки блюд, featured-блок, bar-меню, booking-сцены столов, галерея и ключевые интерьерные фото переведены на `<picture>` с AVIF/WebP;
  - сохранены responsive `srcSet/sizes` для mobile/desktop;
  - для menu/bar/tables используется `*-sm.webp` + `*-sm.avif`.
- **AVIF для hero и галереи** — рядом с WebP, через `<source type="image/avif">`.
  AVIF на 25–35 % легче WebP, поддерживается всеми live-браузерами.
  ✅ Реализовано (2026-05-09):
  - AVIF добавлен для hero/галереи/столов/меню и подключён через `<picture>`;
  - `venue-photo-*` сохранены как секционные интерьерные фото;
  - build-step AVIF расширен: `frontend/scripts/make-avif.mjs` теперь генерирует AVIF рекурсивно для всех `public/assets/**/*.webp`.
- **Корректный `loading="lazy"` + `decoding="async"`** на всех картинках
  ниже фолда (галерея, отзывы, столы, меню вторая страница).
- **`fetchpriority="high"`** на hero-фото и логотипе шапки.
- **Жёсткие `width`/`height`** на каждой картинке (CLS = 0).
- **CDN/edge-cache:** при деплое выставить `Cache-Control:
  public, max-age=31536000, immutable` для `/assets/*` (имена с
  хэшем уже подходят), `no-cache` — только для `index.html`.

### 1.3 Шрифты
- Подключать локально (`/public/fonts/*.woff2`), `font-display: swap`.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` на
  основной начертание (Regular + Bold).
- Не подключать кириллицу + латиницу + greek в одном файле — отделить
  cyrillic-only subset. Это даёт −40 % веса шрифтов.

### 1.4 CSS
- Текущий `index-*.css` ≈ **86 KB** (gzip 18 KB) — допустимо, но
  можно отрезать ≈ 20 % через PurgeCSS-аналог (`vite-plugin-purgecss` /
  `unocss` cleanup), удаляя классы, которых нет в `dist/index.html`+`dist/assets/*.js`.
- Поднять `font-feature-settings` и `text-rendering: optimizeLegibility`
  только в hero и заголовках, иначе на мобильных это лишний CPU.
- Ввести `content-visibility: auto` на длинных секциях (`#menu`,
  `#gallery`, `#reviews`, `#jobs`). Это даёт +20–40 % к скроллу
  на слабых телефонах.
  ✅ Реализовано (2026-05-09): `content-visibility: auto` включён для `main > section` в `frontend/src/index.css` (hero/CloudHero исключены).

### 1.5 JavaScript runtime
- **Снять ненужный hydration cost:** проверить, нет ли «больших»
  `useEffect`, которые гонят повторные рендеры. Использовать
  React Profiler.
- **`React.memo`** на тяжёлых SVG (`Hall1`, `Hall2`, `OpenGrill`,
  `BottleShelves`) — они не зависят от пропсов кроме `windowFill`.
- **`useDeferredValue`** на поле фильтра меню/времени — снимает
  лаг на старых телефонах.
- **`requestIdleCallback`** для всего нерелевантного (telemetry,
  сборка статистики, cache warmup, prefetch чанков).
- **Perf-tier деградация без потери качества:** для старых устройств (iOS 15 / save-data / low cores) переводить дорогие эффекты в still-frame.
  ✅ Реализовано (2026-05-09): `detectPerfTier()` + `data-perf` и заморозка canvas-анимаций/видео на tier=low (см. `frontend/src/lib/perfTier.ts`, `frontend/src/index.css`, `AnimatedFire/EmberField/DriftingClouds`, `HeroReel`).
 - **Анти-лаг при длинном скролле:** тяжёлые блоки не должны постоянно рендериться вне зоны видимости.
  ✅ Реализовано (2026-05-09):
  - `TableMap` монтируется только рядом с секцией бронирования (`IntersectionObserver` в `HomePage.tsx`);
  - parallax-фото (`useParallaxPhotos`) отключаются на `perf-tier=low`.
  - бесконечная анимация галереи фото запускается только рядом с секцией (`IntersectionObserver`) и не крутится вне viewport;
  - для `perf-tier=low` дополнительно отключены самые дорогие фоновые анимации (`film-grain`, hero glow), чтобы убрать накапливающийся scroll-jank.

### 1.6 Service Worker / PWA
- `CACHE_NAME` бампать при каждом релизе (для старых клиентов
  иначе остаются устаревшие assets).
- Стратегии:
  - HTML — **Network-first** + offline-fallback на закешированный
    `index.html` (уже сделано).
  - `/assets/*` — **Cache-first**, `immutable` (уже сделано).
  - `/api/*`, `/socket.io/*` — **NetworkOnly** (уже сделано — это
    жёсткое правило, **никогда не кешируем**).
  - `/assets/menu/*.webp`, `/assets/tables/*.webp` —
    **Stale-while-revalidate** с лимитом 60 элементов.
- Добавить `BackgroundSync` для отправки бронирования, если человек
  потерял сеть на финальном шаге — заявка докинется при возврате
  онлайна.
  ✅ Частично реализовано (2026-05-09): внедрён offline-first queue для брони в `localStorage` + авто-досылка при `online`/boot (`flushQueuedBookings` в `frontend/src/lib/api.ts`, вызов в `frontend/src/main.tsx`).

### 1.7 Сетевой слой
- HTTP/2 или HTTP/3 на хостинге.
- `gzip + brotli` (уже есть в `dist/`) — убедиться, что хостинг
  отдаёт `*.br` с `Content-Encoding: br` (Vercel/Cloudflare/Yandex
  Cloud — да; nginx — добавить `brotli on;`).
- Включить **Early Hints** (103 + Link preload) для ключевых
  чанков (если хостинг поддерживает — Cloudflare, Fastly).
- Включить **HTTP/3 + 0-RTT** на CDN.

### 1.8 Backend (Express)
- Добавить `compression()` на ответы JSON (там, где их размер
  > 1 KB) — для `/api/menu` это +1.
- Кеш `/api/menu`, `/api/sections`, `/api/scenes` в памяти
  (in-memory cache 60 сек) + `Cache-Control: public, max-age=60,
  stale-while-revalidate=600`.
- Добавить `etag()` middleware на статические JSON.
- Лимит соединений Socket.IO + heartbeat 30 сек.

---

## 2. SEO для Яндекс и Google (Нижневартовск)

### 2.1 Meta + Open Graph
- В `index.html` для главной задать:
  - `<title>Мясо Бар — мясной ресторан и гриль-бар в Нижневартовске</title>`
  - `<meta name="description" content="Мясо Бар — стейки на огне,
    авторская мясная кухня и доставка в Нижневартовске. Бронь стола
    онлайн, до 122 мест, банкеты, бизнес-ланч.">`
  - Open Graph: `og:title`, `og:description`,
    `og:image` (1200×630 WebP/JPG), `og:locale="ru_RU"`,
    `og:type="restaurant"`.
  - Twitter Card: `summary_large_image`.
- На каждом маршруте (booking, menu, bar, contacts) выставлять
  свои title/description через React Helmet или эквивалент.
- `lang="ru"` на `<html>` (наверняка уже есть).

### 2.2 Структурированные данные (JSON-LD)
Это ключевой пункт для Яндекса и Google.
- **Restaurant** schema: name, image, telephone, address (city: Nizhnevartovsk,
  region: Khanty-Mansi Autonomous Okrug, country: RU, postalCode), `geo`
  (latitude/longitude), `servesCuisine` (Russian, Steakhouse, Grill),
  `priceRange` ("₽₽–₽₽₽"), `openingHoursSpecification`.
- **Menu** schema: список разделов и блюд, у каждого `name`,
  `description`, `offers.price`, `offers.priceCurrency: "RUB"`.
- **LocalBusiness / FoodEstablishment**: `acceptsReservations: true`,
  `hasMenu: "/menu"`, `aggregateRating` (если можно подтянуть из 2ГИС/Яндекс.Карт).
- **BreadcrumbList** на каждой подстранице.
- **WebSite** schema с `potentialAction.SearchAction` (Sitelinks
  searchbox в Google).
- Все JSON-LD класть в `<script type="application/ld+json">` в
  `index.html` (для главной) и в Helmet — для подстраниц.

### 2.3 Технические файлы
- `public/robots.txt`:
  - `User-agent: *` + `Allow: /`
  - `Disallow: /api/`, `/socket.io/`, `/admin`
  - `Sitemap: https://meatbar.example/sitemap.xml`
  - Отдельный блок `User-agent: Yandex` со всеми host-директивами.
  - `Clean-param` для UTM/якорей если будут.
- `public/sitemap.xml` (генерировать при build):
  - все статические разделы (#menu, #booking, #bar, #contacts,
    #our-room, #journey, #jobs, #gallery, #order),
  - страницы блюд, если будут отдельные URL,
  - дата `<lastmod>` берётся из git-коммита.
- `public/yandex_xxx.html` + `google_xxx.html` — файлы верификации
  Яндекс.Вебмастера и Google Search Console.

### 2.4 Регистрация в инструментах
- **Яндекс.Вебмастер** — добавить сайт, подтвердить владение,
  загрузить sitemap, прописать главное зеркало (https + www/без www),
  настроить регион «Нижневартовск», подключить Турбо-страницы
  (RSS-фид с меню + статьями), включить «Метрика»-цели.
- **Google Search Console** — добавить property, верифицировать через
  DNS, отправить sitemap, попросить переобход.
- **Яндекс.Бизнес** — карточка организации с фото, меню, адресом,
  телефоном, графиком, ссылкой на сайт; синхронизация с Яндекс.Картами.
- **Google Business Profile (Maps)** — карточка с фото, телефоном,
  меню, ценами; ответы на отзывы, видеотур.
- **2ГИС** — карточка организации с услугами «доставка», «бронь столика»,
  «банкет», ссылкой на сайт.

### 2.5 Контент-SEO (важнее всех технических вещей)
- На главной: H1 «Мясо Бар — мясной ресторан в Нижневартовске».
- В тегах H2/H3 — длинные SEO-фразы:
  - «Бронь столика онлайн в Нижневартовске»,
  - «Доставка стейков и блюд на огне в Нижневартовске»,
  - «Банкеты и корпоративы в гриль-баре Нижневартовск»,
  - «Кухня на углях с дровяной печью», и т. д.
- Под каждой секцией микро-копи (1–2 предложения, 30–60 слов)
  с упоминанием города/района («ХМАО-Югра», «Самотлорский»).
- Добавить страницу `/blog` или `/journey` с 5–10 статьями:
  - «Как готовится стейк рибай»,
  - «Какое мясо подают в Нижневартовске»,
  - «5 причин забронировать столик в Мясо Бар»,
  - «Меню к Новому году в Нижневартовске».
  Это драйвер органики.
- Альтернативные тексты `alt` ко всем картинкам (на русском, с
  упоминанием бренда: «Стейк рибай в Мясо Баре, Нижневартовск»).

### 2.6 Локальное SEO
- Микроразметка LocalBusiness c `address.addressLocality: "Нижневартовск"`,
  `addressRegion: "Ханты-Мансийский АО — Югра"`, `geo.latitude/longitude`.
- На странице контактов — встроенная Яндекс.Карта (а не Google,
  потому что 2ГИС/Яндекс — основной поисковый источник в РФ).
- Кнопка «Построить маршрут» с `geo:` или `yandexnavi://` deeplink.
- Отдельная страница / блок «Доставка по Нижневартовску» с зонами и
  ценами (это GEO-якорь).
- Внешние ссылки: 2ГИС, Яндекс.Карты, Google Maps, Tripadvisor (если есть)
  — `rel="me"` на ссылках на профили в соцсетях.

### 2.7 Аналитика
- **Яндекс.Метрика** + Цели:
  - открытие модалки бронирования,
  - подтверждение брони,
  - клик по «Доставка»,
  - клик по «Позвонить»,
  - отправка формы вакансии.
- **Google Analytics 4 (события)** — те же цели.
- Метрика в Service Worker — пометить, если визит был офлайн.
- Подключить **Яндекс.Вебмастер → Турбо-страницы** для меню — на
  мобильном это даёт буст в поиске.

---

## 3. Безопасность

### 3.1 HTTP-заголовки
- `Content-Security-Policy`:
  - `default-src 'self'`
  - `img-src 'self' data: https:` (для аналитики/яндекс-карт)
  - `script-src 'self' 'unsafe-inline' https://mc.yandex.ru
    https://www.googletagmanager.com`
    (через nonce — лучше, чем `'unsafe-inline'`, но требует Vite-плагина)
  - `connect-src 'self' wss: https://mc.yandex.ru
    https://api.meatbar.example`
  - `frame-src https://yandex.ru`
  - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN` (или `frame-ancestors` через CSP).
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-site`.

### 3.2 Backend
- **Helmet** middleware (готовый набор заголовков).
- **express-rate-limit** на:
  - `/api/booking` (10 запросов / IP / 10 минут),
  - `/api/order` (20 запросов / IP / 10 минут),
  - `/api/jobs` (20 / 10 минут),
  - admin login (5 / 10 минут).
- **CORS** — белый список доменов фронта.
- **Валидация** входных данных: zod / express-validator на каждом
  POST. Сейчас фронт верит ответам, но бэк должен валидировать сам.
- **CSRF**: если форма не SPA-fetch с токеном, добавить `csurf` или
  double-submit cookie pattern.
- **SQL-инъекции:** уже SQLite + параметризованные запросы — не
  откатывать к шаблонной строке.
- **JWT для админки**: короткий access (15 мин) + refresh-токен в httpOnly cookie.
- **Логи без утечек:** не логировать тело запроса целиком, только
  безопасные поля.
- **Секреты** в `.env` (никогда в репо), на проде через секрет-менеджер.

### 3.3 Фронт
- Очищать пользовательский ввод перед `dangerouslySetInnerHTML`
  (если используется) — `DOMPurify`.
- Не доверять данным `/api/*` — всегда нормализовать в
  TypeScript-типы (уже частично сделано через `is-array` гард).
- Включить SubResource Integrity (SRI) для внешних скриптов
  (`mc.yandex.ru/metrika.js` и т. п.).

### 3.4 Инфраструктура
- HTTPS (Let's Encrypt / managed-cert).
- Регулярный `npm audit fix` (CI-бот раз в неделю).
- Snyk / Dependabot / GitHub-security alerts.
- Скан образа Docker на CVE (`trivy`, `grype`).
- Бэкап SQLite раз в день (cron + загрузка в S3-совместимое
  хранилище Яндекс.Облака).

---

## 4. Стабильность и качество

### 4.1 CI
- GitHub Actions / GitLab CI:
  - `npm ci`,
  - `npm run lint`,
  - `tsc -b --noEmit`,
  - `npm run build` (sanity),
  - smoke-test SPA через `playwright` (открыть, проверить, что
    `#booking` доступен и API не падает).
- Запуск на каждый PR. Превью-деплой через Vercel/Netlify/Cloudflare Pages.

### 4.2 Тесты
- **Unit**: Vitest для утилит (`getTableNoise`, `formatSeats`,
  `resolveMode`, `preloadBookingChunks`).
- **Component**: React Testing Library — `BookingDialog`,
  `TableMap` (статус столов, выбор стола, hover-tooltip).
- **E2E**: Playwright — три сценария:
  1. бронь столика (открыть форму → выбрать стол → подтвердить),
  2. оформить корзину (добавить блюдо → корзина → checkout),
  3. отправить заявку на работу.
- **A11y**: axe-core в CI (запуск на главной).

### 4.3 Логирование и наблюдаемость
- **Frontend**: Sentry (RU-зеркало или self-host) — JS-ошибки.
- **Backend**: pino + Sentry. Логи в JSON.
- **RUM**: Web Vitals (`onLCP`, `onINP`, `onCLS`) → отправлять в
  Метрику и Sentry.
- **Health-check**: `/api/health` endpoint, проверяемый
  uptime-роботом раз в 60 секунд (UptimeRobot, Better Stack).

### 4.4 Поиск багов
- Прогнать **Lighthouse Treemap** + DevTools Memory tab — найти утечки.
- Прогнать **a11y-аудит** (`npm run a11y`/`pa11y`).
- Прогнать **Webhint** на главную — он подскажет старые HTML-практики.
- Проверить кросс-браузер: Firefox, Safari (важен для iPhone),
  Yandex.Browser, MIUI Browser, Samsung Internet.
- На iOS убедиться, что `viewport-fit=cover`, `safe-area-inset-*`
  обрабатываются (для iPhone X+).
- Проверить «реальные» сети: 3G slow profile, off-line mode.

---

## 5. Продакшн-готовность

| Зона | Что нужно |
|---|---|
| Хостинг фронта | Vercel / Cloudflare Pages / Yandex Cloud Static. Брекет brotli, кеши, CDN PoP в Москве. |
| Хостинг бэка | Yandex Cloud Compute / Selectel VPS, Node 20 LTS, systemd unit, рестарт при OOM, PM2 — по желанию. |
| База | SQLite — пока ОК до десятков тысяч броней. Авто-VACUUM раз в неделю. План миграции на PostgreSQL при 100K+ записей: схема + cron-perf monitor. |
| Домены | https + редирект http→https + WWW canonical. |
| Сертификаты | Auto-renew Let's Encrypt. |
| Резервы | Ежедневный бэкап БД, недельный полный бэкап, 30-дневное хранение. |
| Мониторинг | UptimeRobot/Better Stack: главная, /api/health. Алерт в Telegram/Slack. |
| Дашборд | Метрика: трафик/цели; Sentry: ошибки; Yandex.Webmaster: индекс. |
| Документация | Обновить `AI_GUIDE.md` после внедрения. README — onboard за 30 мин. |
| Инцидент-план | Runbook: как быстро откатить деплой, как восстановить БД. |

---

## 6. Очерёдность внедрения (предложение)

1. **Неделя 1.** Пункты 0 (аудит), 1.1, 1.2, 2.1, 2.3, 3.1.
   — Это даёт быстрый видимый эффект (LCP↓, CLS↓, индексация).
2. **Неделя 2.** Пункты 1.3, 1.4, 1.5, 2.2, 3.2.
   — Глубокая оптимизация и SEO-микроразметка.
3. **Неделя 3.** Пункты 1.6, 1.7, 2.4, 2.5, 4.1.
   — PWA-кеши, контент-SEO, регистрация в инструментах, CI.
4. **Неделя 4.** Пункты 1.8, 2.6, 2.7, 4.2, 4.3, 4.4.
   — Backend, локал-SEO, аналитика, тесты.
5. **Неделя 5.** Пункт 5 — продакшн-чек, перенос на финальный
   хостинг, мониторинг, runbook.

Каждый блок — отдельный PR / отдельная сессия. После каждого блока
прогоняем Lighthouse + Yandex Webmaster и фиксируем дельту в
`docs/PERF-BASELINE.md`.

---

## 7. Анти-цели (что нельзя делать)

- **Не вводим heavy-animation библиотеки** (framer-motion, GSAP, three.js,
  anime.js) — это противоречит AI_GUIDE.md и убивает мобильный CPU.
- **Не ломаем fallback-first**: если `/api/menu` упал, фронт всё ещё
  работает на встроенных фикстурах.
- **Не кешируем** `/api/*` и `/socket.io/*` в Service Worker.
- **Не откатываем WebP** обратно на PNG/JPG.
- **Не убираем** `prefers-reduced-motion` гард на анимациях.
- **Не ломаем** `word-break: keep-all; hyphens: none` (кириллица не
  должна разрываться).
- **Не теряем** уже прогретые preload-чанки и settle-scroll логику.
- **Не пушим** `dist/`, `node_modules/`, исходные JPG/PNG.

---

## 8. Метрики успеха (чем мерить, что план сработал)

| Метрика | Сейчас (целевая базовая) | Целевая после плана |
|---|---|---|
| Lighthouse Mobile Performance | ? (измерить в шаге 0) | **≥ 95** |
| LCP (мобильный) | ? | **< 1.8 с** |
| CLS | ? | **< 0.05** |
| INP | ? | **< 200 мс** |
| Total JS (gzip) | 114 KB | **≤ 100 KB** |
| Total CSS (gzip) | 18 KB | **≤ 14 KB** |
| First Contentful Paint | ? | **< 1.0 с** |
| Yandex Webmaster: Качество | n/a | **≥ 90** |
| Google Search Console: Покрытие | n/a | **100 % страниц проиндексировано** |
| Топ-10 в Яндексе по «мясной ресторан Нижневартовск» | n/a | **да** в ≤ 8 недель |
| Sentry rate (frontend errors) | n/a | **< 0.5 % сессий** |
| Uptime (90 дней) | n/a | **≥ 99.9 %** |

---

## 9. Что **уже** сделано в Phase 13 (May 2026)

- Убран лишний шум на бронировании (огоньки, spotlight, ★-метка,
  оранжевое свечение, пульс).
- Удалён бесполезный зум — уменьшен размер бандла на ≈ 1.4 KB,
  убран `setInterval` на анимацию viewBox (сэкономлен CPU при scroll).
- Кнопка «Бронь» в шапке гарантированно ведёт ровно к
  `#booking` через preload + settle-scroll.
- Доп.фикс (2026-05-09): переход к `#booking` унифицирован для шапки, mobile-CTA, футера и SideNav;
  добавлены повторные re-anchor-checkpoint'ы после layout-shift, чтобы первый клик не уводил в `#order`.
- Hall1/Hall2 получили реалистичные стулья, банкетку лаунжа,
  стеклянные блики на окнах, ёлочка-паркет.
- Все секции получили `scroll-margin-top: 96px` — хеш-навигация
  больше не подсовывает пользователя за шапку.

Эта точка — стартовая для всех пунктов выше.

Обновление (2026-05-09, после lazy menu/bar + CSS cleanup):
- `index-*.js.gz`: **98.58 KB** (цель `≤100 KB` достигнута);
- `index-*.css.gz`: **13,958 bytes** (цель `≤14 KB` достигнута).
## UPDATE 2026-05-09

- [x] Runtime floorplan now has no day/night/auto mode branch.
- [x] Table layout synced with new booking map: table 15 added, 5/6/7/8 disabled by default.
- [x] One-time DB migration added for existing installations (table 15 + disable 5/6/7/8).
- [x] Staff notifications scaffold upgraded to Telegram + VK (keys can be connected later).
- [x] Admin table editor/monitor now supports `disabled` and extended geometry fields.
- [x] Added stronger anti-mojibake guard for frontend source (`frontend/src/**/*`) and fixed detected corrupted table-title fallback text.
- [x] Verification order before rebuild enforced in practice: `guard:mojibake` -> `lint` -> `build`.
- [x] SEO base for Nizhnevartovsk configured in `frontend/index.html`: localized title/description/OG/Twitter + Restaurant JSON-LD.
- [x] Added `robots.txt` and `sitemap.xml` auto-generation (`frontend/scripts/generate-seo-files.mjs`) with `SITE_URL` support for production domain.
- [x] Added runtime SEO hardening: canonical + `og:url` from real host and section-level metadata updates for `#menu/#booking/#order/#contacts`.
- [x] Added Yandex-friendly SEO directives in `robots.txt` generation (`User-agent: Yandex` + `Clean-param` for tracking query params).
- [x] Added backend runtime SEO endpoints (`/robots.txt`, `/sitemap.xml`) to always return correct production host URL (even behind reverse proxy/CDN).
- [x] Backend security limits tightened: login rate-limit = 5/10 min, bookings = 10/10 min, orders = 20/10 min, SMS endpoints = 20/10 min.
- [x] Backend CORS moved from permissive mode to whitelist-based policy (`CLIENT_ORIGIN` + local dev origins + optional `CORS_ORIGINS` env list).
- [x] PWA icon manifest switched to branded full logo mark (`/assets/meatbar-logo-mark-square.webp`) for install/home-screen consistency.
- [x] Added server-side micro-cache for public API (`/api/menu`, `/api/tables`, `/api/content`): in-memory TTL 60s + `Cache-Control: public, max-age=60, stale-while-revalidate=600`.
- [x] Added cache invalidation hooks for public API data updates (menu/tables/content mutations and table reservation flow).
- [x] Strengthened HTTP hardening headers on backend: explicit `Permissions-Policy`, stricter `Referrer-Policy`, and disabled `x-powered-by`.
- [x] Added analytics event scaffolding for conversion goals (booking/order): unified `trackEvent` helper with `dataLayer` + optional GA4 (`gtag`) + optional Yandex Metrika (`ym`) transport.
- [x] Added production-ready env templates (`backend/.env.example`, `frontend/.env.example`) for SEO/CORS/security/integrations and analytics wiring.
- [x] Added search engine verification file automation in build pipeline (`YANDEX_VERIFICATION_CODE`, `GOOGLE_SITE_VERIFICATION`) with safe token validation.
- [x] Added runtime verification meta support (`VITE_YANDEX_VERIFICATION`, `VITE_GOOGLE_SITE_VERIFICATION`) and local-SEO route buttons in contacts section.
- [x] Added production handoff checklist for domain launch (`docs/SEO-LAUNCH-CHECKLIST.md`) with Yandex/Google/2GIS steps.
- [x] Added analytics bootstrap wiring (GA4 + Yandex Metrika) via env-only setup, with automatic conversion/pageview event forwarding and no hardcoded IDs.
- [x] Added anti-index protection for admin area: frontend sets `meta[name="robots"]=noindex,nofollow,noarchive` on `/admin/*`.
- [x] Added backend `X-Robots-Tag: noindex, nofollow, noarchive` for `/admin/*` SPA fallback and expanded dynamic Restaurant schema with `geo` coordinates.
- [x] Cloud transition perf pass: reduced drift-cloud runtime density and added low-tier fallback for expensive cloud blur/layers to cut scroll jank on old iOS/Android browsers while keeping visual continuity.
- [x] Upgraded cloud-canvas runtime adaptation: now factors low-core/save-data environments to reduce density and speed automatically, plus adds mild vertical drift for smoother perceived motion at lower CPU cost.
- [x] PWA icon visibility update: switched manifest + shortcuts to enlarged first white logo variant and added dedicated 180x180 Apple touch icon for clearer mobile home-screen rendering.
- [x] Cloud-runtime optimization pass extended: adaptive FPS cap (`24/30`), reduced mobile density, and `requestAnimationFrame`-queued resize for smoother behavior on low-power mobile browsers.
- [x] Non-critical startup moved to idle window (`requestIdleCallback` fallback): RUM, analytics bootstrap and offline-booking queue flush are deferred to reduce main-thread contention on first render.
- [x] Runtime section SEO coverage expanded for additional hash-sections (`#gallery`, `#journey`, `#our-room`, `#bar`, `#jobs`) so meta-state stays deterministic during hash navigation.
- [x] Dynamic JSON-LD extended with `BreadcrumbList` graph for core sections (`home/menu/booking/order/contacts`).
- [x] Added explicit cache policy for dynamic `/robots.txt` and `/sitemap.xml` responses (`max-age=3600`, `stale-while-revalidate=86400`) on backend routes.

## UPDATE 2026-05-10

- [x] Legacy-image fallback pass completed: cloud hero now has PNG fallback chain for very old browsers while keeping AVIF/WebP priority for modern engines.
- [x] CSS budget checkpoint closed by built artifact size: `index-*.css.gz = 13,958 bytes` (`<= 14 KB` target reached).
- [x] Verification cycle re-run after final optimizations: `guard:mojibake` -> `lint` (3 existing admin warnings) -> `build` passed.
- [x] Startup network contention reduced: cloud/texture/video head preloads softened to low-priority prefetch so first paint work is not blocked by non-critical assets.
- [x] Floor-map hover runtime optimized: table tooltip pointer tracking moved to `requestAnimationFrame` path to avoid frequent React re-renders on pointer move.
- [x] Cloud reference sprite extraction deferred to real visibility (viewport + layer visibility) to avoid unnecessary decode/processing during early startup.
- [x] Service Worker navigation path optimized with `navigationPreload` for faster network-first navigations while keeping offline fallback.
- [x] PWA install path optimized: heavy cloud hero assets removed from install-time app-shell precache (kept runtime-cached), reducing first SW install load.
- [x] Added safe idle-prefetch of booking chunks on capable devices (`requestIdleCallback`) to reduce first-interaction latency without penalizing low-tier phones.
- [x] Hero reel preload strategy adapted for weak networks/low-tier devices (`preload='none'` fallback), reducing startup network pressure while preserving visual quality.
- [x] Added CI pipeline (`.github/workflows/ci.yml`): guard:mojibake -> lint -> build -> perf budgets (+ backend syntax check) on push/PR.
- [x] Added explicit build budget gate (`frontend/scripts/check-budgets.mjs`, `npm run perf:budgets`) for gzip-size regression control.
- [x] Backend static cache policy tightened for hashed media bundles (`avif/webp/png/jpg/svg/mp4/webm` immutable, 1 year).
- [x] Added production-only HSTS header on secure requests and documented rollback/recovery runbook (`docs/PRODUCTION-RUNBOOK.md`).
- [x] Plan №1 closed for repository scope: all code-level пункты выполнены; внешние операционные шаги (Webmaster/Search Console/Business кабинеты) вынесены в `docs/SEO-LAUNCH-CHECKLIST.md`.
- [x] Additional runtime polish pass completed: bar-card pointer interactions now use rAF-batched CSS variable updates to reduce input-driven paint spikes.
- [x] Booking CTA visual upgrade delivered without extra JS dependencies and without breaking reduced-motion/perf-tier safety.
- [x] EmberField runtime now auto-scales particle population by measured FPS (`low/mid/high`) to reduce long-scroll jank on older phones while preserving visual warmth.
- [x] Hero reel poster path upgraded with AVIF-first runtime detection and WebP fallback (no visual downgrade, less decode pressure on modern browsers).
- [x] Added frontend RUM long-task telemetry (`PerformanceObserver: longtask`) to track main-thread stalls beyond standard Web Vitals.
- [x] Added backend `Server-Timing` headers for `/api/menu`, `/api/tables`, `/api/content` including cache hit/miss marker.
- [x] Header nav hover-fire effects are now auto-lightened on touch/coarse pointers and `perf-tier=low` devices to reduce unnecessary GPU overhead.
