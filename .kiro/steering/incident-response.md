---
inclusion: manual
---

# Incident response

Подключать через `#incident-response` когда что-то сломалось на проде. Основано на [incident-commander](https://github.com/alirezarezvani/skills) и нашем `docs/PRODUCTION-RUNBOOK.md`.

## Severity levels

Чётко определённая шкала — чтобы не паниковать на мелочах и не проспать серьёзное.

### SEV-1 — критично, сайт лежит

- Главная отдаёт 5xx или не грузится.
- Бронирование полностью сломано.
- Заказ полностью сломан.
- Утечка данных или активная атака.
- БД повреждена или недоступна.

**Response:** немедленно, любое время суток. Rollback в первую очередь, разбор потом.

### SEV-2 — важно, деградация

- Часть функционала не работает (например, админка недоступна, но публичная часть OK).
- Web Vitals упали в 2+ раза (LCP > 4s).
- Error rate > 5%.
- Интеграция не работает (YooKassa платежи не проходят).
- SW сломался, но fallback на network работает.

**Response:** в течение часа в рабочее время, в течение 4 часов вне рабочего времени.

### SEV-3 — неприятно, но не горит

- Один endpoint медленный (> 1 сек p75), остальное OK.
- Мелкий визуальный баг на конкретном разрешении.
- Warning в логах без user-impact.
- Нехватка места на диске < 20% свободно.

**Response:** в течение рабочего дня.

### SEV-4 — информационный

- Новая JS-ошибка, впервые встреченная, но rate низкий.
- Нужно увеличить size log rotation.
- Обновилась версия одной из зависимостей.

**Response:** в течение недели, в рамках следующего релиза.

## Runbook процесс (для любого SEV)

### 0. Detect

- Автомат: alert (Telegram / UptimeRobot / Sentry).
- Вручную: владелец заметил, сообщил.
- Регулярно: daily digest показал аномалию.

### 1. Declare

Сразу обозначить SEV-уровень. Не стесняемся:

> SEV-1: сайт не грузится с 14:03, начинаю работу.

Если ИИ работает над инцидентом автономно — сообщает владельцу SEV-уровень в первом ответе.

### 2. Triage

Первые 5 минут — понять масштаб:

- [ ] Главная грузится? (открыть в incognito)
- [ ] `/api/health` отвечает?
- [ ] Логи backend (`journalctl -u meatbar -n 200`).
- [ ] SQLite file in place? Не corrupted?
- [ ] Nginx / reverse proxy живы?
- [ ] DNS резолвится?
- [ ] SSL-сертификат действителен?

### 3. Mitigate (остановить кровь)

**Цель: вернуть сайт в рабочее состояние. Причину ищем потом.**

Порядок:

1. **Rollback** — самый безопасный. `git checkout <previous-tag>` + `rsync` + `restart`.
2. **Restart service** — `systemctl restart meatbar`.
3. **Restart reverse proxy** — `systemctl restart nginx`.
4. **Restore backup** — если БД повреждена. Из `backend/data/meatbar.sqlite.backup-YYYY-MM-DD`.
5. **Disable feature** — временно выключить интеграцию (env: `YOOKASSA_SHOP_ID=`).
6. **Scale down** — если overload, временно ограничить трафик на reverse proxy.

Не чинить всё сразу. Одно действие → проверка → следующее.

### 4. Communicate

- SEV-1 / SEV-2 — владелец в курсе в реальном времени.
- SEV-3 — отчёт раз в час или в конце рабочего дня.
- SEV-4 — в следующем дейли digest.

Формат:

> SEV-1 обновление:
> - Время инцидента: 14:03
> - Статус: mitigation выполняется, rollback к `v1.2.3`.
> - Ожидаемое время восстановления: 5 минут.
> - Impact: главная + бронь недоступны.

### 5. Verify

После mitigation — smoke-check по `docs/PRODUCTION-RUNBOOK.md`:

1. `https://мясо-бар.рф` — 200.
2. `/api/health` — `{ ok: true }`.
3. Тестовая бронь — 200.
4. Тестовый заказ — 200.
5. Логи backend — чисто, нет новых 5xx.

Если хоть один шаг failed — не объявляем RESOLVED, продолжаем mitigation.

### 6. Resolve

Написать в чат владельцу:

> SEV-1 RESOLVED. Downtime: 9 минут (14:03 — 14:12).
> Root cause: OOM на VPS из-за утечки памяти в `/api/rum`.
> Mitigation: rollback на `v1.2.3` + `systemctl restart`.
> Postmortem: напишу в `docs/INCIDENT-LOG.md` в течение 24 часов.

### 7. Postmortem (PIR)

В `docs/INCIDENT-LOG.md` — по шаблону из `.kiro/steering/observability-slo.md` или `docs/PRODUCTION-RUNBOOK.md`.

Blameless — не ищем виноватого, ищем системную причину. Формат:

1. **Summary** — одна строка.
2. **Timeline** — с таймстемпами.
3. **Impact** — downtime, кол-во affected юзеров, потерянные данные.
4. **Root cause** — 5 whys, без догадок.
5. **Resolution** — что сделали.
6. **Prevention** — конкретные задачи в `planopt.md` или новые файлы.
7. **Lessons learned** — 1–3 пункта.

## Типовые инциденты и готовые действия

### Backend не стартует

```
systemctl status meatbar
journalctl -u meatbar -n 200
# Проверить:
# - Node.js версия (должна быть 20+)
# - .env присутствует
# - `backend/data/meatbar.sqlite` не locked
# - порт 4000 свободен
```

Если SQLite locked — `fuser backend/data/meatbar.sqlite`, убить процесс, рестарт.

### SQLite corrupted

```
cp backend/data/meatbar.sqlite backend/data/meatbar.sqlite.broken
cp backend/data/backups/meatbar.sqlite.YYYY-MM-DD backend/data/meatbar.sqlite
systemctl restart meatbar
```

После восстановления — выяснить что повредило: полный диск, power-loss, процесс убит на fsync.

### Frontend белый экран

- Открыть DevTools → Console → ошибка?
- Если `Failed to load module` — кеш SW сломал что-то → `unregister` SW, hard reload.
- Если `Uncaught TypeError` — rollback на предыдущий `dist/`.

### Service Worker застрял на старой версии

```js
// Владельцу / в DevTools Console
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
location.reload(true)
```

Исправление в коде — бампнуть `VERSION` в `sw.js`.

### API endpoint медленный

```sql
-- Посмотреть в SQLite логи что там:
SELECT name, AVG(value), COUNT(*)
FROM rum_events
WHERE name IN ('LCP', 'TTFB')
  AND created_at > unixepoch() * 1000 - 86400000
GROUP BY name;
```

Посмотреть `Server-Timing` headers на медленных ответах — cache hit/miss?

### OOM на VPS

```bash
journalctl -u meatbar | grep -i "killed\|oom"
free -h
```

- Увеличить swap (если < 2 GB).
- Настроить `MemoryMax=` в systemd unit.
- Проверить memory leak в RUM-обработчике.

### Атака / spike трафика

```bash
# Посмотреть топ IP:
journalctl -u meatbar --since "10 min ago" | grep -oP '\b\d+\.\d+\.\d+\.\d+\b' | sort | uniq -c | sort -rn | head
```

- Временно ужесточить rate-limit.
- Включить Cloudflare / fail2ban.
- Если это DDoS — CDN обязателен.

## Что НЕ делать в инциденте

- **Не паниковать.** Пять минут на triage лучше чем хаотичные действия.
- **Не чинить сразу несколько вещей параллельно.** Одно за раз, с проверкой.
- **Не делать `git reset --hard`** — rollback через checkout на tag.
- **Не `rm -rf`** ничего, пока не взят бэкап.
- **Не деплоить непротестированное** «чтобы быстрее». Лучше rollback + спокойная починка.
- **Не винить конкретного человека.** Ошибка процесса, не личности.

## Чеклист эскалации

Эскалировать владельцу (если ИИ работает автономно):

- Любой SEV-1 — сразу.
- SEV-2 если mitigation занял > 30 минут.
- Любая деструктивная операция (восстановление БД, удаление файлов, изменение env).
- Утечка данных или подозрение на атаку.
- Нужен ре-ключ JWT / ADMIN_BOOTSTRAP_PASSWORD / интеграционных токенов.
