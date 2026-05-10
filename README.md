# Мясо Бар — полный архив проекта

## Структура

- `frontend/` — исходный код фронтенда (React 19 + TypeScript + Vite)
  - `frontend/dist/` — production-сборка (готова к деплою как статика)
- `backend/` — Express + SQLite + Socket.IO сервер
- `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md` — план оптимизации, SEO Яндекс/Google для Нижневартовска, безопасность, production-readiness
- `PLAN-2-PREMIUM-VISUAL-DESIGN.md` — план премиум-визуала без потери производительности

## Что было сделано в этой версии (Phase 13)

1. **Огоньки убраны** — со столиков удалены spotlight, ★-heatmap, hover-glow, pulse, dim
2. **Реалистичный зал** — добавлены `ChairShape` (стулья со спинкой, hall-aware: кожа/велюр), `Banquette` (диваны вдоль стен с capitonné), паркет «ёлочка» Hall 1, кирпичная стена Hall 2, оконные блики
3. **Зум удалён** — кнопка зума, состояние, ViewBox-анимация и константы вычищены
4. **Кнопка «Бронь» в шапке** — preload BarMenuSection + плавный скролл к `#booking` с 4-stage settle (180/360/540/760 мс) + `scroll-margin-top: 96px`

## Запуск frontend (development)

```bash
cd frontend
npm install
# при необходимости: скопировать .env.example -> .env и задать значения
npm run dev
```

## Сборка frontend (production)

```bash
cd frontend
npm install
npm run build
# → dist/
```

## SEO-настройка перед production (Нижневартовск)

- Для корректных `robots.txt`/`sitemap.xml` задайте `SITE_URL`:
  - frontend build: `SITE_URL=https://<ваш-домен> npm run build`
  - backend runtime: `SITE_URL=https://<ваш-домен> npm start`
- Опционально можно задать `CLEAN_PARAMS` (через `&`) для `robots.txt`.
- Верификация поисковиков (автогенерация файлов при build):
  - `YANDEX_VERIFICATION_CODE=<код>` → файл `yandex_<код>.html`
  - `GOOGLE_SITE_VERIFICATION=<код>` → файл `google<код>.html`
- Аналитика (опционально, без ключей по умолчанию):
  - `VITE_GA_MEASUREMENT_ID=<GA4_ID>`
  - `VITE_YM_COUNTER_ID=<YANDEX_COUNTER_ID>`
- Без `SITE_URL` используется fallback `https://мясо-бар.рф` (целевой домен проекта).
- Для боевого запуска см. подробный чеклист: `docs/SEO-LAUNCH-CHECKLIST.md`.

## Запуск backend

```bash
cd backend
npm install
# при необходимости: скопировать .env.example -> .env и задать значения
npm start
# слушает порт 3001 по умолчанию
```

## Превью текущей версии

https://restaurant-reservation-app-b8wl5uuv.devinapps.com

## Качество

- TypeScript: `tsc -b --noEmit` — 0 ошибок
- ESLint: `npm run lint` — 0 errors (3 предсуществующих warning в admin views)
- Build: `npm run build` — успех, все чанки + pre-compression (gzip + brotli)
- Budget-check: `npm run perf:budgets` — контроль gzip-бюджета build-артефактов
- Runbook production: `docs/PRODUCTION-RUNBOOK.md`
