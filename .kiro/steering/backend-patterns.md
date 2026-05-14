---
inclusion: fileMatch
fileMatchPattern: 'backend/**/*.js'
---

# Backend-паттерны (Express + SQLite + Socket.IO)

## Архитектура

- `backend/src/index.js` — входная точка, middleware, роуты, Socket.IO.
- `backend/src/config.js` — `dotenv` + все env-переменные через один объект.
- `backend/src/db.js` — схема, bootstrap admin, seed меню и столов.
- `backend/src/auth.js` — JWT, bcrypt.
- `backend/src/security.js` — origins whitelist, rate-limiters.
- `backend/src/seo.js` — robots/sitemap билдеры.
- `backend/src/routes/` — `public.js`, `admin.js`, `auth.js`.
- `backend/src/integrations/` — YooKassa, SMS, Telegram, VK, notifier.

## Безопасность (помним всегда)

- `helmet()` обязателен, не отключать `referrerPolicy`, `crossOriginResourcePolicy`.
- `HSTS` включается только при `secure` или `x-forwarded-proto === 'https'`.
- `app.disable('x-powered-by')` — обязательно.
- `app.set('trust proxy', 1)` — работаем за reverse proxy на VPS.
- CORS — **whitelist** через `buildAllowedOrigins(config)`, никогда `*`.
- Rate-limiters: `loginLimiter` 5/10m, `bookingLimiter` 10/10m, `orderLimiter` 20/10m, `smsLimiter` 20/10m. Не ослаблять.
- Admin routes под `authMiddleware`, всегда.
- `/admin/*` отдаётся с `X-Robots-Tag: noindex, nofollow, noarchive`.

## База (SQLite + better-sqlite3)

- Только подготовленные запросы (`db.prepare(...).run(params)`).
- Никаких строковых конкатенаций SQL.
- Транзакции через `db.transaction(fn)` для batch-операций.
- Миграции — в `bootstrap()` в `db.js`, идемпотентные (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN` с проверкой).
- Не дропать таблицы, не чистить данные без согласия владельца.
- Бэкап `backend/data/meatbar.sqlite` перед любой миграцией.

## API-дизайн

- Все endpoints возвращают JSON.
- Коды ответов: 200 OK, 201 Created (опц.), 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Server Error.
- Ошибки — `{ error: 'user-safe message' }`. Не раскрывать стек/секреты.
- Валидация тела: минимум — проверка required полей. План — перейти на `zod` (см. PLAN-1).

## Кэш и производительность

- In-memory micro-cache 60s для `/api/menu`, `/api/tables`, `/api/content` — уже есть в `routes/public.js`.
- `Cache-Control: public, max-age=60, stale-while-revalidate=600` на тех же endpoints.
- `Server-Timing: app;dur=X, cache;desc="hit|miss"` пишется.
- ETag — запланирован (planopt E24).
- Brotli для JSON — запланирован (planopt E23).
- `express-static-gzip` отдаёт `.br/.gz` из `backend/public/`, immutable cache для хешированных бандлов.

## Инвалидация кэша

- После мутации меню / столов / контента вызывать `clearPublicApiCache('menu' | 'tables' | 'content')`.
- После бронирования стола — `clearPublicApiCache('tables')` + `io.emit('tables:updated', ...)`.

## Socket.IO

- CORS whitelist такой же, как у Express.
- Emit событий: `tables:updated`, `tables:created`, `tables:deleted`, `bookings:new`, `orders:new`, `orders:paid`.
- Не слать секретных данных в event payload.
- Heartbeat/ping оставляем дефолтный Socket.IO.

## Интеграции (off by default)

- YooKassa: включается когда заполнены `YOOKASSA_SHOP_ID` + `YOOKASSA_SECRET_KEY`.
- SMS.ru: `SMS_ENABLED=true` + `SMSRU_API_ID`.
- Telegram: `TELEGRAM_ENABLED=true` + `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
- VK: `VK_ENABLED=true` + `VK_BOT_TOKEN` + `VK_PEER_ID`.

Никогда не коммитить реальные токены. Пустые env — интеграция тихо выключается.

## Логи

- `console.log` / `console.error` с префиксом `[server]`, `[rum]` и т.п.
- Не логировать тело `/api/rum` массово (может разнести диск).
- Не логировать пароли, токены, phone verification codes.

## Health

- `/api/health` — простой, всегда 200, возвращает `{ ok, integrations }`.
- Запланировано расширение: `uptime`, `db`, `memory`, `version` (planopt E27).

## Graceful shutdown (не забывать при VPS-деплое)

- `process.on('SIGTERM')` — закрыть server, закрыть sqlite `db.close()`, затем `process.exit(0)`.
- Таймаут на активные соединения 10s.
