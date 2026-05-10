# Мясо Бар — актуальный проект (frontend + backend)

Последнее обновление README: **2026-05-10**.

Этот репозиторий содержит рабочий код сайта/админки, планы развития и жёсткие правила, чтобы проект не ломался при работе разными ИИ.

## Что в репозитории

- `frontend/` — React 19 + TypeScript + Vite (сайт + `/admin` SPA)
- `backend/` — Express + SQLite + Socket.IO API
- `docs/` — baseline производительности, запуск в production, SEO checklist
- `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md` — план/статус оптимизации, SEO, безопасности
- `PLAN-2-PREMIUM-VISUAL-DESIGN.md` — план/статус premium-визуала без потери производительности
- `PRAVILA.md` — главные жёсткие правила проекта
- `WORKFLOW.md` — обязательный процесс работы любых ИИ с проектом

## Важные правила перед любыми изменениями

Перед правками обязательно прочитать:

1. `PRAVILA.md`
2. `WORKFLOW.md`
3. `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md`
4. `PLAN-2-PREMIUM-VISUAL-DESIGN.md`
5. `docs/PERF-BASELINE.md`

Без этого менять код нельзя.

## Быстрый старт (локально)

### Frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

### Backend (dev)

```bash
cd backend
npm install
npm run dev
```

По умолчанию backend слушает `3001`.

## Production build frontend

```bash
cd frontend
npm run build
```

Сборка попадает в `frontend/dist/`.

## Обязательные проверки после изменений

Строгий порядок:

```bash
npm --prefix frontend run guard:mojibake
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run perf:budgets
node --check backend/src/index.js
```

Если что-то падает — задача не считается завершённой.

## SEO и домен (Нижневартовск)

- целевой домен: `https://мясо-бар.рф`
- генерация `robots.txt` и `sitemap.xml` поддерживает `SITE_URL`
- верификация поисковиков через env:
  - `YANDEX_VERIFICATION_CODE`
  - `GOOGLE_SITE_VERIFICATION`
- подробный боевой чеклист: `docs/SEO-LAUNCH-CHECKLIST.md`

## Текущий статус проекта

Актуальный статус выполнения задач ведётся в:

- `PLAN-1-OPTIMIZATION-SEO-PRODUCTION.md` (разделы `UPDATE`)
- `PLAN-2-PREMIUM-VISUAL-DESIGN.md` (разделы `UPDATE`)
- `docs/PERF-BASELINE.md` (бенчмарки и проходы оптимизации)

Именно эти файлы считаются источником правды по прогрессу.

## Примечание по GitHub и ИИ

Если репозиторий публичный, любой ИИ с доступом к интернету может читать проект.  
Чтобы ИИ не вносил лишние или опасные изменения, используйте шаблон из `WORKFLOW.md`.
