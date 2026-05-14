---
inclusion: always
---

# Бюджеты производительности

Все цифры проверяются автоматически через `frontend/scripts/check-budgets.mjs` (команда `npm --prefix frontend run perf:budgets`). При регрессии сборка падает в CI.

## Бандл (gzip)

| Артефакт        | Лимит   | Текущее (2026-05-11) |
| --------------- | ------- | -------------------- |
| `index-*.js.gz` | ≤ 103 KB | 101.89 KB            |
| `index-*.css.gz`| ≤ 14.10 KB | 13.88 KB           |

Vendor-чанки (react, router, icons) отдельно — изменения в приложении не инвалидируют их кэш.

## Web Vitals (цели на проде)

| Метрика | Цель p75 |
| ------- | -------- |
| LCP     | < 1.8 s  |
| INP     | < 200 ms |
| CLS     | < 0.05   |
| TTFB    | < 800 ms |

Собираются через `web-vitals` v4 + `PerformanceObserver('longtask')`, отправляются на `/api/rum` (таблица `rum_events` в SQLite).

## Runtime-бюджеты

- Любой frame движения анимации ≤ 4 ms на iPhone 11 класса.
- Paint-события при скролле ≤ 6 ms.
- Композитные слои одновременно ≤ 12.
- `box-shadow` с большим blur на скролле — избегать, особенно на `data-perf='low'`.

## data-perf тиеры

Атрибут ставится на `<html>` через `frontend/src/lib/perfTier.ts`:

- `low` — `prefers-reduced-motion`, `save-data`, iOS ≤ 15, `hardwareConcurrency ≤ 4` на мобильном.
- `mid` — обычный мобильный.
- `high` — десктоп.

Правила CSS должны учитывать тиер:

- `data-perf='low'` → без `backdrop-filter`, без тяжёлых `box-shadow`, без `filter: blur` на скролле.
- `data-perf='low'` → canvas-эффекты становятся still-frame.
- На `prefers-reduced-motion: reduce` — анимация отключается полностью.

## Правила перед добавлением любой новой визуальной фичи

1. Двигается через `transform`/`opacity`/`filter`, не через `top/left`.
2. Есть ветка для `prefers-reduced-motion`.
3. Используется `IntersectionObserver` для паузы вне viewport.
4. Не добавляет больше +1 KB gzip JS.
5. Не создаёт новых `box-shadow` render-стеков на скролле.
6. Проходит `perf:budgets` без регрессии.

## Проверять до релиза

- `frontend/scripts/check-budgets.mjs` — авто.
- Локальный Lighthouse Mobile (форма-фактор: мобильный).
- DevTools → Performance → запись скролла главной страницы.
- Проверить, что cloud-hero photo 100% чёткое на плато (без остаточного blur).
- Проверить, что `prefers-reduced-motion: reduce` отключает весь motion.

## Частая причина регрессии

- Новая иконка из `lucide-react` без deep-import → барел, +N KB.
- Новое фото без `-sm` варианта → мобильный качает десктопное.
- Новый `box-shadow` с `blur > 40px` → paint-пик на скролле.
- Забыли `loading="lazy"` на ниже-фолд картинке.
- Добавили зависимость — ломает manualChunks.
