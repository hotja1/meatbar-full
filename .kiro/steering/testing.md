---
inclusion: manual
---

# Testing patterns — когда добавим тесты

Сейчас в проекте тестов нет (исторически). Этот файл подключать через `#testing` когда решим их добавить. Рекомендованный стек — Vitest (unit) + Playwright (E2E). Оба — стандарт для Vite-SPA 2025+.

**До этого момента никакие зависимости не ставим.** Правила `PRAVILA.md` — не добавлять пакеты без согласия.

## Что тестируем, что нет

### Тестируем

- **Утилиты / lib**: `frontend/src/lib/*` — чистые функции (`perfTier.ts`, `imageSources.ts`, `api.ts`).
- **Критичные компоненты**: `BookingDialog`, `TableMap` (выбор стола, статусы), `CartDrawer` (добавление, счётчик).
- **Хуки**: `useRealtimeTables`, `useParallaxPhotos`, `useSubtitleReveal`.
- **Backend-роуты**: `/api/bookings`, `/api/orders`, `/api/menu` — happy path + edge cases.
- **E2E-потоки**: бронирование столика, оформление заказа, логин в админке.

### Не тестируем

- Canvas-анимации (FireText, EmberField, DriftingClouds) — визуальная проверка глазами.
- CSS — визуальная проверка глазами + Lighthouse.
- Сетка столов в SVG (`Hall1`, `Hall2`) — визуальная.

## Стек

### Vitest (unit + component)

- Интегрирован с Vite из коробки, быстрее Jest.
- Совместим с React Testing Library.
- `vitest run` — одноразовый прогон для CI.
- Не использовать watch-режим в наших command-процессах (блокирует терминал).

### Playwright (E2E)

- Тестирует в реальных Chrome/Firefox/Safari.
- Встроенный headless-режим для CI.
- Screenshot-тесты (опц.) для визуальных регрессий.

### Что НЕ используем

- Jest — заменён Vitest (быстрее и под Vite).
- Cypress — Playwright современнее, кросс-браузер, параллельный.
- Enzyme — устарел, под React 19 не работает.

## Структура

```
frontend/
├─ src/
│  ├─ lib/
│  │  ├─ api.ts
│  │  └─ api.test.ts          ← рядом с кодом
│  └─ components/
│     ├─ BookingDialog.tsx
│     └─ BookingDialog.test.tsx
├─ e2e/
│  ├─ booking.spec.ts
│  ├─ order.spec.ts
│  └─ admin-login.spec.ts
├─ vitest.config.ts
└─ playwright.config.ts
```

## Vitest: unit

```ts
// src/lib/imageSources.test.ts
import { describe, expect, it } from 'vitest'
import { toAvif, toSmWebp, isWebp } from './imageSources'

describe('imageSources', () => {
  it('toAvif заменяет .webp на .avif', () => {
    expect(toAvif('/assets/foo.webp')).toBe('/assets/foo.avif')
  })

  it('toSmWebp добавляет -sm перед расширением', () => {
    expect(toSmWebp('/assets/foo.webp')).toBe('/assets/foo-sm.webp')
  })

  it('isWebp возвращает true только для .webp', () => {
    expect(isWebp('/x.webp')).toBe(true)
    expect(isWebp('/x.avif')).toBe(false)
    expect(isWebp(null)).toBe(false)
    expect(isWebp(undefined)).toBe(false)
  })
})
```

## Vitest: компонент (React Testing Library)

```tsx
// src/components/CartDrawer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CartDrawer } from './CartDrawer'

describe('CartDrawer', () => {
  it('показывает пустое состояние при отсутствии товаров', () => {
    render(<CartDrawer open items={[]} onClose={vi.fn()} onCheckout={vi.fn()} />)
    expect(screen.getByText(/Корзина пуста/i)).toBeInTheDocument()
  })

  it('вызывает onCheckout при клике по кнопке', () => {
    const onCheckout = vi.fn()
    render(
      <CartDrawer
        open
        items={[{ id: 1, title: 'Рибай', price: 1950, quantity: 1 }]}
        onClose={vi.fn()}
        onCheckout={onCheckout}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Оформить/i }))
    expect(onCheckout).toHaveBeenCalledTimes(1)
  })
})
```

## Playwright: E2E

```ts
// e2e/booking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Бронирование столика', () => {
  test('happy path: выбор стола и отправка формы', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /Бронь/i }).click()
    await expect(page.locator('#booking')).toBeInViewport()

    // Выбор стола
    const table = page.locator('.table-point').first()
    await table.click()
    await expect(page.locator('.booking-dialog')).toBeVisible()

    // Заполнить форму
    await page.getByLabel('Имя').fill('Тест')
    await page.getByLabel('Телефон').fill('+7 912 000 00 00')
    await page.getByLabel('Дата').fill('2026-06-15')
    await page.getByLabel('Время').fill('19:00')
    await page.getByLabel('Гостей').fill('2')

    await page.getByRole('button', { name: /Подтвердить/i }).click()
    await expect(page.getByText(/Ваша заявка отправлена/i)).toBeVisible()
  })

  test('offline: заявка встаёт в очередь', async ({ context, page }) => {
    await page.goto('/')
    await context.setOffline(true)
    // ... заполнить и отправить
    await expect(page.getByText(/Отправим когда появится сеть/i)).toBeVisible()
  })
})
```

## Backend-тесты (Node native test runner)

Если не хочется тянуть ещё один test-runner для бэка — использовать встроенный `node:test` (Node 20+).

```js
// backend/src/routes/public.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRobotsTxt } from '../seo.js'

test('buildRobotsTxt включает Host директиву', () => {
  const txt = buildRobotsTxt({ siteUrl: 'https://example.com', cleanParams: 'utm' })
  assert.ok(txt.includes('Host: example.com'))
  assert.ok(txt.includes('Sitemap: https://example.com/sitemap.xml'))
})
```

## Что важно

- **Детерминированность**: никаких `Math.random()` без seed, никаких реальных Date в тестах — использовать `vi.setSystemTime()`.
- **Изоляция**: каждый тест — свой render / свой mock. Нет общего state между тестами.
- **Скорость**: unit-тест < 50 ms, E2E-тест < 10 s.
- **Реалистичность**: E2E через настоящий backend-процесс, не через моки.
- **CI**: запускать тесты в GitHub Actions — один job для unit, другой для E2E.

## Когда добавлять тест

- Новая бизнес-логика (не UI-мелочи) → unit-тест.
- Баг найден → сначала тест, воспроизводящий баг, потом фикс.
- Критичный пользовательский поток (бронь, заказ, логин) → E2E.
- Переделка архитектуры → unit-тесты страхуют refactor.

## Что в CI

Предложенный порядок в `.github/workflows/ci.yml`:

```
guard:mojibake → lint → test:unit → build → perf:budgets → test:e2e
```

E2E тяжелее, поэтому после build. Если unit падает — не гонять e2e.

## Coverage

- Не цель. 100% coverage ничего не гарантирует.
- Реалистично: 70–80% на `lib/*` и `routes/*`, критичные компоненты.
- Отчёт — только локально, не блокируем CI на проценте.

## Анти-паттерны

- Тест, проверяющий внутренности компонента (`expect(component.state.foo).toBe(...)`) — хрупкий.
- E2E, который зависит от внешних интеграций (YooKassa, SMS) — ненадёжно, моки/sandbox.
- Тест с `setTimeout(done, 1000)` — заменить на реальный `await waitFor(...)`.
- Скриншот-диффы без фиксированных шрифтов — ложные срабатывания.
