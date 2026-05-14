---
inclusion: always
---

# Визуальный язык «Мясо Бар»

## Принцип

Тёплый ресторанный премиум уровня Smith & Wollensky / Carbone / COMA Berlin / Ad Astra Helsinki / A.O.C. London. Смысл «выглядит дорого» — это типографика, свет, тени, паузы, а не анимация и яркость. Референсы — в `PLAN-2-PREMIUM-VISUAL-DESIGN.md`.

## Палитра (CSS-переменные)

```
--ember #d81420    — огонь, CTA, акценты
--ember-soft #a30f17 — ember hover
--ember-dark #7f1014
--coal #120d0a     — основной фон
--coal-soft #1d1510
--ash #3a332d
--cream #f6eee1    — основной текст на тёмном
--muted #cbb9a6
--gold #e0a64b     — акценты заголовков
--brass #c69a3e    — линии, канты, медальки (новое)
--brass-soft #a8842a
--smoke #1f1612    — глубокий фон карточек
--velvet #2c4a3c   — Hall 2 банкетки
--leather #7a3f24  — Hall 1 стулья
--bone #efe7d7     — бумажный тон меню
--green #5ddd8a    — статус «свободно»
```

Три акцентных цвета одновременно — максимум. Hover — не смена hue, а +5–10% яркости через `filter: brightness(1.06)`.

## Запрещённые цвета

- Синий, cyan, neon-green, пастель, холодные акценты.
- Белые фон-блоки больше 50% экрана.
- Чистый чёрный `#000` (использовать `--coal`).

## Типографика

- Заголовки: серифный display (в проекте — `FireText` на serif-шрифте).
- Тело: гуманистический sans (Inter / system-ui fallback).
- H1 `clamp(2.4rem, 6vw, 5.6rem)`, H2 `fluid-5xl`, H3 `fluid-3xl`.
- `letter-spacing` для caps: +0.06em для sans, -0.01em для serif.
- `line-height` — 1.55 для текста, 1.05 для заголовков.
- Русская типографика: `word-break: keep-all; hyphens: none` — защита от разрыва кириллицы.
- `font-feature-settings: "kern", "liga", "calt", "locl"` — нужно только в hero/заголовках.
- `text-rendering: optimizeLegibility` — только на hero/H1/H2, не глобально.

## Сетка и воздух

- Секция padding: `clamp(64px, 9vw, 144px)` сверху/снизу.
- Между блоками: `clamp(24px, 4vw, 56px)`.
- Максимальная ширина контейнера: `1280px`.
- 12-колонная CSS Grid. Асимметрия приветствуется (H1 в 7 колонок, фото в 5).
- Между eyebrow и H1 в hero — минимум 80 px воздуха.

## Материалы (CSS-only)

- **Бронза/латунь**: 5-стоп линейный градиент + `mix-blend-mode: screen`. Тонкие линии 1–2 px: канты кнопок, разделители.
- **Кожа**: тёмный фон + `radial-gradient` + очень тонкий SVG-шум.
- **Дерево**: `chevronWall`, `parquet` паттерны уже в проекте.
- **Стекло**: `backdrop-filter: blur(10px) saturate(120%)` — только шапка и модалки, иначе падает FPS на iOS. На `data-perf='low'` отключаем.
- **Бумага (меню)**: `--bone` фон + двойной `border` 1px/0.5px.

## Заморозки Phase 13 (не возвращать)

- Огоньки над столами.
- Spotlight-подсветка выбранного.
- Pulse-анимация статуса.
- Heatmap популярности.
- Dim соседей (можно оставить лёгкий, но без glow).
- Зум карты залов.

## Движение и анимация

- Длительность 180–360 ms. Дольше — только hero-вход.
- Easing `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint).
- Hover CTA: `scale(0.97)` 90 ms → `scale(1.02)` 180 ms → 1.
- Scroll-in: через `IntersectionObserver` + класс `.is-in-view`, `opacity 0→1 + translateY 24→0` за 320 ms.
- Все анимации имеют ветку `@media (prefers-reduced-motion: reduce)`.

## Иконки

- Только SVG, тонкая линия 1.5 px, скруглённые концы, `currentColor`.
- 24 px стандарт.
- Импорт через deep-path: `lucide-react/dist/esm/icons/phone` — иначе барел.
- Никаких emoji. Никаких icon-font-библиотек.

## Изображения

- Везде WebP, для hero/gallery/dish — AVIF как first source, WebP как fallback, PNG только для cloud-hero legacy.
- `<picture>` с `media`-гейтами: `(max-width: 768px)` → `-sm` вариант, иначе полноразмер.
- Жёсткие `width`/`height` атрибуты на каждой картинке → CLS = 0.
- `loading="lazy" decoding="async"` везде ниже фолда.
- `fetchpriority="high"` — только LCP-картинка (логотип + hero-poster).
- Не коммитить JPG/PNG (кроме `cloud-hero.png` legacy fallback).

## Фокус и a11y

- Кастомный focus: `outline: 2px solid var(--brass)`, `outline-offset: 3px`.
- Контраст текста ≥ 4.5:1 (WCAG AA).
- Интерактивы ≥ 44×44 px на мобильном.
- Ошибки форм — серьёзным шрифтом ember, без восклицательных знаков/emoji.

## Когда просят «сделать красиво»

Сначала — типографика и воздух. Потом — свет и тени. Только потом — микроанимация. Это порядок.
