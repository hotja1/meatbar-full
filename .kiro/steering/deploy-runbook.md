---
inclusion: manual
---

# Deploy runbook (manual — подключать через `#deploy-runbook`)

Подключается руками через упоминание `#deploy-runbook` в чате. Используется когда готовимся к выкату на VPS.

## Pre-flight (обязательно)

1. Ветка актуальна с main, все изменения замержены.
2. `npm --prefix frontend run guard:mojibake` — OK.
3. `npm --prefix frontend run lint` — OK (3 известных admin warning допустимы).
4. `npm --prefix frontend run build` — OK.
5. `npm --prefix frontend run perf:budgets` — OK (JS ≤ 103 KB, CSS ≤ 14 KB gzip).
6. `node --check backend/src/index.js` — OK.
7. Бэкап `backend/data/meatbar.sqlite` скопирован в безопасное место.
8. `.env` на VPS проверен: `SITE_URL`, `CLIENT_ORIGIN`, `JWT_SECRET`, интеграции.

## Frontend build → backend/public

1. На dev-машине: `npm --prefix frontend run build`.
2. Проверить `frontend/dist/`:
   - Есть `index.html`, `manifest.webmanifest`, `sw.js`, `robots.txt`, `sitemap.xml`, `precache-manifest.json`.
   - Рядом с каждым `.js`/`.css` есть `.gz` и `.br`.
   - Иконки и assets на месте.
3. Скопировать `frontend/dist/*` → `backend/public/` (пересборка меняет хеши, старые можно оставить 1 релиз для переходного периода).

## Deploy на VPS

1. `ssh user@host`.
2. `cd /path/to/meatbar`.
3. `git pull origin main`.
4. `npm --prefix backend ci` — если package-lock менялся.
5. Скопировать `frontend/dist/*` → `backend/public/` (либо `rsync -av --delete frontend/dist/ user@host:/path/backend/public/`).
6. Проверить `.env` на сервере.
7. Рестарт backend: `systemctl restart meatbar` (или PM2 restart, зависит от настройки).
8. Проверить логи: `journalctl -u meatbar -n 100`.

## Smoke-check после выката (5 минут)

1. Открыть `https://мясо-бар.рф` — 200, hero видно.
2. Кликнуть «Бронь» — должно уводить к `#booking` и показать карту залов.
3. Навести на стол — tooltip открылся.
4. Открыть `/api/health` — `{ ok: true }`.
5. Открыть `/robots.txt` — есть `Host` и `Sitemap`.
6. Открыть `/sitemap.xml` — валидный XML.
7. Открыть `/admin` — не индексируется (`X-Robots-Tag: noindex`).
8. DevTools → Application → Service Worker — активирован, новая версия.
9. DevTools → Network → offline → перезагрузить — сайт работает с кэша.
10. Отправить тестовую бронь — `/api/bookings` 200.

## Rollback

Если smoke-check провалился:

1. На сервере вернуть предыдущую версию: `git checkout <previous-sha>` или `rsync` из бэкапа.
2. `systemctl restart meatbar`.
3. Повторить smoke-check.
4. Зафиксировать инцидент в `docs/PRODUCTION-RUNBOOK.md`.

## Восстановление SQLite

1. `systemctl stop meatbar`.
2. `cp backend/data/meatbar.sqlite backend/data/meatbar.sqlite.broken`.
3. `cp /path/to/backup/meatbar.sqlite backend/data/meatbar.sqlite`.
4. `systemctl start meatbar`.
5. `/api/health` + проверить брони/заказы/админку.

## Мониторинг

Минимум:

1. HTTP доступность главной (UptimeRobot / Better Stack).
2. `/api/health` 200.
3. Логи backend (error rate).
4. Динамика web-vitals на `/api/rum` (RUM dashboard — planopt J47).

## SEO после первого выката

1. В Яндекс Вебмастер → добавить сайт → подтвердить → регион Нижневартовск → sitemap.
2. В Google Search Console → добавить property → подтвердить → sitemap.
3. Проверить `yandex_<code>.html` и `google<code>.html` файлы на проде.
4. Проверить canonical и JSON-LD через `validator.schema.org`.
5. Яндекс.Бизнес / 2ГИС / Google Business Profile — синхронизировать карточку (адрес, телефон, часы, ссылка на сайт).

Детальный чеклист: `docs/SEO-LAUNCH-CHECKLIST.md`.
