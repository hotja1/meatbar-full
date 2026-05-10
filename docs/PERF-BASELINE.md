# PERF-BASELINE.md

Дата фиксации: 2026-05-09.

Этот файл нужен, чтобы честно мерить прогресс оптимизаций (Plan №1/№2):
фиксируем базовые метрики "до/после" и сравниваем только числа, а не ощущения.

## Текущее состояние (после последних правок)

Frontend build (gzip артефакты в `frontend/dist/assets/`):

- `index-*.js.gz`: 102,468 bytes
- `index-*.css.gz`: 13,958 bytes
- `react-vendor-*.js.gz`: 1,768 bytes
- `router-vendor-*.js.gz`: 16,141 bytes
- `icons-vendor-*.js.gz`: 4,345 bytes

## Как замерять (локально)

1. Production build:

```bash
npm --prefix frontend run build
```

2. Lighthouse (рекомендуется запускать в стабильном режиме, закрыв лишние вкладки):

```bash
npx lighthouse http://localhost:5173 --form-factor=mobile --preset=desktop
```

3. Минимум, что фиксировать после каждого "блока" оптимизаций:

- Lighthouse Mobile: Performance / LCP / CLS / INP
- Lighthouse Desktop: Performance
- Размер `index-*.js.gz` и `index-*.css.gz`
- Есть ли лаги на целевых устройствах (iPhone 7+ / старые Android) в сценариях:
  - скролл главной
  - открытие "Бронь"
  - открытие карты столов и модалки бронирования
## UPDATE 2026-05-10

- `index-*.js.gz`: 102,468 bytes
- `index-*.css.gz`: 13,958 bytes
- `react-vendor-*.js.gz`: 1,768 bytes
- `router-vendor-*.js.gz`: 16,141 bytes
- `icons-vendor-*.js.gz`: 4,345 bytes

## UPDATE 2026-05-10 (pass 2)

- Build verification after runtime/network optimizations passed.
- `index-*.js.gz`: 102.54 KB
- `index-*.css.gz`: 13.96 KB
- `TableMap-*.js.gz`: 2.34 KB
- Verification sequence: `guard:mojibake` -> `lint` (3 known admin warnings) -> `build`.

## UPDATE 2026-05-10 (pass 3)

- Second optimization pass completed (SW install-weight reduction, idle booking-chunk warmup, adaptive hero-video preload).
- `index-*.js.gz`: 102.70 KB
- `index-*.css.gz`: 13.96 KB
- `sw.js.gz`: 3.06 KB
- Verification sequence repeated: `guard:mojibake` -> `lint` (same 3 known admin warnings) -> `build`.

## UPDATE 2026-05-10 (pass 4)

- Plan-closure pass completed: CI pipeline, gzip budget gate, backend cache/header hardening, production runbook.
- `perf:budgets`: OK (`largest js.gz = 100.29 KB`, `largest css.gz = 13.63 KB`).
- Added reproducible budget command: `npm run perf:budgets`.
- Final verification: `guard:mojibake` -> `lint` (3 known admin warnings) -> `build` -> `perf:budgets` -> `node --check backend/src/index.js`.

## UPDATE 2026-05-10 (pass 5 — visual+tech)

- Premium visual uplift batch completed for bar cards / cloud copy accent / booking CTA style with no dependency changes.
- Input-path optimization: bar-card tilt now uses rAF-batched style updates.
- `perf:budgets`: OK (`largest js.gz = 100.30 KB`, `largest css.gz = 13.66 KB`).
- Verification sequence repeated: `guard:mojibake` -> `lint` (3 known admin warnings) -> `build` -> `perf:budgets`.

## UPDATE 2026-05-10 (pass 6 — next 5 improvements)

- Added FPS-adaptive ember density, AVIF-first hero poster fallback, long-task RUM telemetry, API `Server-Timing`, and low-tier/touch header hover-lightening.
- `perf:budgets`: OK (`largest js.gz = 100.58 KB`, `largest css.gz = 13.71 KB`).
- Verification sequence repeated: `guard:mojibake` -> `lint` (same 3 known admin warnings) -> `build` -> `perf:budgets` -> `node --check backend/src/index.js`.
