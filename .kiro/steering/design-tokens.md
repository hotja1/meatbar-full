---
inclusion: fileMatch
fileMatchPattern: '**/*.css,frontend/src/index.css'
---

# Design tokens — как расширять систему дизайна

Основа — W3C Design Tokens Community Group, Material Design tokens, Carbon Design System. Адаптировано под warm-ресторанный премиум «Мясо Бар».

## Что такое токен

Семантическая переменная, отражающая намерение, а не конкретное значение:

- **Плохо**: `color: #d81420` в компоненте.
- **Хорошо**: `color: var(--ember)` в компоненте + `--ember: #d81420` в `:root`.
- **Ещё лучше**: `color: var(--color-cta-primary)` + `--color-cta-primary: var(--ember)`.

Вторая обёртка важна, когда нужно поменять «CTA цвет» целиком, не трогая все места.

## Текущие токены (`frontend/src/index.css`)

### Палитра

```
--ember #d81420       огонь, CTA
--ember-soft #a30f17
--ember-dark #7f1014
--coal #120d0a        основной фон
--coal-soft #1d1510
--ash #3a332d
--cream #f6eee1       текст на тёмном
--muted #cbb9a6
--gold #e0a64b        акценты
--brass #c69a3e       линии, канты
--brass-soft #a8842a
--smoke #1f1612       карточки
--velvet #2c4a3c      hall 2
--leather #7a3f24     hall 1
--bone #efe7d7        бумага меню
--green #5ddd8a       статус «свободно»
--chalk #f1eee3
--wood-dark #181512
--wood-line rgba(255,255,255,0.045)
```

### Радиусы

```
--radius-xl 32px
--radius-lg 22px
```

### Тени

```
--shadow-fire 0 24px 80px rgba(216,20,32,0.24)
```

## Принципы добавления

### 1. Называй намерение, не цвет

- `--color-error` (OK) ← всегда ember или его вариация.
- `--color-red-500` (плохо) ← это не Tailwind.

### 2. Три уровня токенов

1. **Primitive tokens** — чистые значения: `--ember: #d81420`.
2. **Semantic tokens** — по смыслу: `--color-cta: var(--ember)`, `--color-text-primary: var(--cream)`.
3. **Component tokens** — локальные: `--booking-dialog-bg: var(--color-surface-elevated)`.

Сейчас в проекте в основном уровень 1 (primitive). Уровень 2 можно добавлять точечно, если начнёт масштабироваться.

### 3. Не плодить без нужды

Лимит: **максимум 25 цветовых токенов в `:root`**. Сейчас ~20 — запас есть, но не растрачивать.

Если появляется желание добавить новый цвет → сначала подумай, подойдёт ли существующий с другой opacity.

## Шрифтовые токены (рекомендуется добавить со временем)

```
--font-display: 'Playfair Display', serif;
--font-body: Inter, ui-sans-serif, system-ui, sans-serif;

--text-xs: clamp(0.75rem, 0.73rem + 0.1vw, 0.825rem);
--text-sm: clamp(0.875rem, 0.83rem + 0.22vw, 1rem);
--text-base: clamp(1rem, 0.95rem + 0.24vw, 1.125rem);
--text-lg: clamp(1.125rem, 1.06rem + 0.32vw, 1.3125rem);
--text-xl: clamp(1.3125rem, 1.22rem + 0.47vw, 1.625rem);
--text-2xl: clamp(1.625rem, 1.47rem + 0.75vw, 2rem);
--text-3xl: clamp(2rem, 1.78rem + 1.1vw, 2.625rem);
--text-4xl: clamp(2.625rem, 2.25rem + 1.9vw, 3.875rem);
--text-5xl: clamp(3.25rem, 2.68rem + 2.9vw, 5.625rem);

--leading-tight: 1.05;
--leading-snug: 1.3;
--leading-normal: 1.55;
```

Добавлять только когда это даст видимую экономию (повторение `clamp()` в 10+ местах).

## Spacing (рекомендуется)

```
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 144px;
```

8-pt сетка. Позволяет унифицировать `padding` / `margin` / `gap` везде.

## Motion-токены

```
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
--duration-fast: 180ms;
--duration-normal: 280ms;
--duration-slow: 420ms;
```

Использовать вместо повторения `cubic-bezier(0.22, 1, 0.36, 1)` в каждом селекторе.

## Опасные паттерны

### 1. Токен с magic-number в имени

```css
/* плохо — после первого редизайна имя врёт */
--gap-16: 16px;

/* лучше */
--space-4: 16px; /* семантика «step 4 по 4px-сетке» */
```

### 2. Конкретный цвет в компонентном CSS

```css
/* плохо */
.dish-card { background: #1f1612; }

/* хорошо */
.dish-card { background: var(--smoke); }
```

### 3. Дублирование rgba-версий

```css
/* плохо */
.a { background: rgba(10, 7, 5, 0.62); }
.b { background: rgba(10, 7, 5, 0.68); }
.c { background: rgba(10, 7, 5, 0.42); }

/* лучше — токен прозрачности */
--surface-overlay-weak: rgba(10, 7, 5, 0.42);
--surface-overlay: rgba(10, 7, 5, 0.62);
--surface-overlay-strong: rgba(10, 7, 5, 0.82);
```

## Совместимость с `data-perf`

Токены можно переопределять по тиерам:

```css
:root[data-perf='low'] {
  --shadow-fire: 0 8px 16px rgba(216, 20, 32, 0.18);
}
```

Это даёт единую точку для деградации без изменения компонентных селекторов.

## Валидация

- Один токен — одна тема (один bg, одна acc-окраска). Не смешивать пережить `--primary` для бордера и фона.
- Контрастная пара: если `--color-text-X` используется на `--color-bg-X`, проверить ≥ 4.5:1 (WCAG AA).
- После добавления токена прогнать `perf:budgets` — CSS.gz не должен прыгнуть из-за `:root { ... }` распухания.

## Когда переходить на Tailwind / CSS modules / CSS-in-JS

Не переходим. Текущие CSS-переменные + компонентные файлы покрывают проект без лишних зависимостей. Tailwind не подключаем: `PRAVILA.md` — зависимости только по согласию.

## Что вне scope токенов

- Иконки — inline SVG, токенами не описываются.
- Фоны из ассетов (`cloud-hero.webp`) — через обычный `url()`.
- Анимации keyframes — через `@keyframes`, не токенами.
