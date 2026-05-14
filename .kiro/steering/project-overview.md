---
inclusion: always
---

# Проект «Мясо Бар» — контекст для ИИ

## Что это

- Ресторан/гриль-бар в Нижневартовске, сайт + админка.
- Целевой домен: `https://мясо-бар.рф`.
- Монорепо `frontend/` + `backend/` на Windows (разработка) и Linux (VPS, деплой).

## Стек

- **Frontend:** React 19 + TypeScript (strict) + Vite 6. React.lazy для ниже-фолда. Без heavy-animation библиотек.
- **Backend:** Express + SQLite (`better-sqlite3`) + Socket.IO.
- **PWA:** кастомный `public/sw.js`, manifest, установка с iOS/Android.
- **CI:** GitHub Actions, команда `guard:mojibake → lint → build → perf:budgets → node --check`.
- **Pre-compression:** `.br` + `.gz` на build (vite-plugin-compression2).

## Источник правды по правилам

В порядке приоритета:

1. Прямой запрос владельца в текущей задаче.
2. `PRAVILA.md` в корне — жёсткие проектные ограничения.
3. `WORKFLOW.md` — процесс выполнения.
4. `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md` и `PLAN-2-PREMIUM-VISUAL-DESIGN.md` — дорожная карта.
5. `planopt.md` — дополнительный план оптимизации (текущий).
6. `docs/PRODUCTION-RUNBOOK.md`, `docs/SEO-LAUNCH-CHECKLIST.md`, `docs/PERF-BASELINE.md` — операционная документация.
7. `frontend/AI_GUIDE.md` — справочник по визуалу и коду (местами устаревшие пути, проверять реальные файлы).

Эти steering-файлы — краткая выжимка перечисленного. При конфликте — побеждает документ выше по списку.

## Жёсткие запреты

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

## Визуальный язык одним абзацем

Тёплый ресторанный премиум. Палитра: `ember #d81420`, `coal #120d0a`, `cream #f6eee1`, `gold #e0a64b`, плюс `brass #c69a3e`, `velvet #2c4a3c`, `leather #7a3f24`. Без синего/неона/пастели. Типографика сдержанная, сериф для заголовков, sans-serif для тела. Анимация через `transform`/`opacity`/`filter`, всегда с `prefers-reduced-motion` гардом. Блики и свет важнее ярких пятен.

## Фокус продукта

Три пользовательских потока, которые важнее всех декоративных фич:

1. **Бронь столика** — карта залов (3 зала, 35 столов, 122 места), выбор → `BookingDialog` → отправка `/api/bookings`.
   - Предзаказ меню через iframe (`/booking-menu.html`) с postMessage-коммуникацией.
   - Два режима: «Закажу на месте» (обычная бронь) и «Выбрать заранее» (бронь с оплатой).
   - При предзаказе с позициями — кнопка «Бронь с оплатой» (`paymentMethod: 'online'`), обычная кнопка скрывается.
   - Бэкенд сохраняет `pre_order` (JSON), `payment_method`, `payment_status` в таблице `bookings`.
   - YooKassa пока не подключена — `payment_status` остаётся `pending` до интеграции.
2. **Заказ блюд** — `BarMenuSection` + `CartDrawer` → `/api/orders` → опционально YooKassa.
3. **Админка** `/admin/*` — JWT, ключ `meatbar-admin-token`, CRUD всего перечисленного.

Всё остальное (галерея, journey, jobs, cloud-hero) — атмосфера.

## Текущее состояние (2026-05-11)

### Бюджеты

| Артефакт | Лимит | Текущее |
|---|---|---|
| `index-*.js.gz` | ≤ 103 KB | 101.89 KB |
| `index-*.css.gz` | ≤ 14.10 KB | 13.88 KB |
| `BookingDialog-*.css.gz` | — | 2.45 KB |
| `BookingDialog-*.js.gz` | — | 3.39 KB |
| `menu-*.js.gz` | — | 4.71 KB |

### Ключевые файлы бронирования

- `frontend/src/components/BookingDialog.tsx` — диалог брони (lazy-loaded).
- `frontend/src/components/booking-dialog.css` — стили диалога (скроллбары скрыты).
- `frontend/public/booking-menu.html` — standalone iframe-страница меню предзаказа.
- `frontend/src/data/menu.ts` — fallback-данные меню (все позиции с описаниями).
- `frontend/src/pages/HomePage.tsx` — `submitBooking()` собирает preOrder + paymentMethod.
- `frontend/src/lib/types.ts` — тип `Booking` с полями `preOrder`, `paymentMethod`, `paymentStatus`.
- `frontend/src/lib/api.ts` — `createBooking()` с offline-fallback.
- `backend/src/routes/public.js` — POST `/api/bookings` принимает preOrder/paymentMethod.
- `backend/src/db.js` — миграция колонок `pre_order`, `payment_method`, `payment_status`.

### Статус столов

- Все 35 столов в статусе `free` (фейковые `reserved`/`held` убраны из seed и из БД).
- Стол переходит в `reserved` только при реальной брони через `/api/bookings`.

### Меню

- 11 категорий, 70+ позиций, все с описаниями.
- Данные из `/api/menu` (бэкенд SQLite), fallback — `frontend/src/data/menu.ts`.
- Фото: WebP в `/assets/menu/`, не у всех позиций есть фото.

### Что НЕ подключено (план)

- YooKassa (оплата) — env пустые, интеграция тихо выключена.
- SMS.ru — env пустые.
- Telegram/VK уведомления — env пустые.
- Sentry/GlitchTip — не установлен.
- CDN/HTTP3 — нет VPS-деплоя.
