---
inclusion: manual
---

# Observability & SLO

Подключать через `#observability` при проектировании мониторинга, дашбордов, алертов. Основано на [observability-designer](https://github.com/alirezarezvani/claude-skills) + наш `planopt.md` J47–J50.

## Service Level Objectives (SLO) для «Мясо Бара»

SLO — что обещаем пользователям. Не максимум, а «приемлемо».

| Сервис           | Метрика                     | SLO p75   | SLO p95 | Window |
| ---------------- | --------------------------- | --------- | ------- | ------ |
| Главная страница | Uptime                      | 99.9%     | 99.5%   | 30d    |
| `/api/health`    | Uptime                      | 99.9%     | 99.5%   | 30d    |
| `/api/menu`      | Latency                     | < 200 ms  | < 500ms | 7d     |
| `/api/tables`    | Latency                     | < 200 ms  | < 500ms | 7d     |
| `/api/bookings`  | Latency                     | < 500 ms  | < 1.5s  | 7d     |
| `/api/orders`    | Latency                     | < 500 ms  | < 1.5s  | 7d     |
| LCP (mobile)     | Core Web Vital              | < 1.8 s   | < 2.5s  | 28d    |
| INP (mobile)     | Core Web Vital              | < 200 ms  | < 500ms | 28d    |
| CLS              | Core Web Vital              | < 0.05    | < 0.1   | 28d    |
| JS error rate    | % сессий без ошибок         | > 99.5%   | > 98%   | 7d     |
| Бронь success    | % успешных POST /bookings   | > 99%     | > 95%   | 7d     |
| Заказ success    | % успешных POST /orders     | > 99%     | > 95%   | 7d     |

Если нарушили SLO — инцидент, анализируем, исправляем, пишем PIR.

## Что мониторить

### Золотые сигналы (Google SRE)

1. **Latency** — `/api/*` p50/p75/p95/p99.
2. **Traffic** — RPS по endpoint-ам.
3. **Errors** — 5xx rate, 4xx rate отдельно.
4. **Saturation** — CPU, memory, connections, SQLite lock time.

Плюс специфичные:

5. **Web Vitals** — LCP/INP/CLS/TTFB из RUM.
6. **PWA metrics** — SW install rate, cache hit rate.
7. **Conversion** — бронь openedDialog → confirmedBooking.

## Где хранить данные

Три слоя:

### 1. Backend logs

- `stdout` / `stderr` → systemd journal (`journalctl -u meatbar`).
- Прямо сейчас: `console.log('[server]', ...)`, `console.error('[server]', ...)`.
- Формат: plain text с префиксами. В идеале перевести на JSON через `pino` — это отдельная задача.
- Retention: 14 дней на VPS (systemd-journald настройка).

### 2. RUM (client-side)

- `web-vitals` + `PerformanceObserver` → `POST /api/rum` → SQLite table `rum_events`.
- Формат: `{ name, value, rating, ... }` уже определён.
- Retention: SQLite — всё, что помещается. Делаем `DELETE WHERE created_at < NOW() - 90d` cron-job (не реализовано, planopt J47).

### 3. Application metrics (future)

- Пока нет. Когда пойдём на VPS и появится больше трафика — добавим Prometheus exporter + Grafana.
- Временно можно собирать вручную: `SELECT name, AVG(value), p75(value) FROM rum_events GROUP BY name, date(created_at)`.

## Дашборд — что показывать

Минимальный дашборд в admin-UI (planopt J47):

### Страница 1 — Vitals

- Графики за 7 дней: LCP p75, INP p75, CLS p75, TTFB p75.
- Разрез по `conn` (4g/3g/2g/wifi).
- Разрез по `saveData` (true/false).
- Топ-10 самых медленных `pathname`.

### Страница 2 — API

- RPS по endpoints за 24h.
- p50/p75/p95 latency по endpoints за 7d.
- Error rate (5xx) по endpoints за 7d.
- Cache hit rate (hit/miss из `Server-Timing`) для публичных endpoints.

### Страница 3 — Business

- Брони за 7d (успешные / неуспешные / pending).
- Заказы за 7d (успешные / pending / failed).
- Конверсия «открыл карту залов → забронировал».
- Конверсия «добавил в корзину → оформил заказ».

### Страница 4 — Health

- Uptime `/api/health` за 30d.
- Memory / CPU backend (если есть доступ через `/api/health`).
- Размер SQLite БД.
- Размер логов.

## Alert-правила

Цель — алерт приходит **до** того, как пользователи заметили. Но не спамит.

### Критичные (Telegram / SMS владельцу)

- `/api/health` не отвечает > 60 сек.
- Главная отдаёт 5xx > 60 сек.
- JS error rate > 2% за 10 минут.
- Бронь success rate < 90% за 1 час.

### Важные (Telegram, в рабочие часы)

- LCP p75 > 3 сек за 1 час.
- INP p75 > 500 мс за 1 час.
- `/api/bookings` p95 > 3 сек за 1 час.
- Cache hit rate < 50% на `/api/menu` за 1 час.

### Информационные (daily digest)

- Сводка за день: uptime, web-vitals, конверсии.
- Новые JS errors (впервые встреченные).
- Необычные паттерны: резкий рост трафика, необычное соотношение conn-типов.

## Инструменты (минимум → максимум)

### Уровень 1 — что работает прямо сейчас

- `journalctl -u meatbar -f` — смотреть логи.
- `POST /api/rum` → SQLite — RUM уже пишется.
- Ручной SQL-запрос к `rum_events` для dashboard.

### Уровень 2 — первые шаги

- UptimeRobot / Better Stack — ping главной + `/api/health` каждые 60 сек, alert в Telegram.
- Admin-view `/admin/rum` — простой dashboard с p50/p75/p95 (planopt J47).
- Sentry (self-hosted или free tier) для JS-ошибок (planopt J48).

### Уровень 3 — промышленный минимум

- Prometheus + Grafana (VPS).
- Loki для структурированных логов.
- AlertManager для правил.
- PagerDuty / OnCall для ротации.

На уровне «один ресторан + один разработчик» уровень 2 — потолок разумного.

## PIR (Post-Incident Review) — шаблон

Хранится в `docs/INCIDENT-LOG.md` (создать при первом инциденте).

```markdown
# Incident 2026-XX-XX

## Summary
Одна строка: что случилось, кого коснулось, сколько длилось.

## Timeline (UTC+5)
- 14:03 — первый alert: `/api/health` не отвечает.
- 14:05 — владелец проверил VPS, `systemctl status meatbar` — service dead.
- 14:07 — `journalctl`: OOM, killed by kernel.
- 14:09 — `systemctl restart meatbar` — вернулся в строй.
- 14:12 — smoke-check — всё OK.

## Impact
- ~9 минут downtime главной.
- ~0–5 потерянных POST /bookings (если были).
- Нет потери данных (SQLite чист).

## Root cause
Почему случилось. Только факты, не догадки.

## Resolution
Что сделали прямо сейчас.

## Prevention
Что сделать, чтобы не повторилось. Конкретные задачи:
- [ ] Увеличить swap на VPS.
- [ ] Настроить memory-limit в systemd unit.
- [ ] Добавить alert «memory > 80%».

## Lessons learned
Что поняли. 1–3 пункта.
```

## Секреты мониторинга

- Не слать в алерты тело запросов (могут быть PII).
- Не логировать JWT, SMS-коды, API-ключи.
- Access к `/admin/rum` — только админ (под `authMiddleware`).
- Если RUM-таблица разрастается > 1 GB — чистить старше 90 дней.
