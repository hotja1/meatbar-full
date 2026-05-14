---
inclusion: fileMatch
fileMatchPattern: '**/*.css'
---

# CSS-паттерны проекта

Основа — рекомендации Chrome Team (web.dev), MDN, Josh W. Comeau. Адаптировано под warm-премиум стиль и перф-бюджет.

## Правила, которые не нарушаются

- `word-break: keep-all; hyphens: none` — на всех `h1-h6, p, li, dd, span`.
- Движение — через `transform`/`opacity`/`filter`. Никогда через `top`/`left` на скролле.
- Все анимации имеют `@media (prefers-reduced-motion: reduce)` ветку.
- `data-perf='low'` отключает `backdrop-filter`, тяжёлые `box-shadow`, `filter: blur` на скролле.
- `content-visibility: auto; contain-intrinsic-size: 1000px` на офскрин-секциях — уже глобально в `index.css`.
- CloudHero и hero-секции исключены из `content-visibility` (`content-visibility: visible`).

## Цветовые переменные

Читать из `:root` в `index.css`. Не хардкодить hex в компонентных CSS, если есть переменная:

```css
/* правильно */
color: var(--cream);
background: rgba(10, 7, 5, 0.68);

/* нет */
color: #f6eee1;
```

## Тени (box-shadow)

- Большие `box-shadow` с `blur > 40px` — только на fixed-элементах (шапка, модалки), не на элементах списка на скролле.
- Для premium-глубины — один мягкий `box-shadow` + тонкий внутренний `inset`.
- На `data-perf='low'` упрощаем через override:
  ```css
  :root[data-perf='low'] .dish-card {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.22);
  }
  ```

## Backdrop-filter

- Дорогой фильтр, GPU-уже выигрывает только в шапке/модалке.
- На iOS ≤ 15 — часто глючит. `data-perf='low'` отключает.
- `-webkit-backdrop-filter` обязательно для старого Safari.

## Layout

- CSS Grid для секций: 12 колонок, gap через `clamp()`.
- Flex для локальных рядов (нав, карточка).
- `aspect-ratio` вместо padding-hack.
- Max-width контейнера `1280px`.
- Секция: `padding-block: clamp(64px, 9vw, 144px)`.

## Перформанс-хинты

- `will-change: transform, opacity` — **точечно**, только на элемент, который реально анимируется. Не использовать `will-change: auto` и не на сотнях элементов.
- `contain: layout paint style` — на независимых карточках, списках, tooltip-ах. Помогает браузеру изолировать re-layout.
- `translateZ(0)` для GPU-промоушена — использовать только если измерил выигрыш.

## Responsive

- Mobile-first: базовые стили без media query, затем `@media (min-width: 768px)` для планшета, `1024px` для десктопа.
- Breakpoints:
  - `480px` — маленький мобильный.
  - `768px` — граница мобильного/планшета.
  - `1024px` — десктоп.
  - `1280px` — large desktop.
- Fluid typography через `clamp()`.

## Рандомные антипаттерны

- `position: fixed` с `backdrop-filter` — на `body::before` или похожих overlay. Дорого.
- `@keyframes` с анимацией `width/height` — layout thrash, использовать `transform: scale()`.
- `background-attachment: fixed` на мобильном — отключено глобально, не возвращать.
- `outline: none` без замены `:focus-visible`.
- Переопределение `* { transition: ... }` — ломает всё, никогда.

## Формат файлов

- Один компонент — один CSS-файл.
- BEM-подобные имена: `.booking-dialog__close`, `.table-point--selected`.
- Не использовать `!important`, кроме override `data-perf='low'` (документировано).

## Purge и размер

Бюджет `index.css.gz ≤ 14 KB`. При приближении:

- Удалить неиспользуемые селекторы (аккуратно, визуальный diff).
- Разбить `App.css` на компонентные файлы.
- Вынести редко используемые стили (pwa-prompt, ambient-audio) в lazy-chunks.

Смотри `planopt.md` C13.
