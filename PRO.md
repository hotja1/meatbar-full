# PRO.md — свод рабочих правил для ИИ

Дата: 2026-05-11.

Этот файл — **полный свод** правил, по которым ИИ работает с проектом «Мясо Бар». Дублирует содержимое `.kiro/steering/*.md` (скрытая папка, которую Kiro автоматически подтягивает в контекст), чтобы у владельца был обычный видимый файл для надёжности и быстрой справки.

Когда владелец упоминает **`PRO`** в чате — это сигнал: «прочитай и применяй всё из этого файла».

## Приоритет правил

1. Прямой запрос владельца в текущей задаче.
2. `PRAVILA.md` — жёсткие проектные ограничения.
3. `WORKFLOW.md` — процесс выполнения.
4. `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md`, `PLAN-2-PREMIUM-VISUAL-DESIGN.md`, `planopt.md` — дорожная карта.
5. **Этот `PRO.md`** и его зеркало `.kiro/steering/*.md`.
6. `docs/PRODUCTION-RUNBOOK.md`, `docs/SEO-LAUNCH-CHECKLIST.md`, `docs/PERF-BASELINE.md` — операционка.
7. `frontend/AI_GUIDE.md` — исторический справочник (пути могут быть устаревшие, сверять с реальностью).

---

## Оглавление

1. [Обзор проекта](#1-обзор-проекта)
2. [Процесс работы над задачей](#2-процесс-работы-над-задачей)
3. [Бюджеты производительности](#3-бюджеты-производительности)
4. [Визуальный язык](#4-визуальный-язык)
5. [React 19 + TypeScript паттерны](#5-react-19--typescript-паттерны)
6. [CSS-паттерны](#6-css-паттерны)
7. [Backend-паттерны](#7-backend-паттерны)
8. [Service Worker и PWA](#8-service-worker-и-pwa)
9. [SEO для Нижневартовска](#9-seo-для-нижневартовска)
10. [Доступность (WCAG 2.2 AA)](#10-доступность-wcag-22-aa)
11. [Защита русского текста](#11-защита-русского-текста)
12. [Git и секреты](#12-git-и-секреты)
13. [Deploy runbook](#13-deploy-runbook)
14. [Error handling](#14-error-handling)
15. [Conventional Commits](#15-conventional-commits)
16. [Code review checklist](#16-code-review-checklist)
17. [Testing patterns](#17-testing-patterns)
18. [Design tokens](#18-design-tokens)
19. [Design critique — 5D self-check + anti-AI-slop](#19-design-critique--5d-self-check--anti-ai-slop)
20. [Anti-patterns catalog](#20-anti-patterns-catalog)
21. [Dependency policy](#21-dependency-policy)
22. [Observability & SLO](#22-observability--slo)
23. [Incident response (SEV-levels + runbook)](#23-incident-response-sev-levels--runbook)
24. [Release workflow](#24-release-workflow)

---

## 1. Обзор проекта

### Что это

- Ресторан/гриль-бар в Нижневартовске, сайт + админка.
- Целевой домен: `https://мясо-бар.рф`.
- Монорепо `frontend/` + `backend/` на Windows (разработка) и Linux (VPS, деплой).

### Стек

- **Frontend:** React 19 + TypeScript (strict) + Vite 6. React.lazy для ниже-фолда. Без heavy-animation библиотек.
- **Backend:** Express + SQLite (`better-sqlite3`) + Socket.IO.
- **PWA:** кастомный `public/sw.js`, manifest, установка с iOS/Android.
- **CI:** GitHub Actions, команда `guard:mojibake → lint → build → perf:budgets → node --check`.
- **Pre-compression:** `.br` + `.gz` на build (vite-plugin-compression2).

### Жёсткие запреты

- Никаких heavy-animation библиотек: framer-motion, GSAP, three.js, anime.js, lottie.
- Не ломать fallback-first: сайт обязан работать без backend через `frontend/src/data/menu.ts` и `frontend/src/data/tables-layout.ts`.
- Не кешировать `/api/*` POST и `/socket.io/*` в Service Worker.
- Не возвращать удалённые в Phase 13 эффекты столиков (огоньки, spotlight, pulse, heatmap, dim) и зум карты.
- Не менять CloudHero таймминги и сцену без явного запроса.
- Не откатывать WebP/AVIF на JPG/PNG.
- Не трогать `word-break: keep-all; hyphens: none` для русского текста.
- Не добавлять новые зависимости без разрешения.
- Не менять версии React / Vite / TypeScript / Express / SQLite без разрешения.
- Не коммитить секреты, `.env`, artefacts (`dist/`, `node_modules/`).
- Не редактировать `backend/public/` или `frontend/dist/` вручную: это артефакты сборки.
- Не делать push / commit / PR без явного запроса.

### Визуальный язык одним абзацем

Тёплый ресторанный премиум. Палитра: `ember #d81420`, `coal #120d0a`, `cream #f6eee1`, `gold #e0a64b`, плюс `brass #c69a3e`, `velvet #2c4a3c`, `leather #7a3f24`. Без синего/неона/пастели. Типографика сдержанная, сериф для заголовков, sans-serif для тела. Анимация через `transform`/`opacity`/`filter`, всегда с `prefers-reduced-motion` гардом. Блики и свет важнее ярких пятен.

### Фокус продукта

Три пользовательских потока, которые важнее всех декоративных фич:

1. **Бронь столика** — карта залов (3 зала, 35 столов, 122 места), выбор → `BookingDialog` → отправка `/api/bookings`.
   - Предзаказ меню через iframe (`/booking-menu.html`) с postMessage-коммуникацией.
   - Два режима: «Закажу на месте» (обычная бронь) и «Выбрать заранее» (бронь с оплатой).
   - При предзаказе с позициями — кнопка «Бронь с оплатой» (`paymentMethod: 'online'`), обычная кнопка скрывается.
   - Бэкенд сохраняет `pre_order` (JSON), `payment_method`, `payment_status` в таблице `bookings`.
   - YooKassa пока не подключена — `payment_status` остаётся `pending` до интеграции.
2. **Заказ блюд** — `MenuPage` (`/menu`) → `CartDrawer` → `/api/orders` (через HomePage order-section).
3. **Админка** `/admin/*` — JWT, ключ `meatbar-admin-token`, CRUD всего перечисленного.

### Роуты фронтенда

- `/` — HomePage (hero, cloud-hero, journey, cultures, order-section с featured-dishes, booking, contacts, jobs, gallery).
- `/menu` — MenuPage: полное меню блюд с категориями + корзина. Lazy-chunk.
- `/bar` — BarPage: бар-меню (BarMenuSection) + корзина. Lazy-chunk.
- `/admin/*` — AdminApp (lazy).

Корзина общая между всеми роутами через `CartContext` в `App.tsx`.

Всё остальное (галерея, journey, jobs, cloud-hero) — атмосфера.

### Текущее состояние (2026-05-11)

#### Бюджеты

| Артефакт | Лимит | Текущее |
|---|---|---|
| `index-*.js.gz` | ≤ 103 KB | 100.77 KB |
| `index-*.css.gz` | ≤ 14.10 KB | 13.22 KB |
| `BookingDialog-*.css.gz` | — | 2.45 KB |
| `BookingDialog-*.js.gz` | — | 3.39 KB |
| `MenuPage-*.js.gz` | — (lazy) | ~4 KB |
| `BarPage-*.js.gz` | — (lazy) | ~1 KB |
| `BarMenuSection-*.js.gz` | — (lazy) | ~7 KB |

#### Ключевые файлы бронирования

- `frontend/src/components/BookingDialog.tsx` — диалог брони (lazy-loaded).
- `frontend/src/components/booking-dialog.css` — стили диалога (скроллбары скрыты).
- `frontend/public/booking-menu.html` — standalone iframe-страница меню предзаказа.
- `frontend/src/data/menu.ts` — fallback-данные меню (все позиции с описаниями).
- `frontend/src/pages/HomePage.tsx` — `submitBooking()` собирает preOrder + paymentMethod.
- `frontend/src/lib/types.ts` — тип `Booking` с полями `preOrder`, `paymentMethod`, `paymentStatus`.
- `frontend/src/lib/api.ts` — `createBooking()` с offline-fallback.
- `backend/src/routes/public.js` — POST `/api/bookings` принимает preOrder/paymentMethod.
- `backend/src/db.js` — миграция колонок `pre_order`, `payment_method`, `payment_status`.

#### Статус столов

- Все 35 столов в статусе `free` (фейковые `reserved`/`held` убраны из seed и из БД).
- Стол переходит в `reserved` только при реальной брони через `/api/bookings`.

#### Меню

- 11 категорий, 70+ позиций, все с описаниями.
- Данные из `/api/menu` (бэкенд SQLite), fallback — `frontend/src/data/menu.ts`.
- Фото: WebP в `/assets/menu/`, не у всех позиций есть фото.

#### Mobile / Touch оптимизации (2026-05-11)

Реализованы 14 улучшений для мобильных устройств и PWA:

Реализованы 14 улучшений для мобильных устройств и PWA:

1. **Hover-эффекты обёрнуты в `@media (hover: hover)`** — dish-card, culture-tile, tool-grid, scene-card, table-card, bar-card. Убирает sticky hover на iOS.
2. **`:active` состояния для touch** — `scale(0.97)` на карточках, столах, кнопках. Тактильный отклик при тапе.
3. **Touch-targets ≥ 44px** — бургер-меню (40→44), кнопка звонка (40→44), табы залов (min-height: 44px).
4. **`env(safe-area-inset-bottom)`** на `.mobile-cta-bar` — не перекрывает home indicator на iPhone.
5. **`data-perf='low'` override** для `.mobile-cta-bar` backdrop-filter.
6. **Bar-card hover** обёрнут в `@media (hover: hover)` + `:active` для touch.
7. **SVG-столы** получили `:active` fill (визуальный отклик при тапе).
8. **Упрощённые `box-shadow`** на bar-card для `data-perf='mid'` и `data-perf='low'`.
9. **Дополнительные `backdrop-filter` override** для low-tier (site-header, mobile-cta-bar).
10. **`-webkit-tap-highlight-color: transparent`** глобально + кастомные `:active`.
11. **Tilt заменён на `scale(0.97)` при `:active`** на мобильном (tilt уже отключён в JS).
12. **`scroll-snap-type: x mandatory`** на табах категорий меню (мобильный).
13. **Цены** уже 20px в bar-menu (достаточно), 12px в iframe-меню (компактно для контекста).
14. **`overscroll-behavior: contain`** на модалках/drawer — фон не скроллится за ними.

#### Что НЕ подключено (план)

- YooKassa (оплата) — env пустые, интеграция тихо выключена.
- SMS.ru — env пустые.
- Telegram/VK уведомления — env пустые.
- Sentry/GlitchTip — не установлен.
- CDN/HTTP3 — нет VPS-деплоя.

#### Перенос Меню и Бара на отдельные роуты (2026-05-11)

Меню (`/menu`) и Бар-меню (`/bar`) перенесены с главной страницы на отдельные роуты:

- **Роуты:** `/menu` (MenuPage) и `/bar` (BarPage) — lazy-loaded через `React.lazy` + `Suspense`.
- **Общая корзина:** `CartContext` (`frontend/src/lib/CartContext.tsx`) обёртывает все Routes в App.tsx. Корзина сохраняется при навигации между `/`, `/menu`, `/bar`.
- **Шапка:** `SharedHeader` (`frontend/src/components/SharedHeader.tsx`) с `<Link>` из react-router для /menu и /bar. HomePage использует свой Header (с бургером для SideNav).
- **Навигация:** на мобильном (≤880px) шапка видна всегда с horizontal scroll (`overflow-x: auto`, scrollbar скрыт).
- **CartDrawer:** при пустой корзине показывает ссылку «Перейти в меню → `/menu`» (через `secondary-link` class).
- **SEO:** `/menu` и `/bar` добавлены в sitemap (build + backend runtime).
- **Manifest:** shortcut «Меню» → `/menu` (было `/#menu`).
- **SideNav:** `#menu` → `/menu`, `#bar` → `/bar`.
- **Главная:** осталась Hero + CloudHero + Journey + Cultures + Order-section (featured dishes) + Booking + Contacts + Jobs + Gallery.

#### Ключевые файлы после переноса

| Файл | Описание |
|---|---|
| `frontend/src/App.tsx` | Роуты + CartProvider + lazy MenuPage/BarPage |
| `frontend/src/lib/CartContext.tsx` | Общая корзина через React Context |
| `frontend/src/components/SharedHeader.tsx` | Шапка для /menu и /bar с Link-навигацией |
| `frontend/src/pages/MenuPage.tsx` | Страница полного меню блюд |
| `frontend/src/pages/BarPage.tsx` | Страница бар-меню |
| `frontend/src/pages/HomePage.tsx` | Главная (без секций меню и бара) |
| `frontend/src/components/CartDrawer.tsx` | Корзина с «Перейти в меню» при пустом состоянии |

---

## 2. Процесс работы над задачей

### Перед правкой

- Понять запрос одной строкой. Если неоднозначно — переспросить.
- Прочитать затрагиваемые файлы полностью, без догадок.
- Зафиксировать: цель, список файлов к правке, список файлов, которые не трогаю.
- Если задача большая, разбить на шаги и согласовать.

### Во время правки

- Минимальный патч, точечные замены через `str_replace`.
- Не рефакторить «заодно» ничего, что не относится к задаче.
- Не откатывать чужие незапрошенные изменения, если они есть.
- Сохранять существующий стиль кода и CSS.
- Комментарии — только там, где реально помогают.

### После правки — обязательный порядок проверок

1. `npm --prefix frontend run guard:mojibake`
2. `npm --prefix frontend run lint`
3. `npm --prefix frontend run build`
4. `npm --prefix frontend run perf:budgets`
5. `node --check backend/src/index.js`

Если шаг падает — чинить и прогонять снова. Если проверка недоступна (нет сети, нет зависимостей) — указать это в отчёте.

### Отчёт владельцу

Короткий, структурированный:

- Что изменено (файлы, модули).
- Метрики до → после (`index.js.gz`, `index.css.gz`, LCP / INP / CLS — если мерил).
- Результат проверок.
- Риски, которые заметил за рамками задачи.
- Что не сделал и почему (если осталось).

### Сомнение → остановиться

Если не уверен в архитектурном решении, в том, что правило нарушается, или в том, что задача дошла до конца — спросить владельца до действия, а не после.

---

## 3. Бюджеты производительности

Все цифры проверяются автоматически через `frontend/scripts/check-budgets.mjs` (команда `npm --prefix frontend run perf:budgets`). При регрессии сборка падает в CI.

### Бандл (gzip)

| Артефакт         | Лимит    | Текущее (2026-05-12) |
| ---------------- | -------- | -------------------- |
| `index-*.js.gz`  | ≤ 103 KB | 100.77 KB            |
| `index-*.css.gz` | ≤ 14 KB  | 13.22 KB             |

Vendor-чанки (react, router, icons) отдельно — изменения в приложении не инвалидируют их кэш.

### Web Vitals (цели на проде, p75)

| Метрика | Цель     |
| ------- | -------- |
| LCP     | < 1.8 s  |
| INP     | < 200 ms |
| CLS     | < 0.05   |
| TTFB    | < 800 ms |

Собираются через `web-vitals` v4 + `PerformanceObserver('longtask')`, отправляются на `/api/rum` (таблица `rum_events` в SQLite).

### Runtime-бюджеты

- Любой frame движения анимации ≤ 4 ms на iPhone 11 класса.
- Paint-события при скролле ≤ 6 ms.
- Композитные слои одновременно ≤ 12.
- `box-shadow` с большим blur на скролле — избегать, особенно на `data-perf='low'`.

### data-perf тиеры

Атрибут ставится на `<html>` через `frontend/src/lib/perfTier.ts`:

- `low` — `prefers-reduced-motion`, `save-data`, iOS ≤ 15, `hardwareConcurrency ≤ 4` на мобильном.
- `mid` — обычный мобильный.
- `high` — десктоп.

Правила CSS должны учитывать тиер:

- `data-perf='low'` → без `backdrop-filter`, без тяжёлых `box-shadow`, без `filter: blur` на скролле.
- `data-perf='low'` → canvas-эффекты становятся still-frame.
- На `prefers-reduced-motion: reduce` — анимация отключается полностью.

### Правила перед добавлением любой новой визуальной фичи

1. Двигается через `transform`/`opacity`/`filter`, не через `top/left`.
2. Есть ветка для `prefers-reduced-motion`.
3. Используется `IntersectionObserver` для паузы вне viewport.
4. Не добавляет больше +1 KB gzip JS.
5. Не создаёт новых `box-shadow` render-стеков на скролле.
6. Проходит `perf:budgets` без регрессии.

### Частая причина регрессии

- Новая иконка из `lucide-react` без deep-import → барел, +N KB.
- Новое фото без `-sm` варианта → мобильный качает десктопное.
- Новый `box-shadow` с `blur > 40px` → paint-пик на скролле.
- Забыли `loading="lazy"` на ниже-фолд картинке.
- Добавили зависимость — ломает manualChunks.

---

## 4. Визуальный язык

### Принцип

Тёплый ресторанный премиум уровня Smith & Wollensky / Carbone / COMA Berlin / Ad Astra Helsinki / A.O.C. London. Смысл «выглядит дорого» — это типографика, свет, тени, паузы, а не анимация и яркость.

### Палитра (CSS-переменные)

```
--ember #d81420       — огонь, CTA, акценты
--ember-soft #a30f17  — ember hover
--ember-dark #7f1014
--coal #120d0a        — основной фон
--coal-soft #1d1510
--ash #3a332d
--cream #f6eee1       — основной текст на тёмном
--muted #cbb9a6
--gold #e0a64b        — акценты заголовков
--brass #c69a3e       — линии, канты, медальки
--brass-soft #a8842a
--smoke #1f1612       — глубокий фон карточек
--velvet #2c4a3c      — Hall 2 банкетки
--leather #7a3f24     — Hall 1 стулья
--bone #efe7d7        — бумажный тон меню
--green #5ddd8a       — статус «свободно»
```

Три акцентных цвета одновременно — максимум. Hover — не смена hue, а +5–10% яркости через `filter: brightness(1.06)`.

### Запрещённые цвета

- Синий, cyan, neon-green, пастель, холодные акценты.
- Белые фон-блоки больше 50% экрана.
- Чистый чёрный `#000` (использовать `--coal`).

### Типографика

- Заголовки: серифный display (в проекте — `FireText` на serif-шрифте).
- Тело: гуманистический sans (Inter / system-ui fallback).
- H1 `clamp(2.4rem, 6vw, 5.6rem)`, H2 `fluid-5xl`, H3 `fluid-3xl`.
- `letter-spacing` для caps: +0.06em для sans, -0.01em для serif.
- `line-height` — 1.55 для текста, 1.05 для заголовков.
- Русская типографика: `word-break: keep-all; hyphens: none`.
- `font-feature-settings: "kern", "liga", "calt", "locl"` — только в hero/заголовках.
- `text-rendering: optimizeLegibility` — только на hero/H1/H2, не глобально.

### Сетка и воздух

- Секция padding: `clamp(64px, 9vw, 144px)` сверху/снизу.
- Между блоками: `clamp(24px, 4vw, 56px)`.
- Максимальная ширина контейнера: `1280px`.
- 12-колонная CSS Grid. Асимметрия приветствуется.

### Материалы (CSS-only)

- **Бронза/латунь**: 5-стоп линейный градиент + `mix-blend-mode: screen`. Тонкие линии 1–2 px.
- **Кожа**: тёмный фон + `radial-gradient` + очень тонкий SVG-шум.
- **Дерево**: `chevronWall`, `parquet` паттерны уже в проекте.
- **Стекло**: `backdrop-filter: blur(10px) saturate(120%)` — только шапка и модалки. На `data-perf='low'` отключаем.
- **Бумага (меню)**: `--bone` фон + двойной `border` 1px/0.5px.

### Заморозки Phase 13 (не возвращать)

- Огоньки над столами.
- Spotlight-подсветка выбранного.
- Pulse-анимация статуса.
- Heatmap популярности.
- Dim соседей.
- Зум карты залов.

### Движение и анимация

- Длительность 180–360 ms. Дольше — только hero-вход.
- Easing `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint).
- Hover CTA: `scale(0.97)` 90 ms → `scale(1.02)` 180 ms → 1.
- Scroll-in: `IntersectionObserver` + класс `.is-in-view`, `opacity 0→1 + translateY 24→0` за 320 ms.
- Все анимации имеют ветку `@media (prefers-reduced-motion: reduce)`.

### Иконки

- Только SVG, тонкая линия 1.5 px, скруглённые концы, `currentColor`.
- 24 px стандарт.
- Импорт через deep-path: `lucide-react/dist/esm/icons/phone` — иначе барел.
- Никаких emoji. Никаких icon-font-библиотек.

### Изображения

- Везде WebP, для hero/gallery/dish — AVIF как first source, WebP как fallback, PNG только для cloud-hero legacy.
- `<picture>` с `media`-гейтами: `(max-width: 768px)` → `-sm` вариант.
- Жёсткие `width`/`height` атрибуты → CLS = 0.
- `loading="lazy" decoding="async"` везде ниже фолда.
- `fetchpriority="high"` — только LCP-картинка (логотип + hero-poster).
- Не коммитить JPG/PNG (кроме `cloud-hero.png` legacy fallback).

### Фокус и a11y

- Кастомный focus: `outline: 2px solid var(--brass)`, `outline-offset: 3px`.
- Контраст текста ≥ 4.5:1 (WCAG AA).
- Интерактивы ≥ 44×44 px на мобильном.
- Ошибки форм — серьёзным шрифтом ember, без восклицательных знаков/emoji.

### Когда просят «сделать красиво»

Сначала — типографика и воздух. Потом — свет и тени. Только потом — микроанимация. Это порядок.

---

## 5. React 19 + TypeScript паттерны

### TypeScript

- Strict mode **включён** в `tsconfig.app.json` — не ослаблять.
- Никогда не `any`. Если не знаешь тип — `unknown` + narrowing.
- Shared types — только в `src/lib/types.ts`. Не дублировать.
- Типы API-ответов обязательно узкие: `MenuCategory`, `RestaurantTable`, не `Record<string, unknown>`.
- `as const` для литеральных объектов-констант.
- Discriminated unions вместо `boolean`-флагов для состояний.
- `satisfies` для объектов, где важна и проверка соответствия, и сохранение литерального типа.

### React 19 фичи

- `React.lazy()` + `<Suspense>` для всего ниже фолда (CartDrawer, TableMap, BarMenuSection, BookingDialog, AdminApp).
- `use()` — для условного чтения промисов/контекстов.
- Server Components — **не применимы**, Vite SPA.

### Хуки

- `useEffect` — только для синхронизации с внешним миром.
- `useMemo` — только после измерения.
- `useCallback` — только если функция передаётся в `React.memo` или `useEffect`-зависимости.
- `useTransition` — для не-срочных обновлений (фильтрация меню, переключение разделов).
- `useDeferredValue` — для поля поиска при большом списке.
- `useId` — для связывания label/input.

### React.memo

- Применять только после профилирования в React DevTools.
- Не мемоизировать компоненты, которые всё равно ре-рендерятся из-за context.
- Если мемоизируешь — стабилизируй пропсы через `useCallback` / `useMemo`.

### Производительность

- Lazy-чанки уже настроены в `vite.config.ts` (`react-vendor`, `router-vendor`, `icons-vendor`). Не ломать.
- Не импортировать `lucide-react` через барел: `import Phone from 'lucide-react/dist/esm/icons/phone'`.
- Не создавать объектов в JSX (`<X style={{...}}>`).
- `IntersectionObserver` для пауз тяжёлых сабтри вне viewport.
- `requestIdleCallback` (с `setTimeout` fallback) для некритичной инициализации.

### Структура компонентов

- Один компонент — один файл.
- CSS рядом: `Foo.tsx` + `foo.css`.
- Именованные экспорты предпочтительны: `export function Foo()`. Default-export — только для lazy-entry.
- Props типизируются inline для локальных, отдельным `type` — для публичных.

### Fallback-first данные (железное правило)

```tsx
const [menu, setMenu] = useState<MenuCategory[]>(fallbackMenu)

useEffect(() => {
  api.getMenu()
    .then((data) => Array.isArray(data) && setMenu(data))
    .catch(() => {
      /* остаёмся на fallback */
    })
}, [])
```

Если `/api/*` упал — сайт работает. `api.ts` в `src/lib/api.ts` уже кидает ошибку на non-JSON ответы.

### Socket.IO

- Подписка через `useRealtimeTables` хук.
- Unsubscribe в cleanup функции `useEffect`.
- Не дублировать соединения — всё через один singleton в хуке.

### Формы

- Submit блокируется на время запроса: `disabled={loading}`.
- После успеха — тост.
- После ошибки — внятное сообщение (не «Ошибка 500»).
- Оффлайн — через `api.createBooking`, localStorage queue уже есть.

### StrictMode

- Включён в `main.tsx`. Все хуки должны переживать двойной mount в dev.
- В cleanup обязательно отписываемся от observers, таймеров, abort-controllers.

### Анти-паттерны

- Context для часто меняющегося состояния.
- `dangerouslySetInnerHTML` с пользовательским контентом без `DOMPurify`.
- `useEffect` без массива зависимостей.
- Side effects в рендере.
- Прямое чтение `window`/`document` в рендере без проверки `typeof window`.

---

## 6. CSS-паттерны

### Правила, которые не нарушаются

- `word-break: keep-all; hyphens: none` — на всех `h1-h6, p, li, dd, span`.
- Движение — через `transform`/`opacity`/`filter`. Никогда через `top`/`left` на скролле.
- Все анимации имеют `@media (prefers-reduced-motion: reduce)` ветку.
- `data-perf='low'` отключает `backdrop-filter`, тяжёлые `box-shadow`, `filter: blur` на скролле.
- `content-visibility: auto` на офскрин-секциях — уже глобально в `index.css`.
- CloudHero и hero-секции исключены (`content-visibility: visible`).

### Цветовые переменные

Читать из `:root` в `index.css`. Не хардкодить hex в компонентных CSS:

```css
/* правильно */
color: var(--cream);
background: rgba(10, 7, 5, 0.68);

/* нет */
color: #f6eee1;
```

### Тени (box-shadow)

- Большие `box-shadow` с `blur > 40px` — только на fixed-элементах, не на списках на скролле.
- На `data-perf='low'` упрощаем через override.

### Backdrop-filter

- Дорогой фильтр, только в шапке/модалках.
- На iOS ≤ 15 — часто глючит. `data-perf='low'` отключает.
- `-webkit-backdrop-filter` обязательно для старого Safari.

### Layout

- CSS Grid для секций: 12 колонок, gap через `clamp()`.
- Flex для локальных рядов.
- `aspect-ratio` вместо padding-hack.
- Max-width контейнера `1280px`.
- Секция: `padding-block: clamp(64px, 9vw, 144px)`.

### Перформанс-хинты

- `will-change: transform, opacity` — точечно, только на реально анимируемый элемент.
- `contain: layout paint style` — на независимых карточках, списках, tooltip-ах.
- `translateZ(0)` — только если измерил выигрыш.

### Responsive

- Mobile-first.
- Breakpoints: `480px`, `768px`, `1024px`, `1280px`.
- Fluid typography через `clamp()`.

### Антипаттерны

- `position: fixed` с `backdrop-filter` на overlay — дорого.
- `@keyframes` с анимацией `width/height` — layout thrash.
- `background-attachment: fixed` на мобильном — отключено глобально.
- `outline: none` без замены `:focus-visible`.
- Глобальное `* { transition: ... }` — никогда.

### Формат файлов

- Один компонент — один CSS-файл.
- BEM-подобные имена: `.booking-dialog__close`, `.table-point--selected`.
- Не использовать `!important`, кроме override `data-perf='low'`.

---

## 7. Backend-паттерны

### Архитектура

- `backend/src/index.js` — входная точка, middleware, роуты, Socket.IO.
- `backend/src/config.js` — `dotenv` + все env-переменные.
- `backend/src/db.js` — схема, bootstrap admin, seed.
- `backend/src/auth.js` — JWT, bcrypt.
- `backend/src/security.js` — origins whitelist, rate-limiters.
- `backend/src/seo.js` — robots/sitemap.
- `backend/src/routes/` — `public.js`, `admin.js`, `auth.js`.
- `backend/src/integrations/` — YooKassa, SMS, Telegram, VK, notifier.

### Безопасность

- `helmet()` обязателен, не отключать `referrerPolicy`, `crossOriginResourcePolicy`.
- `HSTS` — только при `secure` или `x-forwarded-proto === 'https'`.
- `app.disable('x-powered-by')`.
- `app.set('trust proxy', 1)`.
- CORS — **whitelist**, никогда `*`.
- Rate-limiters: `loginLimiter` 5/10m, `bookingLimiter` 10/10m, `orderLimiter` 20/10m, `smsLimiter` 20/10m.
- Admin routes под `authMiddleware` всегда.
- `/admin/*` отдаётся с `X-Robots-Tag: noindex, nofollow, noarchive`.

### База (SQLite + better-sqlite3)

- Только подготовленные запросы (`db.prepare(...).run(params)`).
- Никаких строковых конкатенаций SQL.
- Транзакции через `db.transaction(fn)`.
- Миграции — в `bootstrap()` в `db.js`, идемпотентные.
- Не дропать таблицы, не чистить данные без согласия.
- Бэкап `backend/data/meatbar.sqlite` перед миграцией.

### API-дизайн

- Все endpoints возвращают JSON.
- Коды: 200 / 201 / 204 / 400 / 401 / 403 / 404 / 409 / 429 / 500.
- Ошибки — `{ error: 'user-safe message' }`.
- Валидация тела: минимум — required-поля. План — `zod`.

### Кэш

- In-memory micro-cache 60s для `/api/menu`, `/api/tables`, `/api/content`.
- `Cache-Control: public, max-age=60, stale-while-revalidate=600`.
- `Server-Timing: app;dur=X, cache;desc="hit|miss"`.
- ETag — planopt E24.
- Brotli для JSON — planopt E23.

### Инвалидация кэша

- После мутации меню / столов / контента → `clearPublicApiCache('menu' | 'tables' | 'content')`.
- После бронирования → `clearPublicApiCache('tables')` + `io.emit('tables:updated', ...)`.

### Socket.IO

- CORS whitelist тот же.
- Emit: `tables:updated`, `tables:created`, `tables:deleted`, `bookings:new`, `orders:new`, `orders:paid`.
- Не слать секретных данных в payload.

### Интеграции (off by default)

- YooKassa, SMS.ru, Telegram, VK — включаются через env.
- Пустые env — тихо выключены.
- Никогда не коммитить реальные токены.

### Логи

- Префиксы `[server]`, `[rum]`.
- Не логировать тело `/api/rum` массово.
- Не логировать пароли, токены, SMS-коды.

### Health

- `/api/health` — всегда 200, возвращает `{ ok, integrations }`.
- Расширение запланировано (planopt E27).

### Graceful shutdown

- `process.on('SIGTERM')` — закрыть server, `db.close()`, `process.exit(0)`.
- Таймаут на активные соединения 10s.

---

## 8. Service Worker и PWA

### Жёсткие правила

- Никогда не кэшировать `/api/*` POST.
- Никогда не кэшировать `/socket.io/*`.
- Не перехватывать видео и range-запросы.
- Перед релизом бампать `VERSION` (сейчас `v20`).
- После бампа проверять install / activate / fetch flow в DevTools.

### Стратегии

- **HTML / navigate** → network-first, fallback `/index.html`.
- **Hashed JS/CSS** → cache-first, immutable.
- **Images** → stale-while-revalidate, LRU 60.
- **Videos** → не перехватываем.
- **`/api/menu`** → SWR, LRU 8.
- **`/api/tables`** → SWR с TTL 60s через `sw-cached-at` header.
- **Прочие `/api/*` GET** → network-only.
- **Остальные GET** → cache-first fallback, LRU 80.

### App-shell precache

Статический список в `APP_SHELL`. Планируется динамика из `precache-manifest.json` (planopt D18).

Не добавлять в precache: большие видео, тяжёлые галерейные фото, `/api/*`.

### Auto-update flow

В `main.tsx`:

- При `load` → `register('/sw.js')`.
- `reg.update()` сразу + каждые 60 минут.
- `controllerchange` → пока `window.location.reload()`. Планируется тост (planopt H42).

### Dev-режим

В dev SW автоматически **unregister**, чтобы закэшированное не маскировало правки.

### Offline-queue

- Бронирования работают через localStorage + `online` event в `frontend/src/lib/api.ts`.
- BackgroundSync для `/api/orders` — planopt D19.

### Manifest

- `display: "standalone"`, `start_url: "/"`, `scope: "/"`.
- Иконки: `/assets/meatbar-logo-mark-square-large*.{webp,avif}` + `apple-touch-icon-180.png`.
- Shortcuts — `booking`, `menu`, `order`, `contacts`.
- Не менять `name`, `short_name`, `theme_color` без согласия.

### Антипаттерны

- Кэширование `Response` без `response.ok`.
- `cache.add(url)` без try/catch.
- Не-версионированный `CACHE_NAME`.
- Кэширование `text/html` SPA-fallback для `/api/*` 404.

---

## 9. SEO для Нижневартовска

### Домен и canonical

- Основной: `https://мясо-бар.рф` (IDN).
- Punycode: `https://xn----8sbc6bkpc5i.xn--p1ai`.
- Runtime canonical строится из реального `window.location.origin` в `frontend/src/lib/seo.ts`.
- Backend тоже нормализует canonical через `seoPayload(req, config)` с учётом `x-forwarded-proto`/`x-forwarded-host`.

### Env для прода

Frontend build: `SITE_URL`, `CLEAN_PARAMS`, `YANDEX_VERIFICATION_CODE`, `GOOGLE_SITE_VERIFICATION`, `VITE_YANDEX_VERIFICATION`, `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_YM_COUNTER_ID`, `VITE_GA_MEASUREMENT_ID`.

Backend: `SITE_URL`, `CLIENT_ORIGIN`.

### Что уже настроено

- `<title>`, meta description, OG, Twitter Card в `frontend/index.html`.
- JSON-LD Restaurant + dynamic `@graph` (Restaurant + WebSite + BreadcrumbList) в `seo.ts`.
- Section-based updates title/description на hash-change.
- Admin `/admin/*` → noindex на frontend и `X-Robots-Tag` на backend.
- `robots.txt` и `sitemap.xml` в двух местах: build + runtime backend.
- `User-agent: Yandex` + `Clean-param` для UTM.
- Верификация поисковиков через env.

### Yandex

- `Host:` директива в robots обязательна.
- `Clean-param` важнее, чем у Google.
- Регион «Нижневартовск» в Яндекс Вебмастере.
- `geo.region = RU-KHM`.

### Google

- `hreflang` ru-RU + x-default.
- JSON-LD Restaurant + LocalBusiness.
- `BreadcrumbList` для rich snippets.
- Search Console — DNS TXT или `google<code>.html`.

### Не ломать

- `lang="ru"` на `<html>`.
- `charset="UTF-8"`.
- Порядок meta-тегов.
- JSON-LD формат (валидировать на `validator.schema.org`).
- `canonical` и `og:url` всегда абсолютные.
- `robots` meta — `index,follow,max-image-preview:large` для публичных, `noindex` для `/admin/*`.

### Контент

- H1 главной: «Мясо Бар — мясной ресторан в Нижневартовске».
- H2/H3 с длинными ключевыми фразами.
- Alt с упоминанием бренда и города.
- Детальный чеклист — `docs/SEO-LAUNCH-CHECKLIST.md`.

---

## 10. Доступность (WCAG 2.2 AA)

### Контраст

- Обычный текст ≥ 4.5:1.
- Крупный текст (≥ 18 pt или 14 pt bold) ≥ 3:1.
- UI-элементы ≥ 3:1.
- Серый `--muted` на бежевом `--bone` — проверять отдельно.

### Клавиатура

- Каждый интерактив достижим через Tab.
- Порядок логический.
- `:focus-visible` обязателен: `outline: 2px solid var(--brass); outline-offset: 3px;`.
- `Esc` закрывает модалки.
- `Enter` / `Space` активируют кнопки.
- Focus trap внутри модалок.

### ARIA и семантика

- Нативные теги предпочтительны: `<button>`, `<a>`, `<dialog>`, `<form>`, `<label>`.
- Не-нативная кнопка: `role="button"` + `tabindex="0"` + обработчики клавиш.
- Модалки: `<dialog>` с `aria-labelledby` / `aria-describedby`.
- Живые регионы: `aria-live="polite"` для тостов, `aria-live="assertive"` для ошибок.
- Иконки без текста: `aria-label` на родителе.
- Декоративные SVG: `aria-hidden="true"`.

### Размер тач-целей

- Мобильные кнопки ≥ 44×44 px.
- Между соседними тач-целями ≥ 8 px.

### Motion-guards

- `@media (prefers-reduced-motion: reduce)` отключает декоративное движение.
- Canvas-компоненты проверяют media query в JS и не запускают rAF.

### Формы

- Каждый `<input>` имеет `<label>`.
- Ошибка: `aria-invalid="true"` + `aria-describedby`.
- Не использовать только цвет для ошибки (иконка + текст).
- Маска телефона не мешает paste.

### Текст

- `<html lang="ru">`. Английские вкрапления — `lang="en"`.
- Абзацы ≤ 80 символов.
- Русский текст: `word-break: keep-all; hyphens: none`.
- `text-transform: uppercase` на длинных русских строках — нет.

### Изображения и медиа

- `alt` описательный: `alt="Стейк рибай в Мясо Баре, Нижневартовск"`.
- Декоративные: `alt=""`.
- Видео без звука, не автоплей со звуком. Постер обязательный.
- `AmbientAudio` — кнопка вкл/выкл, localStorage флаг, по умолчанию off.

### Типичные ошибки

- `<div onClick>` вместо `<button>`.
- Пустой `alt` на значимой картинке.
- `outline: none` без замены `:focus-visible`.
- Серый `--muted` на тёмном `--coal` — может упасть ниже 4.5:1.

### Инструменты

- DevTools → Lighthouse → Accessibility.
- `axe-core` расширение.
- Клавиатурный тест: отключить мышь, пройти бронирование с Tab/Enter.

---

## 11. Защита русского текста (mojibake)

### Что такое mojibake

Порча кириллицы из-за неправильной кодировки: `РњСЏСЃРѕ` вместо `Мясо`, `РџСЂРѕРµРєС‚` вместо `Проект`, `вЂ”`, `в„–`, `Р°`, `С»` — следы перекодировки.

CI падает на `guard:mojibake` — это блокирующий баг.

### Жёсткие правила

- Все текстовые файлы с русским — **только UTF-8 без BOM**.
- В PowerShell читать через `Get-Content -Encoding UTF8`.
- Не копировать русский текст из источников с mojibake.
- Не менять `charset`, `lang="ru"`, meta-теги без проверки результата.
- Не трогать `word-break: keep-all; hyphens: none`.
- Не добавлять `hyphens: auto` на русские блоки.

### Проверка до build

```
npm --prefix frontend run guard:mojibake
```

Проверяет `frontend/src`, `index.html`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`.

### Проверка после правки

- Открыть изменённый файл с явным UTF-8 и убедиться, что кириллица читается.
- В PowerShell использовать `Out-File -Encoding utf8NoBOM`.

### Запреты

- Массовая перекодировка без задачи.
- «Починить mojibake по всему проекту» — только по явной просьбе.
- Вставка русских строк из внешних источников без визуальной проверки.

### Если подозрение

1. Прочитать файл целиком, визуально.
2. Сравнить байты через `Format-Hex` (PowerShell).
3. Сначала выяснить источник, потом чинить.

---

## 12. Git и секреты

### Никогда

- Не пушить в `main` / `master` напрямую.
- Не делать force-push без согласия.
- Не `git reset --hard`, `git clean -f`, `git branch -D` без согласия.
- Не менять `git config` без запроса.
- Не `--amend` чужие коммиты.
- Не коммитить `.env`, `node_modules/`, `dist/`, `*.sqlite*`, `.DS_Store`.
- Не коммитить реальные токены. Только `.env.example` с пустыми значениями.
- Не использовать интерактивные флаги (`-i`).
- Не пропускать pre-commit hooks (`--no-verify`) без согласия.

### Коммиты

- Один коммит — одна логическая задача.
- Сообщение: что и зачем, глагол в настоящем времени, 50–72 символа.
- Перед коммитом: `git status` предсказуемый.

### Ветки и PR

- `feat/<описание>` для фич, `fix/<описание>` для багфиксов.
- `git push -u origin <branch>` при первом пуше.
- PR через `gh pr create`, заголовок ≤ 70 символов.
- Описание PR: что, зачем, что тестировал, какие риски.

### Секреты

- Все секреты через `.env` + менеджер на VPS.
- Templates — `backend/.env.example` и `frontend/.env.example`.
- JWT_SECRET менять при утечке.
- ADMIN_BOOTSTRAP_PASSWORD менять после первого логина.
- YooKassa / SMS / Telegram / VK токены — не логировать, не показывать в UI.

### Чувствительные паттерны перед `git add`

- Пароли.
- `-----BEGIN ... PRIVATE KEY-----`.
- AWS/YC ключи (`AKIA...`, `yca...`).
- Telegram bot tokens (`\d+:[A-Za-z0-9_-]{35}`).
- VK access tokens.

Если нашёл — не коммитить, предупредить владельца.

### SSH и VPS

- Только по ключу, не по паролю.
- Перед `scp`/`rsync` — `--dry-run`.
- `rm -rf` — только по явной просьбе, с пояснением что удаляется.
- Бэкап SQLite перед миграцией.

---

## 13. Deploy runbook

Подключать когда готовимся к выкату на VPS. Детальная версия — `docs/PRODUCTION-RUNBOOK.md`.

### Pre-flight

1. Ветка актуальна с main.
2. `guard:mojibake` — OK.
3. `lint` — OK (3 известных admin warning допустимы).
4. `build` — OK.
5. `perf:budgets` — OK.
6. `node --check backend/src/index.js` — OK.
7. Бэкап `backend/data/meatbar.sqlite`.
8. `.env` на VPS проверен.

### Frontend build → backend/public

1. `npm --prefix frontend run build`.
2. Проверить `dist/`: `index.html`, `manifest.webmanifest`, `sw.js`, `robots.txt`, `sitemap.xml`, `precache-manifest.json`, `.gz` и `.br` рядом.
3. `rsync` → `backend/public/`.

### Deploy

1. `ssh user@host`.
2. `git pull origin main`.
3. `npm --prefix backend ci` при изменении lock.
4. `rsync frontend/dist/ user@host:/path/backend/public/`.
5. Проверить `.env`.
6. `systemctl restart meatbar` (или PM2).
7. `journalctl -u meatbar -n 100`.

### Smoke-check (5 минут)

1. `https://мясо-бар.рф` — 200, hero видно.
2. «Бронь» → уводит к `#booking`, карта залов открылась.
3. Hover на стол → tooltip.
4. `/api/health` → `{ ok: true }`.
5. `/robots.txt` → `Host` и `Sitemap`.
6. `/sitemap.xml` → валидный XML.
7. `/admin` → `X-Robots-Tag: noindex`.
8. DevTools → Service Worker → activated.
9. Network → offline → reload → сайт работает.
10. Тестовая бронь → `/api/bookings` 200.

### Rollback

1. `git checkout <previous-sha>` или `rsync` из бэкапа.
2. `systemctl restart meatbar`.
3. Smoke-check.
4. Инцидент в `docs/PRODUCTION-RUNBOOK.md`.

### Восстановление SQLite

1. `systemctl stop meatbar`.
2. `cp meatbar.sqlite meatbar.sqlite.broken`.
3. `cp /backup/meatbar.sqlite meatbar.sqlite`.
4. `systemctl start meatbar`.
5. `/api/health` + проверка броней/заказов/админки.

### Мониторинг

- HTTP доступность главной.
- `/api/health` 200.
- Логи backend.
- RUM web-vitals (planopt J47).

### SEO после первого выката

- Яндекс Вебмастер: добавить сайт → подтвердить → регион → sitemap.
- Google Search Console: property → подтвердить → sitemap.
- Проверить `yandex_<code>.html` и `google<code>.html`.
- Валидация JSON-LD на `validator.schema.org`.
- Яндекс.Бизнес / 2ГИС / Google Business Profile — карточка.


---

## 14. Error handling

Полная версия: `.kiro/steering/error-handling.md`.

### Принципы

1. Ошибки — данные, а не исключения. Возвращать, а не бросать.
2. Не ловить и не глотать молча. Минимум `console.warn` с контекстом.
3. Пользователь видит человеческий текст, не stack.
4. Fallback-first: UI остаётся рабочим на локальных данных.

### Frontend

- Discriminated union для async-состояний: `{ status: 'idle' | 'loading' | 'ok' | 'error', ... }`.
- `fetch` всегда в try/catch, проверять `response.ok` до `.json()`.
- `api.ts` уже кидает на non-JSON ответы. Не ломать.
- Error Boundary на lazy-чанках с тёплым fallback UI.
- Формы: валидация при blur + submit, `disabled={loading}`.
- Оффлайн → очередь, авто-флэш на `online`.

### Backend

- Формат ошибки — `{ error: 'Пользовательское сообщение' }`, никогда stack/секреты.
- HTTP-коды: 200/201/204/400/401/403/404/409/429/500.
- SQL через подготовленные запросы.
- Интеграции (Telegram/VK/SMS/YooKassa) — `.catch()` с `console.warn`, не ломают основной flow.

### Логировать

5xx, rate-limit срабатывания, неудачные логины, ошибки миграций, отвалы интеграций.

### Не логировать

Пароли, JWT, API-ключи, SMS-коды, тело `/api/rum`, тело orders целиком.

---

## 15. Conventional Commits

Полная версия: `.kiro/steering/conventional-commits.md`.

Подключать через `#commits` когда готовим коммит.

### Структура

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Типы

- `feat` — новая функциональность
- `fix` — исправление бага
- `perf` — оптимизация
- `refactor` — без изменения поведения
- `style` — форматирование, не CSS визуал
- `docs` — документация
- `test` — тесты
- `build` — сборка, зависимости
- `ci` — GitHub Actions
- `chore` — мелочь
- `revert` — откат

### Пример

```
perf(frontend): lazy-load analytics bootstrap

Moved installSeoEnhancements and analytics-bootstrap to a separate
idle chunk. Initial JS.gz: 103.7 KB -> 100.2 KB.

See planopt.md B8.
```

### Правила

- Subject 50–72 символа, глагол в настоящем времени, без точки.
- Коммиты на английском.
- Один коммит = одна задача.
- Перед коммитом: `guard:mojibake → lint → build → perf:budgets`.
- Без `--amend` чужих коммитов.
- Без `--no-verify` без согласия.

### Breaking change

```
feat(api)!: change /api/tables response schema

BREAKING CHANGE: removed `x`, `y`; replaced with `position: {x, y}`.
```

---

## 16. Code review checklist

Полная версия: `.kiro/steering/code-review.md`.

Подключать через `#review` перед PR или самопроверкой.

### Перед отправкой на ревью

- Соблюдены правила `PRAVILA.md`, `WORKFLOW.md`, `PRO.md`.
- Пройдены `guard:mojibake → lint → build → perf:budgets → node --check`.
- Нет закомментированного кода «на всякий случай».
- Нет `console.log` / `debugger`.
- Нет TODO без issue.
- Нет рефакторинга вне задачи.
- Нет секретов в diff.

### Frontend-специфика

- TS strict без `any`.
- Типы API узкие (из `src/lib/types.ts`).
- Новые компоненты lazy, если ниже фолда.
- `lucide-react` через deep-path.
- `useEffect` с корректным dep-array и cleanup.
- Fallback-first сохранён.
- Картинки с `loading="lazy"` и `-sm` вариантом.
- Анимация с `prefers-reduced-motion` гардом.
- CSS-переменные, не хардкод.

### Backend-специфика

- Подготовленные запросы.
- Admin под `authMiddleware`.
- POST с валидацией required.
- Rate-limit на мутационных публичных endpoints.
- Ошибки — `{ error: '...' }` без стека.
- `clearPublicApiCache()` после мутаций.
- Миграции через `CREATE TABLE IF NOT EXISTS`.

### SW / PWA

- Бампнул `VERSION`, если правил `sw.js`.
- `/api/*` POST не кэшируется.
- `/socket.io/*` не перехватывается.
- Видео и range не перехватываются.

### Формат комментариев в ревью

- `[must]` — блокирующее, требует правки.
- `[nit]` — стилистическая мелочь.
- `[?]` — вопрос.
- `[+]` — похвала.

---

## 17. Testing patterns

Полная версия: `.kiro/steering/testing.md`.

Подключать через `#testing` когда решим добавить тесты. Сейчас тестов нет.

### Стек (когда добавим)

- **Vitest** — unit + component (интеграция с Vite из коробки, быстрее Jest).
- **Playwright** — E2E (реальные Chrome/Firefox/Safari, headless).
- **`node:test`** — backend (встроенный, без зависимостей).

**НЕ добавляем зависимости без согласия** — сначала задача от владельца.

### Что тестируем

- `frontend/src/lib/*` — чистые функции.
- Критичные компоненты: `BookingDialog`, `TableMap`, `CartDrawer`.
- Хуки: `useRealtimeTables`, `useParallaxPhotos`.
- Backend-роуты: `/api/bookings`, `/api/orders`, `/api/menu`.
- E2E: бронь, заказ, логин в админке.

### Что не тестируем

Canvas-анимации (визуально), CSS (визуально + Lighthouse), SVG сетка столов.

### Структура

```
frontend/
├─ src/lib/api.test.ts            ← рядом с кодом
├─ src/components/X.test.tsx
├─ e2e/booking.spec.ts
├─ vitest.config.ts
└─ playwright.config.ts
```

### Важно

- Детерминированность: `vi.setSystemTime()` вместо `new Date()`.
- Изоляция: каждый тест — свой render / mock.
- Скорость: unit < 50 ms, E2E < 10 s.
- Realistic E2E через настоящий backend-процесс.

### CI порядок

```
guard:mojibake → lint → test:unit → build → perf:budgets → test:e2e
```

### Coverage

Не цель. Реалистично 70–80% на lib/ + routes/. Не блокировать CI на проценте.

---

## 18. Design tokens

Полная версия: `.kiro/steering/design-tokens.md`.

### Принцип

Токен — семантическая переменная, отражающая намерение:

- Плохо: `color: #d81420` в компоненте.
- Хорошо: `color: var(--ember)` + `--ember: #d81420` в `:root`.

### Три уровня (growth path)

1. **Primitive**: `--ember: #d81420`.
2. **Semantic**: `--color-cta: var(--ember)`.
3. **Component**: `--booking-dialog-bg: var(--color-surface-elevated)`.

Сейчас в основном уровень 1. Уровни 2/3 — точечно, если появится масштабирование.

### Текущие (`frontend/src/index.css`)

Ember/coal/cream/gold/brass/velvet/leather/bone/green + radius-xl/lg + shadow-fire. ~20 токенов, лимит 25.

### Рекомендованные токены (когда нужно)

- **Шрифты**: `--font-display`, `--font-body`, `--text-xs..5xl` через `clamp()`.
- **Spacing**: `--space-0..10` по 8-pt сетке.
- **Motion**: `--ease-out-quint`, `--duration-fast/normal/slow`.
- **Surface overlays**: `--surface-overlay-weak/medium/strong`.

Добавлять только когда даёт видимую экономию повторов.

### Антипаттерны

- Magic-number в имени токена (`--gap-16` → `--space-4`).
- Конкретный цвет в компонентном CSS.
- Дублирование rgba-версий (→ токен прозрачности).
- Смешение тем (один токен — одна роль).

### Совместимость с `data-perf`

```css
:root[data-perf='low'] {
  --shadow-fire: 0 8px 16px rgba(216, 20, 32, 0.18);
}
```

Единая точка для деградации без изменения компонентов.

### Не переходим

- Tailwind — не нужен.
- CSS modules / CSS-in-JS — не нужен.
- Новые зависимости — только по согласию.

---

## 19. Design critique — 5D self-check + anti-AI-slop

Полная версия: `.kiro/steering/design-critique.md`.

Основано на [huashu-design](https://github.com/alchaincyf/huashu-design) и [open-design](https://github.com/nexu-io/open-design). Перед сдачей любой визуальной правки ИИ прогоняет её по 5 осям. Ось < 3/5 — регрессия, правим.

### 5 осей самокритики (1–5)

1. **Philosophy** — характер «Мясо Бара», тёплый ресторанный премиум, не generic-SaaS.
2. **Hierarchy** — один главный фокус, отступы как пауза, H1 действительно H1.
3. **Detail** — пиксель-перфект, согласованность радиусов/теней, микроинтеракции ощутимы.
4. **Function** — добраться до бронь/заказ без когнитивной нагрузки, тач ≥ 44 px, fallback при сбое API.
5. **Restraint** — нет AI-slop, типографика > эффекты, свет > цвет, паузы > движение.

### Anti-AI-slop blacklist

- Фиолетовые градиенты (purple → pink → blue).
- Неоновые зелёные/синие акценты.
- Карточка с левой accent-полоской.
- Generic emoji в UI.
- Inter как display-гарнитура.
- Inter + Poppins + DM Sans «modern SaaS stack».
- Придуманные числа без источника.
- Lorem ipsum в финале.
- Hand-drawn SVG-человечки.
- Пастельные blob-фоны.
- Скруглённый квадрат-логотип с градиентом.
- Чистый `#000` / `#fff` (используем `--coal`, `--cream`).
- Три одинаковых CTA подряд без иерархии.
- «Hover повернулся на 5° и подпрыгнул».

### Honest placeholders

Нет реальной цифры — `—`, «Готовится», «Уточняется», labeled grey block. Не выдумываем.

### Brand-asset protocol (5 шагов)

1. **Locate** — найти исходный файл/скриншот референса.
2. **Extract** — выделить реальные hex (eyedropper, grep по CSS, Canvas getImageData).
3. **Codify** — записать в комментариях `// ember-from-ref: #d81420`.
4. **Vocalise** — проговорить: «беру ember с угольков с фото 3».
5. **Apply** — только после этого код. Никогда не угадывать цвета по памяти.

### Self-report формат

```
Self-critique:
- Philosophy: 4/5 — ресторанная атмосфера передана, но мог сильнее.
- Hierarchy: 5/5 — один фокус.
- Detail: 4/5 — 1 пиксель съехал в hover, починил.
- Function: 5/5 — бронь в 2 клика.
- Restraint: 5/5 — без лишнего.
Итого: 4.6/5 — готово к показу.
```

Ниже 4/5 в среднем — дорабатываю до показа, не сдаю.

---

## 20. Anti-patterns catalog

Полная версия: `.kiro/steering/anti-patterns-catalog.md`.

Консолидированный справочник анти-паттернов. Один файл — все ловушки.

### Frontend / React

- `<div onClick>` вместо `<button>` → клавиатурный сбой.
- `useEffect` без dep-array → бесконечный ренд.
- `{style={{...}}}` в JSX → новая ссылка каждый рендер.
- `React.memo` без стабилизации пропсов → бесполезно.
- Context для часто меняющегося состояния → лавина re-render.
- `dangerouslySetInnerHTML` без DOMPurify.
- `key={index}` в меняющемся списке → поломанное состояние.
- Забытая отписка от IntersectionObserver / Socket.IO в cleanup.
- `useEffect(async () => {...})` напрямую — промис течёт.

### TypeScript

- `any` вместо `unknown` + narrowing.
- Type assertion `as Foo` без runtime проверки.
- Дублирование типов в разных файлах (правильно: `src/lib/types.ts`).
- Boolean-флаги вместо discriminated union.

### CSS

- `position: fixed` + `backdrop-filter` на overlay — тормозит.
- `@keyframes` с `width/height` — layout thrash, использовать `transform: scale()`.
- `background-attachment: fixed` на мобильном — scroll jank.
- `outline: none` без `:focus-visible`.
- Глобальное `* { transition: all .3s }`.
- `z-index: 9999` — хаос, использовать shared scale.
- Magic numbers `padding: 13px 17px`.
- `!important` без причины.
- Hardcode hex вместо `var(--coal)` / `var(--cream)`.
- `box-shadow blur > 40px` на элементе списка на скролле.
- `vh` вместо `svh` на iOS.

### Backend / Express

- `app.use(...)` без `next()` — соединение виснет.
- `res.send()` два раза — runtime error.
- `res.status(500).send(err.stack)` — утечка инфы.
- `app.get('/admin/*', ...)` без `authMiddleware`.
- CORS `origin: '*'`.
- SQL через string concat — injection.
- Uncaught async в route.
- `console.log('login:', req.body)` — пароль в логах.
- `process.env.X` без fallback.

### SQLite

- `db.exec(sql)` с user-input — injection.
- Не-идемпотентная миграция.
- Отсутствие индексов на hot-paths.
- `.sqlite-wal` без checkpoint через релизы.
- Не закрывать DB в SIGTERM.

### Service Worker

- Не бампнутый `VERSION` — юзеры на старом кеше.
- Кэш `/api/*` POST.
- Кэш `/socket.io/*`.
- Перехват range-запросов видео.
- `cache.add(url)` без try/catch — 404 валит install.
- Кеш 404 ответа.

### SEO

- Несколько `<h1>` на странице.
- `canonical` без абсолютного URL.
- JSON-LD с синтаксической ошибкой.
- `robots.txt` без `Host:` для Яндекса.
- Meta-description > 160 символов.
- Одинаковые meta на hash-секциях.

### Accessibility

- `tabindex="-1"` на интерактивах.
- Focus без `:focus-visible`.
- Модалка без focus trap.
- Форма без `<label>`.
- Ошибка только цветом.

### Mojibake

- Вставка текста из источника неизвестной кодировки.
- Двойная перекодировка Win1251 → UTF-8.
- `echo "Текст" > file.md` в cmd — BOM + OEM.

### Performance

- Забытый `loading="lazy"` ниже фолда.
- Отсутствие `width`/`height` → CLS.
- `fetchpriority="high"` на 10 картинках.
- Новая зависимость без проверки бюджета.
- Source-maps в prod.
- `setInterval` без `clearInterval`.
- Fetch в цикле без `Promise.all`.

### Работа с ИИ

- Правка файла без чтения целиком.
- «Заодно» чиню unrelated — нарушение `PRAVILA.md`.
- Угадывание вместо проверки.
- Skip проверок после правки.
- Самовольный коммит.
- Тесты без просьбы.
- Правка `dist/` / `backend/public/` вручную.

### Если увидел анти-паттерн вне задачи

1. Не чинить автоматически.
2. Отметить в отчёте.
3. Предложить добавить в `planopt.md` как P3.
4. Продолжить свою задачу.

«Починить всё заодно» запрещено в `PRAVILA.md` и `WORKFLOW.md`.

---

## 21. Dependency policy

Полная версия: `.kiro/steering/dependency-policy.md`.

Основано на [dependency-auditor](https://github.com/alirezarezvani/claude-skills) + `PRAVILA.md`.

### Железные правила

- Не добавлять новые зависимости без согласия владельца.
- Не обновлять ключевые: React, React-DOM, Vite, TypeScript, Express, better-sqlite3, Socket.IO.
- Patch-апдейты безопасных (`helmet`, `cors`, `dotenv`, `lucide-react`) — можно при audit alertах, с отметкой.

### Когда можно предложить новую

Только если все пять:

1. Задача не решается своим кодом разумно (> 100 строк).
2. Вес ≤ 10 KB gzip на frontend.
3. > 10k stars + коммиты за 6 месяцев.
4. Лицензия MIT/Apache-2.0/BSD/ISC.
5. Нет в блеклисте.

Даже при выполнении — сначала к владельцу с альтернативой.

### Блеклист

- framer-motion, GSAP, three.js, anime.js, lottie-react — запрещены.
- Moment.js — deprecated.
- Lodash целиком, Underscore.
- Styled-components / Emotion — у нас CSS-файлы.
- MUI / Ant Design / Chakra — свой дизайн.
- jQuery.
- Axios — у нас `fetch` + `api.ts`.
- Redux / MobX / Zustand — локальный state достаточно.

### Whitelist (с согласия)

- `zod` — валидация, planned в PLAN-1.
- `date-fns` — если нужны сложные операции.
- `DOMPurify` — при user-generated HTML.
- `pino` — структурированные логи backend.

### Аудит

Раз в месяц: `npm --prefix frontend audit`, `npm --prefix backend audit`. Critical — сразу. High — обсудить, planopt.

### Supply chain

Перед добавлением проверять:

- Typosquatting (lodasj, reactt, axois).
- Активность GitHub 6+ месяцев.
- > 10k downloads/week.
- Нет подозрительных postinstall.
- Автор — известный maintainer.

### Обновления

- Patch: `install` + audit + полный прогон проверок + `chore(deps):` коммит.
- Minor: + changelog + smoke-check + обсуждение если важный.
- Major: обязательно согласовать, фичевая ветка, полный smoke.

### Dev vs prod

- `dependencies` — попадает в бандл.
- `devDependencies` — только для разработки и сборки.
- Types — всегда `devDependencies`.

### Lock-файл

- `package-lock.json` коммитится.
- `npm ci` в CI и на VPS.

---

## 22. Observability & SLO

Полная версия: `.kiro/steering/observability-slo.md`. Подключать через `#observability`.

Основано на [observability-designer](https://github.com/alirezarezvani/claude-skills) + planopt J47–J50.

### SLO для «Мясо Бара»

| Сервис           | Метрика      | SLO p75   | SLO p95 | Window |
| ---------------- | ------------ | --------- | ------- | ------ |
| Главная          | Uptime       | 99.9%     | 99.5%   | 30d    |
| `/api/health`    | Uptime       | 99.9%     | 99.5%   | 30d    |
| `/api/menu`      | Latency      | < 200 ms  | < 500ms | 7d     |
| `/api/tables`    | Latency      | < 200 ms  | < 500ms | 7d     |
| `/api/bookings`  | Latency      | < 500 ms  | < 1.5s  | 7d     |
| LCP (mobile)     | Core Vital   | < 1.8 s   | < 2.5s  | 28d    |
| INP (mobile)     | Core Vital   | < 200 ms  | < 500ms | 28d    |
| CLS              | Core Vital   | < 0.05    | < 0.1   | 28d    |
| JS error rate    | % без ошибок | > 99.5%   | > 98%   | 7d     |
| Бронь success    | % успешных   | > 99%     | > 95%   | 7d     |
| Заказ success    | % успешных   | > 99%     | > 95%   | 7d     |

### Золотые сигналы (Google SRE)

1. Latency — `/api/*` p50/p75/p95/p99.
2. Traffic — RPS.
3. Errors — 5xx rate, 4xx rate.
4. Saturation — CPU, memory, SQLite lock time.

Плюс Web Vitals из RUM, PWA metrics, conversion rate.

### Три слоя данных

1. **Backend logs** — `journalctl -u meatbar`, retention 14 дней.
2. **RUM** — `/api/rum` → SQLite `rum_events`. Cleanup > 90 дней (cron, не реализовано).
3. **Application metrics** — пока нет. Prometheus + Grafana на будущем VPS.

### Дашборд (planopt J47)

- **Vitals** — LCP/INP/CLS/TTFB p75 за 7 дней, разрез по conn/saveData, топ-10 медленных pathname.
- **API** — RPS, latency, error rate, cache hit rate.
- **Business** — брони/заказы за 7d, конверсии, успешность.
- **Health** — uptime, CPU/memory, размер DB/логов.

### Alert-правила

**Критичные (Telegram):**
- `/api/health` не отвечает > 60s.
- Главная 5xx > 60s.
- JS error rate > 2% за 10 минут.
- Бронь success < 90% за 1 час.

**Важные (в рабочие часы):**
- LCP p75 > 3s за 1 час.
- INP p75 > 500ms за 1 час.
- Cache hit rate < 50% на `/api/menu` за 1 час.

**Информационные (daily):**
- Сводка: uptime, vitals, конверсии.
- Новые JS errors.

### Инструменты

- Уровень 1 (сейчас): `journalctl`, `/api/rum` → SQLite, ручной SQL.
- Уровень 2: UptimeRobot/Better Stack, admin-view `/admin/rum`, Sentry free tier.
- Уровень 3 (overkill): Prometheus + Grafana + Loki + AlertManager.

На «один ресторан + один разработчик» уровень 2 — потолок разумного.

### Секреты мониторинга

- Не слать в алерты тело запросов (PII).
- Не логировать JWT, SMS-коды.
- Access к `/admin/rum` только админ.
- Чистить `rum_events` > 90 дней если > 1 GB.

---

## 23. Incident response (SEV-levels + runbook)

Полная версия: `.kiro/steering/incident-response.md`. Подключать через `#incident-response`.

Основано на [incident-commander](https://github.com/alirezarezvani/claude-skills).

### Severity levels

- **SEV-1** — сайт лежит: 5xx на главной, бронь/заказ полностью сломаны, БД повреждена. Response: немедленно, любое время.
- **SEV-2** — деградация: часть функционала, vitals упали в 2× раза, error rate > 5%. Response: час в рабочее, 4 часа вне.
- **SEV-3** — неприятно, но не горит: один endpoint медленный, мелкий визуальный баг, warning без user-impact. Response: в течение дня.
- **SEV-4** — информационный: новая JS-ошибка low-rate, log rotation, обновление зависимости. Response: в течение недели.

### Runbook процесс (любой SEV)

1. **Detect** — alert / владелец / daily digest.
2. **Declare** — сразу обозначить SEV. ИИ пишет в первом ответе.
3. **Triage** (5 минут):
   - Главная 200?
   - `/api/health` 200?
   - `journalctl -u meatbar -n 200`.
   - SQLite in place, не corrupted?
   - Nginx / reverse proxy живы?
   - DNS + SSL в порядке?
4. **Mitigate** — остановить кровь (rollback → restart → restore → disable feature → scale down). Одно действие → проверка → следующее. Не чинить всё сразу.
5. **Communicate** — SEV-1/2 в реальном времени, SEV-3 раз в час, SEV-4 в дейли.
6. **Verify** — smoke-check по `docs/PRODUCTION-RUNBOOK.md`. Если хоть один FAIL — не RESOLVED.
7. **Resolve** — в чат: downtime, root cause, mitigation, когда PIR.
8. **Postmortem (PIR)** — в `docs/INCIDENT-LOG.md`, blameless, 5 whys. Шаблон: summary / timeline / impact / root cause / resolution / prevention / lessons.

### Типовые инциденты

**Backend не стартует:**
```
systemctl status meatbar
journalctl -u meatbar -n 200
# Node 20+? .env есть? SQLite не locked? Порт свободен?
fuser backend/data/meatbar.sqlite  # если locked
```

**SQLite corrupted:**
```
cp backend/data/meatbar.sqlite backend/data/meatbar.sqlite.broken
cp backend/data/backups/meatbar.sqlite.YYYY-MM-DD backend/data/meatbar.sqlite
systemctl restart meatbar
```

**Белый экран фронта:**
- DevTools Console — ошибка?
- `Failed to load module` → SW кеш сломан → unregister + hard reload.
- `TypeError` → rollback `dist/`.

**SW застрял:**
```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
location.reload(true)
```
Исправление — бампнуть `VERSION`.

**OOM на VPS:**
```bash
journalctl -u meatbar | grep -i "killed\|oom"
free -h
```
- Swap < 2 GB — увеличить.
- `MemoryMax=` в systemd unit.
- Memory leak — в RUM-обработчике.

**Spike трафика / атака:**
```bash
journalctl -u meatbar --since "10 min ago" | grep -oP '\b\d+\.\d+\.\d+\.\d+\b' | sort | uniq -c | sort -rn | head
```
- Rate-limit ужесточить.
- Cloudflare / fail2ban.
- DDoS → CDN обязателен.

### Чего НЕ делать

- Паниковать (5 минут triage лучше хаотичных действий).
- Чинить несколько вещей параллельно.
- `git reset --hard` — rollback через checkout на tag.
- `rm -rf` без бэкапа.
- Деплоить непротестированное «чтобы быстрее».
- Винить конкретного человека.

### Эскалация владельцу

- Любой SEV-1 — сразу.
- SEV-2 если mitigation > 30 минут.
- Любая деструктивная операция (восстановление БД, удаление, env).
- Утечка данных или подозрение на атаку.
- Нужен ре-ключ JWT / admin password / интеграционных токенов.

---

## 24. Release workflow

Полная версия: `.kiro/steering/release-workflow.md`. Подключать через `#release-workflow`.

Основано на [release-manager](https://github.com/alirezarezvani/claude-skills) + [changelog-generator](https://github.com/alirezarezvani/claude-skills).

### Semver

- **MAJOR** (X.0.0) — breaking: изменение `/api/*`, схемы БД, формата localStorage, удаление функций.
- **MINOR** (X.Y.0) — новые фичи без breaking.
- **PATCH** (X.Y.Z) — багфиксы, оптимизации.

Версия в `backend/package.json` + `frontend/package.json`. Бампаем вручную.

### Conventional commits (уже в разделе 15, короткая версия)

Типы: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`, `revert`.

Scope: `frontend`, `backend`, `sw`, `admin`, `booking`, `menu`, `cloudhero`, `cart`, `ci`, `seo`, `deps`.

Breaking: `feat(api)!:` или `BREAKING CHANGE:` в footer.

### Changelog

`CHANGELOG.md` в корне (создать при первом релизе). Формат [Keep a Changelog](https://keepachangelog.com/).

```markdown
## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.2.0] — 2026-05-11

### Added
- Responsive srcset для dish-cards (planopt A1).
- BackgroundSync для /api/orders (planopt D19).

### Performance
- index.js.gz: 103.7 KB → 99.8 KB.
```

### Release readiness чеклист

- [ ] Все `planopt.md` задачи спринта `[x]`.
- [ ] Версии в `package.json` бампнуты.
- [ ] `CHANGELOG.md` обновлён с новой версией и датой.
- [ ] `guard:mojibake → lint → build → perf:budgets → node --check` — OK.
- [ ] Бэкап `backend/data/meatbar.sqlite`.
- [ ] SW `VERSION` бампнут, если SW менялся.
- [ ] `docs/PERF-BASELINE.md` обновлён.
- [ ] README / PLAN-1 / PLAN-2 / `planopt.md` содержат UPDATE.
- [ ] `.env` на VPS актуален.
- [ ] Git tag `v1.2.0` создан — только по явной просьбе владельца.

### Rollback

1. `git checkout <previous-tag>` на дев-машине.
2. `npm --prefix frontend run build`.
3. `rsync dist/` на VPS.
4. `git checkout <previous-tag>` на backend.
5. `systemctl restart meatbar`.
6. Smoke-check.
7. PIR в `docs/INCIDENT-LOG.md`.

Без force-push, без `reset --hard`.

### Пост-релизный мониторинг (первый час)

- `/api/health` 200 каждые 5 минут.
- `journalctl -u meatbar -f` 10 минут.
- `/api/rum` — нет новых error событий.
- Socket.IO — клиенты переподключились без петель.
- SW `New version activated` в DevTools.

### Обновления зависимостей в релиз

- Patch — можно при audit alert.
- Minor — обсудить.
- Major — явно согласовать с владельцем.


---

## UPDATE 2026-05-12 — menu visual parity + 10 planopt tasks

### Исправлено
- Полоса прокрутки в меню (`.menu-tabs`) — скрыта по образцу `.bar-tabs`, визуально не видна при клике +/- по позициям.
- Визуал карточек меню (`.dish-card`) приведён 1-в-1 к `.bar-card`: tilt 3D через `--bx/--by/--hover`, warm ember glow, photo parallax, dotted leader-line в футере. Бизнес-логика и структура меню не изменены.

### 10 задач planopt
E24 (ETag), E23 (Brotli JSON), E28 (rum rate-limit), A2 (dish-card LQIP fallback), A6 (HeroReel stillFrame), C15 (perf-tier box-shadow), G36 (connection.change reactivity), H42 (soft update-toast), B8 (seo/analytics/rum → idle chunks), F35 (SharedHeader memo + MenuPage callbacks).

### Бонус C13 (с разрешения владельца)
Удалены ~38 неиспользуемых CSS селекторов из `App.css` (mobile-menu, cart-panel/cart-line, booking-form/error/success, contacts-section/contact-cards, table-point/table-card, zone-*, .pill и др.). Регрессий визуала нет — классы не были ни в одном TSX.

### Backend
- Новый файл `backend/src/brotli-json.js` (zero new dependencies, `node:zlib` built-in).
- `backend/src/security.js` — `rumLimiter`.
- `backend/src/routes/public.js` — weak ETag, sendJsonWithBrotli integration.

### Frontend
- Переписан `src/pages/MenuPage.tsx` (DishCard subcomponent + memo + tilt).
- `src/components/SharedHeader.tsx` — `React.memo`.
- `src/pages/HomePage.tsx` — HeroReel stillFrame ветка.
- `src/main.tsx` — soft update-toast, idle-imports для SEO/analytics/RUM.
- `src/lib/perfTier.ts` — `installPerfTierReactivity()`.

### Метрики
| | До 2026-05-11 | После 2026-05-12 |
|---|---|---|
| `index.js.gz` | 101.89 KB | **100.77 KB** |
| `index.css.gz` | 14.09 KB | **13.22 KB** |
| `MenuPage.js.gz` (lazy) | 4 KB | 2.73 KB |
| Idle-only chunks | 0 | seo (2.03) + rum (3.14) + analytics (0.65) |

### Проверки
guard:mojibake / lint (0 errors, 3 pre-existing admin warnings) / build / perf:budgets / node --check — все зелёные.


---

## UPDATE 2026-05-12 — кнопки, свечение, выравнивание (финал)

### Кнопки — единый стиль FireButton
Все CTA-кнопки теперь используют `<FireButton variant="outline" glow>` (тот же компонент что «Забронировать»):
- «В заказ» в меню
- Категории меню (Бургеры и т.д.)
- Категории бара (На компанию и т.д.)
- Табы залов (Первый зал, Открытый гриль, Лаунж и бар)
- Телефон в шапке (через CSS-классы `fire-btn fire-btn-outline fire-btn-glow`)

### Свечение
- Внутри dish-card: footer имеет `transform-style: flat; transform: translateZ(0)` — выводит кнопку из 3D-контекста карточки. `filter: drop-shadow` рендерится в плоском пространстве, по pill-форме, не квадратит.
- 3D tilt на карточках сохранён.

### Выравнивание
- `.dish-card-body { flex: 1 }` + `.dish-card-footer { margin-top: auto; padding-top: 24px }` — кнопка всегда внизу карточки, независимо от наличия описания.
- При добавлении новых позиций через админку — выравнивание автоматическое.

### Метрики
- js 98.50 KB, css 12.97 KB — в бюджете.


---

## UPDATE 2026-05-14 — Итоги сессии

### Новые компоненты

- **FloatingDock** (`frontend/src/components/FloatingDock.tsx` + `floating-dock.css`) — вертикальный dock с иконками, заменяет SideNav. Открывается при клике на бургер. CSS-анимация (scale при hover, staggered entry, tooltip). Без framer-motion.
- **Venue-slider** (inline в HomePage, секция «Что сделать сейчас») — кинематографичный слайдер фотографий интерьера с текстом по центру и кнопками (Меню, Бронь, Позвонить). 10 слайдов, 10s интервал.

### Изменения шапки

- Овальная pill-shape форма убрана — шапка полностью прозрачная.
- Логотип увеличен до 104px (56px на мобильных ≤640px).
- Hover-подсказки `.nav-hint` под навигацией (Зал → «Интерьер и атмосфера» и т.д.).
- Навигация скрыта на ≤880px — доступна через FloatingDock.
- Иконки dock: Sofa, ChefHat, GlassWater, CalendarCheck, Navigation, PhoneCall (lucide deep-import).

### Мобильная оптимизация

- Mobile-cta-bar скрывается при скролле вниз (`.is-hidden` + JS scroll listener).
- Заголовки секций: `clamp(32px, 10vw, 56px)` на мобильных.
- Описания блюд: 12px / 4 строки (было 11px / 3).
- Цены: `flex-shrink: 0` — не прыгают на другую строку.

### Производительность

- Venue-slider: cleanup таймеров при unmount (нет утечек).
- Order-reel: cleanup wheel/scroll listeners при unmount.
- `.culture-tile`: box-shadow уменьшен, `contain: layout paint style`.
- `data-perf='low'`: отключены cinema-hero::after animation, venue-slider filter, culture-tile heavy shadow.
- Gallery-track: скорость 120s (было 64s), фото 440×300px (было 520×360), border-radius 12px.
- Scene-card img: `filter: saturate(1.15) contrast(1.08) brightness(0.94)` — кинематографичнее.

### Бюджеты (после всех изменений)

| Артефакт | Лимит | Текущее |
|---|---|---|
| `index-*.js.gz` | ≤ 103 KB | 80.80 KB |
| `index-*.css.gz` | ≤ 14.60 KB | 13.28 KB |

CSS бюджет увеличен с 14.10 до 14.60 KB (обоснованно: venue-slider, floating-dock, nav-hint, mobile-cta-bar animation).

### Правила (не менять без согласия)

- FloatingDock (компонент, CSS, иконки, анимации).
- Venue-slider (фото, тексты, тайминги, кнопки).
- Прозрачная шапка (без background/border/shadow).
- Hover-подсказки `.nav-hint`.
- Размер логотипа (104px десктоп, 56px мобильный).
- Mobile-cta-bar скрытие при скролле.
- Не возвращать SideNav и pill-shape шапку.


---

## UPDATE 2026-05-14 — секция «Голос гостей» (отзывы 2ГИС)

### Описание

Секция `.split-story[data-bg="3"]` на главной странице. Левая колонка — sticky-панель с eyebrow «Голос гостей», H2 «Тёплый зал, к которому возвращаются.», подпись про 700+ отзывов / рейтинг 4.7 / премия 2ГИС 2025 + движущийся логотип. Правая колонка — swipe-стек отзывов (компонент `Picture`).

### Компонент Picture

- Файлы: `frontend/src/components/Picture.tsx` + `picture.css`.
- Lazy-loaded через `React.lazy()` → отдельный chunk `Picture-*.js.gz` (~5.6 KB).
- 30 отзывов из `Отзывы.txt` (реальные отзывы 2ГИС).
- Tinder-style swipe: drag через pointer-events, threshold 100 px, exit-анимация 360 ms.
- В DOM одновременно максимум 3 карточки (top + 2 preview). Остальные — в JS-памяти.
- Preview-карточки: `visibility: hidden` на text/foot (фикс «текст заезжает на нижнюю»).
- CSS-пейзажи: 8 вариаций через `--scene` (солнце + 2 гряды гор + туман + вуаль).
- Текст по центру, имя/дата по центру снизу, 5 brass-звёзд.
- Empty state: «Все отзывы прочитаны. Спасибо, что дочитали до конца. Мы ждём Вас на ужин.» + кнопка «Больше отзывов на 2ГИС».
- `prefers-reduced-motion` → fallback в обычный grid-список.
- `data-perf='low'` → без blur на солнце, упрощённые тени.

### Другие изменения

- Третья фраза «Огонь на вынос»: «Мясо не ждёт. Мы тоже.» → «Огонь не остывает по дороге к вам.»
- Кнопка «Выбрать столик» → `variant="outline"` (как «Открыть меню»).
- Кнопка «Собрать заказ» → «Доставка».

### Правила (не менять без согласия)

- Секция «Голос гостей» целиком (eyebrow, H2, подпись, логотип, Picture).
- Компонент Picture (swipe-механика, массив отзывов, CSS-пейзажи, empty state, кнопка 2ГИС).
- Третья фраза «Огонь на вынос».
- `variant="outline"` на «Выбрать столик» и текст «Доставка».
