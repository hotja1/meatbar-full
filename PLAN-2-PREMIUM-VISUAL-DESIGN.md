# План №2 — Премиум-визуал «Мясо Бар» без потери производительности

> Документ описывает **только план** (без кода). Цель —
> поднять визуальную планку сайта до уровня премиум-ресторанов
> (Smith&Wollensky, Pera Soho, COMA Berlin, Ad Astra Helsinki,
> Asador El Capricho, A.O.C. London) **без** потери TTI/FPS,
> без отказа от SPA-Vite-стека и без heavy-animation библиотек.

Базовый рабочий принцип: **«всё, что выглядит дорого — это типографика,
свет, тени, паузы, тишина»**. Не движение ради движения.

---

## 0. Принципы (для всех изменений ниже)

1. **Типографика > эффекты.** Серьёзная сериф-вывеска, ровный
   ритм межстрочки, бронзовые/золотые акценты вместо неона.
2. **Свет, а не цвет.** Малые источники света (свечи, бра,
   лампы) важнее ярких пятен. Везде «warm-only»: ember,
   cream, gold, deep coal. Никаких generic-blue / neon-green.
3. **60 fps на iPhone 11.** Любой эффект должен идти через
   `transform`, `opacity`, `filter` (не `top`/`left`).
   `will-change` строго точечно.
4. **Тишина = премиум.** На каждой секции есть «пустое» поле
   (≥ 25 % высоты). Не забивать всё контентом.
5. **Каждый микро-вход — событие.** Hover, focus, scroll-in
   прорабатываются как театральная сцена: 200–400 мс,
   `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint).
6. **Респект к `prefers-reduced-motion`.** Все анимации
   немедленно отключаются — это и a11y, и проверочные
   реcурсы Apple/Google.
7. **Никакой framer-motion / GSAP / three.js / anime.js**
   (запрещено `AI_GUIDE.md`). Всё — CSS + крошечный
   `IntersectionObserver` runtime.

---

## 1. Типографика

### 1.1 Парная гарнитура
- **Заголовки**: классика премиум-стейкхауса —
  *Playfair Display Black*, *GT Super Display*, *PP Editorial New*,
  или собственный «Meatbar Display» (выкуп лицензии у Pangram Pangram /
  Display Foundry / ParaType — последний даёт кириллицу).
  Подчеркнуть **высокий контраст штриха** (не sans-serif).
- **Основной текст**: гуманистический sans с большой кириллицей —
  *Inter Display*, *PT Root UI*, *Manrope*, *Onest*.
  Х-height ≥ 0.55em — читаемо на мобильном.
- **Акценты / меню**: слегка condensed *Bebas Neue* или
  *Druk Cyr* — для заголовков блюд («Рибай 350 г»).

### 1.2 Ритм
- 8-тактная сетка `--type-step: clamp(0.875rem, 0.83rem + 0.22vw, 1rem)`.
- Заголовки: H1 `--fluid-7xl` (`clamp(2.4rem, 6vw, 5.6rem)`),
  H2 `--fluid-5xl`, H3 `--fluid-3xl`.
- `letter-spacing` для всех caps-надписей (-0.01em для serif,
  +0.06em для caps-sans).
- `line-height` для текста — 1.55, для заголовков — 1.05.
- В кириллице: `font-feature-settings: "kern", "liga", "calt", "locl"`.

### 1.3 Эффекты «дорогой набор»
- **Drop cap** на первой букве описания зала — серифом, в
  бронзовом цвете, `float: left`, `font-size: 5em`. Очень
  старо-стейкхаусный приём.
- **Wide-letter caps** в подзаголовках (например «БАР · ГРИЛЬ ·
  МЕНЮ») с тонким золотым `border-bottom` шириной 1 px на
  градиенте.
- **Гилёш-стиль номера** — рядом с большим H1 ставится
  тонкая римская цифра (II, III) — отсылка к меню «Часть II».
- На мобильном понижать H1 на 1 ступень, сохранять воздух.

---

## 2. Цветовая палитра и материалы

### 2.1 Расширение палитры
Текущая (по AI_GUIDE.md): `--ember #d81420`, `--coal #120d0a`,
`--cream #f6eee1`, `--gold #e0a64b`, `--green #5ddd8a`.
Дополнить (только тёплые):

| Токен | HEX | Назначение |
|---|---|---|
| `--ember-soft` | `#a30f17` | Hover акцентов, глубже ember |
| `--brass` | `#c69a3e` | Канты, медальки, тонкие линии |
| `--brass-soft` | `#a8842a` | Внешние тени брасс |
| `--smoke` | `#1f1612` | Глубокий фон карточек |
| `--smoke-2` | `#2a1d18` | Альтернативный фон |
| `--velvet` | `#2c4a3c` | Велюр Hall 2 (банкетки, шторы) |
| `--leather` | `#7a3f24` | Кожа Hall 1 (стулья) |
| `--bone` | `#efe7d7` | Бумажный тон (карточки, меню) |
| `--ember-glow` | `rgba(216,20,32,0.18)` | Полупрозрачные подсветки |

### 2.2 Материалы (CSS-only)
- **Бронза/латунь**: линейные градиенты с 5 стопами +
  `mix-blend-mode: screen` поверх тёплого фона. Применять
  тонкими линиями (1–2 px) — рамки кнопок, разделители,
  цифры таблицы цен.
- **Кожа**: `radial-gradient` с шумом из тонкой `data-uri`
  SVG-турбуленции (≤ 1 KB, кэшируется), наложенный на
  тёмный фон.
- **Дерево**: уже есть `chevronWall` / `parquet`. Добавить
  второй паттерн «олд-ок» для стен hero.
- **Стекло**: `backdrop-filter: blur(10px) saturate(120%)` —
  только в шапке и модалках, иначе FPS падает на iOS.
- **Мрамор**: текстура для футера / счётчика мест — узкая
  полоска 24 px высотой, тонкий мраморный SVG.

### 2.3 «Премиум-цветовые правила»
- Никогда не более 3 акцентных цветов одновременно на экране.
- Любой ember-акцент в хедере/CTA дублируется тоном
  `brass` или `cream`, чтобы не было «кричащего» красного.
- Hover не меняет цвет резко: только +5–10 % яркости через
  `filter: brightness(1.06)`, никаких новых hue.

---

## 3. Слой воздуха и сетки

### 3.1 Воздух
- Базовый padding секций: `clamp(64px, 9vw, 144px)` сверху/снизу.
- Между блоками внутри секции: `clamp(24px, 4vw, 56px)`.
- Container: `--max-content: 1280px`, gutter `clamp(16px, 4vw, 56px)`.

### 3.2 Сетки
- **12-колонная сетка** для всех секций (CSS Grid, не flex).
- **Asymmetric layouts**: на больших экранах H1 в 7 колонок,
  фото в 5; описание в 4 колонки, изображение — `aspect-ratio:
  4/5` справа в 8.
- На мобильном — одна колонка, но фоторазмер = 16/9 + текст
  под фото с offset −24 px (slight overlap, как в журналах).

### 3.3 Микропаузы
- В hero — слот тишины ≥ 80 px между sub-eyebrow и H1.
- В меню — между категориями ≥ 64 px.
- В отзывах — между кавычкой и именем ≥ 32 px.

---

## 4. Hero-секция (CloudHero)

> AI_GUIDE.md: «Don't touch CloudHero photo/blur/scale or sequence
> timings without explicit permission». План ниже описывает
> **только** добавления и микро-полировку, которые активируются
> при ручном включении флага в `OurRoom.css` / `App.css`. Код менять
> не нужно для этого плана.

- Подменить блюр-маску на `mask-image: radial-gradient`,
  чтобы по краям блюр гасил картинку мягче.
- Под H1 добавить тонкую `--brass`-полоску 1×60 px (key line)
  как в Vogue/Robb Report.
- Заменить плотный CTA на «outline + brass corner» —
  рамка тонкая, углы со скошенными бронзовыми засечками.
- Метафора «угольки» в фоне: 5–8 SVG-частиц `<circle r=".5"
  fill="rgba(216,20,32,0.55)">` с чистой `transform`-анимацией
  (`translate3d`, без top/left). На `prefers-reduced-motion: reduce`
  остаются статикой.
- На скролле hero полупрозрачно «уезжает» вверх с `clip-path`
  inset (как у Apple) — `transform: translateY(calc(var(--scroll) * -10vh))`.

---

## 5. Карточки блюд (BarMenuSection)

### 5.1 Контейнер
- Сейчас карточки полу-плоские. Сделать «бумажный листок меню»:
  бежевый `--bone` фон, тонкая бронзовая double-border (внешняя 1 px,
  внутренний отступ 4 px, ещё 0.5 px линия). Имитация типографского
  блока.
- На hover карточка **поднимается на 2 px**, тень растёт
  `0 18px 38px -12px rgba(0,0,0,0.5)`. Без размытия фото.
- Фотография в `clip-path: inset(0 round 6px)` с лёгкой
  виньеткой по краям (vignette через `radial-gradient` mask).

### 5.2 Цена
- Цены в формате «Рибай ····· 1 950 ₽» (типичный леттер-меню).
  Точки — `border-bottom: 1px dotted var(--brass-soft)`,
  flex-grow между названием и ценой. Никаких квадратных
  плашек.
- Знак «₽» через `font-feature-settings: "rubl"` или unicode `₽`.

### 5.3 Бейджи
- Отдельный slot «авторская», «острое», «новинка» — маленький
  pill, золотой текст на тёмно-коричневом фоне, `letter-spacing:
  0.12em`, uppercase, 11 px.
- Иконка (огонёк, перчик) — SVG inline, не emoji.

---

## 6. Booking / TableMap (Phase 13 уже база)

### 6.1 «Поверхность»
- Paper-look для подложки SVG: тонкий шум (data-uri) +
  тёплый ember-tint в углах.
- Окантовка SVG — двойная бронзовая рамка с теневыми
  засечками в углах (как герб ресторана).

### 6.2 Подсветка дня/вечера (уже есть переключатель)
- Усилить разницу: вечером — тёплый orange wash + слабая
  vignette. Днём — холоднее, более прозрачный.
- В режиме «вечер» лампы получают мягкую Z-подсветку:
  `radial-gradient` с opacity 0.25, только под `<PendantLamp>`.

### 6.3 Карточка стола (тултип)
- Заменить «прямоугольный пузырь» на **кафе-карточку**:
  бронзовая верхняя полоса 4 px, заголовок — серифом,
  ниже параметры, в правом углу — миниатюра фото стола.
  Pop-in 180 мс, `cubic-bezier(0.22, 1, 0.36, 1)`.

### 6.4 BookingDialog
- Левая колонка — фото стола в крупном плане + название зоны
  + 3 строки описания.
- Правая колонка — форма. Поля «дата / время / гости» —
  через `details/summary` с тонкой бронзовой иконкой и
  плавным `max-height` раскрытием.
- Кнопка «Подтвердить» — outline бронзовая → на hover
  заполняется ember изнутри (`background-position`
  на градиенте, чистый CSS, 200 мс).

### 6.5 Стол выбран
- Светлый «галочка» из бронзы поверх стола (без
  drop-shadow, иначе вернёмся к огонькам, которые мы убрали).
- Соседи стола получают subtle dim (opacity 0.6) — это уже
  есть в коде, оставить.

---

## 7. Галерея и фото

### 7.1 Маска и кадрирование
- Все hero-фото (зал, мясо, гриль) кадрировать в `aspect-ratio:
  3/4` для портретных и `aspect-ratio: 21/9` для
  ландшафтных героев. Никаких 16/9-«видеомонтажных» фото.
- На каждое фото добавить `filter: contrast(1.05) saturate(1.05)`
  — тёплая ресторанная подача. На мобильном чуть слабее.

### 7.2 Lightbox
- При клике — на полный экран `<dialog>` с
  `backdrop: rgba(15,10,8,0.92)`, плавный 300 мс fade,
  крупный `<picture>` с лучшим качеством.
- Стрелки навигации — тонкие бронзовые шевроны 24 px,
  `position: absolute`, hover-сдвиг на 4 px.

### 7.3 Marquee / лента
- Горизонтальная лента «Подача дня» с фото блюд:
  CSS-only `@keyframes` (translate3d), пауза на hover.
- В `prefers-reduced-motion: reduce` — статичная.
- Контент лимитирован 8 карточками, чтобы не нагружать DOM.

---

## 8. Микро-анимации

### 8.1 Принципы
- Длительность 180–360 мс. Дольше — только для hero-входа.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-quint) —
  «дорогой» отскок без перестрела.
- Любая анимация должна **что-то сообщить**: появление,
  выбор, изменение состояния. Декоративных «качаний» нет.

### 8.2 Конкретные кейсы
- **Сlick CTA**: `transform: scale(0.97)` 90 мс →
  `scale(1.02)` 180 мс → 1.
- **Hover ссылок**: `text-decoration: underline` через
  `background-image: linear-gradient(currentColor)` с
  `background-size: 0% 1px` → 100 % за 200 мс. Никаких
  shake/wobble.
- **Скролл-входы**: `IntersectionObserver` (одной строкой
  in-app helper, без внешних либ) ставит классу `.is-in-view`
  → opacity 0 → 1 + translateY 24 → 0 за 320 мс.
- **Цифры (35 столов / 122 места)**: count-up при попадании
  в viewport — чистый `requestAnimationFrame`, ≤ 1 KB кода.

### 8.3 Hero-cinematic
- При первом visit hero делает один-короткий цикл:
  - 0 ms: масштаб 1.04, blur 4 px;
  - 600 ms: blur 0, opacity текста 1;
  - 1200 ms: масштаб 1.0;
  - 2200 ms: появление CTA.
  Всё через ОДНУ анимацию `@keyframes`. Один RAF, ≤ 4 ms на кадр.
- На повторных визитах (sessionStorage flag) — без cinematic,
  сразу финальное состояние.

---

## 9. Иконография и иллюстрации

- Заменить все эмодзи (если есть) на **тонкие моно-line иконки**
  собственного набора 24 px. Стиль — линия 1.5 px, скруглённые
  концы, `currentColor`. Inline SVG, никаких icon-fonts.
- Большие декоративные SVG-иллюстрации:
  - бык в шевроне (логотип-марка),
  - открытое пламя гриля,
  - бутылка вина на бокале,
  - дровяной треугольник.
  Все — vector ≤ 4 KB каждая, кэшируются.
- Бумажный «штамп» — используется как разделитель секций
  (полупрозрачный SVG, 1 KB).

---

## 10. Шапка и нижняя навигация

### 10.1 Шапка
- Уменьшить высоту до 80 px на десктопе (сейчас 96 px) —
  больше воздуха. На мобильном остаётся 56 px.
- Логотип крупно слева, name-line справа от логотипа в одну
  строку с тонким брассом.
- Меню — caps + letter-spacing 0.18em + тонкая бронзовая
  «галочка» под активным разделом.
- При скролле:
  - opacity-фон с blur (saturate),
  - под шапкой тонкая бронзовая 1 px линия,
  - тень минимальная.
- CTA «Бронь» — outline ember, при hover заполняется ember.
  Кнопка остаётся видимой и читаемой.

### 10.2 Нижняя/мобильная панель
- Floating «Bottom Bar» на мобильном с двумя кнопками
  (Бронь, Доставка). 56 px высота, blur, brass border.
- Скрывается при скролле вверх, появляется при скролле вниз —
  чистый CSS `transform: translateY()` + переменная.

---

## 11. Футер

- 3 колонки: «Адрес/телефон», «Время работы», «Соцсети».
- Тонкая бронзовая разделительная линия 1 px по верху.
- Большой логотип «Мясо Бар» в виде эмблемы (бык + ель),
  серифом, опционально drop cap.
- Microcopy «© 2014—Today · Нижневартовск, Самотлорский район».
- Внизу — узкая полоска с тонкой типографикой:
  «Designed for premium dining». Это работает как «подпись».
- Кнопка вверх — тонкая стрелка в бронзовом круге, появляется
  после 800 px скролла.

---

## 12. Фокус-стили и a11y (часть премиума)

- Кастомный фокус: 2 px бронзовая обводка с offset 3 px,
  скругление наследуется. Чёткий, заметный.
- Контрасты ≥ AA (4.5:1 для текста). Серый на бежевом —
  проверять отдельно.
- Каждый интерактив имеет `role`, `aria-*`, и focus-visible.
- В формах — large hit zones (≥ 44 px высоты), большие лейблы.
- Сообщения об ошибках — серьёзным шрифтом ember,
  без восклицательных знаков и эмодзи.

---

## 13. Звук (опционально, off by default)

- Тихий «огонь в камине» (≤ 60 KB ogg) — кнопка-переключатель
  в шапке (icon-only). По умолчанию **выключен**, флаг сохраняется
  в `localStorage`.
- При hover на «огоньки» в меню — короткий «шорох» 50 мс
  (опционально, только на десктопе, off by default).
- Звук всегда mute если `prefers-reduced-motion: reduce`.

---

## 14. Пасхалки и микро-стиль

- На главной — крошечный «штамп шефа» в углу hero (SVG,
  3 KB). При наведении показывает подпись «Иван Петров,
  бренд-шеф».
- В CartDrawer — короткая запись «приготовим ровно как
  любите вы», как у MAGAZINEs.
- В footer — мини-плейс «Рекомендуем к стейку» — слот для
  3 вин с миниатюрными этикетками.
- В 404-странице — тёмная сцена «гриль остыл», тонкий
  ember-огонёк, кнопка «вернуться к столу».

---

## 15. Картинки в WebP/AVIF (продолжение Plan №1)

Для премиума критично:
- Hero фото — **минимум 2400×1600 webp + avif**, плотность
  90–92, без артефактов на jpeg-quality 80.
- Все «product shot» (мясо, бутылки, бар) — отдельный фото-сет
  с тёмным фоном и направленным светом. Заменять
  «случайные кадры» на отретушированные шеф-сеты.
- Везде использовать `<picture>` со source AVIF + WebP, один
  PNG fallback для совсем старых.
- Прелоадить только hero. Остальное — `loading="lazy"`.
 
✅ Реализовано (2026-05-09):
- добавлены AVIF-версии и подключение через `<picture>` для ключевых hero-ассетов (`cloud-hero` desktop+sm, `hero-poster`);
- добавлены AVIF для интерьерных фото (`our-interior`);
- `venue-photo-*` оставлены как секционные интерьерные фото (визуальная часть сохранена);
- добавлен build-step генерации AVIF (без потери качества в UI): `frontend/scripts/make-avif.mjs` (рекурсивно по `public/assets/**/*.webp`);
- фото блюд/галереи/столов и ключевые интерьерные блоки переведены на `<picture>` AVIF/WebP.
 
✅ Закрыто (обновлено 2026-05-10):
- PNG fallback реализован для cloud hero (`cloud-hero.png`, `cloud-hero-sm.png`) при сохранении приоритета AVIF/WebP.

---

## 16. Производительность как часть премиума

Эти правила действуют как фильтр: любая визуальная фича
проходит проверку на ↓:

| Бюджет | Лимит |
|---|---|
| LCP мобильный | < 1.8 s |
| INP мобильный | < 200 ms |
| CLS | < 0.05 |
| Total JS gzip | ≤ 100 KB |
| Total CSS gzip | ≤ 14 KB |
| Любой `transform`-frame | ≤ 4 ms на iPhone 11 |
| `paint` события на скролл | ≤ 6 ms |
| Композитные слои | ≤ 12 шт. одновременно |

Каждая новая фича в premium-плане должна:
- использовать `transform`/`opacity`/`filter` для движения,
- иметь `prefers-reduced-motion` ветвь,
- быть отключена по умолчанию или ленива (IntersectionObserver),
- не превышать +1 KB JS на каждую,
- не создавать новых `box-shadow` рендер-стеков на скролл.

✅ Реализовано (2026-05-09): добавлена «умная деградация без потери премиум-ощущения» для старых устройств:
- perf-tier (`data-perf='low'`) отключает дорогие фиксированные оверлеи и blur-стек;
- canvas-эффекты (облака/эмберы/огонь) на tier=low переходят в still-frame вместо постоянного rAF;
- hero-видео на tier=low/save-data заменяется на AVIF/WebP постер (качество визуала выше, чем stutter видео).
- убрано только общее body-фото-фон (мясо), секционные интерьерные фото сохранены.
- тяжёлая карта бронирования (`TableMap`) монтируется только рядом с секцией брони, чтобы не держать постоянную GPU/paint-нагрузку при скролле всей страницы.
- секционные интерьерные фото смягчены (тёмный overlay + пониженный контраст фона), чтобы визуал оставался premium, но не мешал чтению текста.
- бесконечный скролл-рейл галереи запускается только рядом с секцией и не тратит CPU/GPU вне viewport; на `perf-tier=low` отключается.
- переход «Бронь» синхронизирован во всех навигациях (включая SideNav/mobile), чтобы не было ухода в блок доставки при первом клике.
- стартовый JS-бюджет доведён до `index-*.js.gz ≈ 98.6 KB` через вынос данных меню/бара из main chunk;
- CSS-бюджет закрыт по артефакту сборки (`index-*.css.gz = 13,958 bytes`, цель `≤ 14 KB` достигнута).

---

## 17. Этапы внедрения

1. **Спринт A.** Типографика (раздел 1) + палитра (2) + воздух (3).
2. **Спринт B.** Hero (4), карточки меню (5), фокус-стили (12).
3. **Спринт C.** Booking-card v2 (6), галерея (7).
4. **Спринт D.** Микро-анимации (8), иконография (9).
5. **Спринт E.** Шапка / футер / 404 / пасхалки (10, 11, 14).
6. **Спринт F.** Премиум-фото пакет (15) + опциональный звук (13).
7. **Спринт G.** Финальный аудит:
   `lighthouse + Yandex Metrika RUM + Sentry + WebPageTest`.

Каждый спринт — отдельный PR, ≤ 600 LOC изменений, скриншоты
до/после в описании.

---

## 18. Анти-цели

- Не вводить framer-motion / GSAP / lottie / three.js / anime.js.
- Не ломать `word-break: keep-all; hyphens: none` (кириллица).
- Не уводить акцент в blue / neon / pastel — только warm-only.
- Не наращивать FPS-нагрузку через `box-shadow` на скролле.
- Не вводить full-page parallax-канвас (это убивает iOS-Safari).
- Не использовать «модные» 3D-карты столов — текущая SVG быстрее
  и ближе к реальному залу.
- Не превращать сайт в «портфолио агентства» — премиум здесь
  значит «дорогое спокойствие», не «дизайнер показал всё, что умеет».

---

## 19. Эталоны (на что смотреть, что НЕ копировать буквально)

- **Smith & Wollensky** — типографика, сериф, бронзовые акценты.
- **Pera Soho NYC** — фотография блюд с тёмного фона.
- **COMA Berlin** — паузы, тишина, ритм.
- **Asador El Capricho** — премиум-шеф-сеты, мысль про мясо.
- **Carbone NYC** — насыщенный warm-tone и винтажная типографика.
- **Ad Astra Helsinki** — современный premium без перегруза.
- **A.O.C. London** — booking-flow и календарь.
- **Robb Report / Vogue Russia** — paper-feel и сетка журнала.

Не копировать дословно, **синтезировать** (смешивать) стиль.

---

## 20. Метрики успеха визуала

| Метрика | Цель |
|---|---|
| Subjective heuristic (5 человек) | «выглядит как премиум-ресторан» — ≥ 4 из 5 |
| Lighthouse Best Practices | 100 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| LCP mobile | < 1.8 s |
| Time on page (Метрика) | +25 % vs baseline |
| Bounce rate | −15 % vs baseline |
| Conversion: открытие BookingDialog | +20 % vs baseline |
| Conversion: подтверждённая бронь | +15 % vs baseline |

---

## 21. Что **не** трогать (явные запреты)

- AI_GUIDE.md разделы 4 (Conventions), 5 (PWA), 6 (Common tasks).
- CloudHero таймминги без явного разрешения.
- Палитра тёплых тонов — не уходить в холодные.
- 35 столов / 122 места — структура зала.
- Огоньки/spotlight (мы их убрали в Phase 13 по запросу) — не возвращать.
- Зум на бронировании (мы его убрали в Phase 13) — не возвращать.
- Service Worker policy `/api/*` и `/socket.io/*` — никогда не кешируем.

---

## 22. Связь с Plan №1

Plan №1 — техническая база (производительность/SEO/безопасность).
Plan №2 — визуал поверх этой базы. Их можно и нужно
**внедрять параллельно**: каждое изменение визуала проходит через
бюджет производительности из Plan №1, и наоборот — оптимизация не
ухудшает визуал, а наоборот ускоряет его прорисовку (preload фото,
content-visibility, AVIF).

После завершения обоих планов у проекта будет:
- внешний вид уровня Robb Report / Smith&Wollensky,
- технические метрики уровня Vercel-best-practice,
- ru-локальный SEO (Яндекс топ-10, Google Maps, 2ГИС),
- безопасность уровня production (Helmet, CSP, rate-limit, бэкапы),
- стабильность и наблюдаемость (CI, Sentry, RUM, monitoring).
## UPDATE 2026-05-09

- [x] Table-booking visual switched to new hall images (`hall-1-layout.png`, `hall-2-lounge-layout.png`) with interactive overlays preserved.
- [x] Added table 15 (window, 3 seats) and disabled tables 5/6/7/8 in default booking map.
- [x] Removed day/night/auto floor mode from active frontend runtime.
- [x] Booking dialog keeps media/info and now includes optional field `Пожелания`.
- [x] Admin side now has richer table controls for re-enable/move/add workflows.
- [x] Removed old numeric “button” overlays on floor map; interaction now uses invisible hit-zones with preserved hover/click/select behavior.
- [x] Table status colors are now synchronized between selection highlight and legend (`free` / `reserved` / `held`).
- [x] Current pass intentionally skipped hall-map redraw/recomposition; booking visual logic remains stable until new source drawings are provided.
- [x] SEO hardening step (Nizhnevartovsk / Yandex+Google) executed in Plan №1 scope only; premium-visual blocks in Plan №2 were not changed in this pass.
- [x] Cloud section after hero redesigned to Perplexity-like progressive dissolve: layered cloud masks now transition `nebo1 -> nebo2 -> smaller -> smaller` over 3–4 scroll phases before revealing the existing interior image.
- [x] Removed the harsh instant-white feel in cloud intro: white start is now softened and dissipates together with layered clouds instead of fully blank screen first.
- [x] Cloud transition optimized for old mobile browsers: drift density reduced, low-tier devices skip extra cloud layers, and heavy backdrop blur stacks are disabled while preserving the premium visual style.
- [x] Fixed cloud artifacts: replaced mask-based overlays with blend-based full-frame cloud textures to remove square edges and keep organic cloud silhouettes.
- [x] Cloud intro now starts immediately with motion + slightly visible hall image (no fully white frame at section start).
- [x] Re-timed cloud choreography to 4 stages (`nebo1 -> nebo2 -> smaller -> smaller`) with longer dissolve window and smooth handoff.
- [x] Added preload for cloud texture references (`cloud-ref-nebo-1.jpg`, `cloud-ref-nebo-2.jpg`) to avoid first-scroll pop-in.
- [x] Removed unused legacy cloud visual blocks/styles (veil/card/info-card path) to reduce CSS weight and repaint load without changing core visual behavior.
- [x] Final cloud fix: removed static image overlays so flowers are no longer carried with clouds; cloud silhouettes are now extracted by near-white luminance directly inside live canvas sprites.
- [x] Fixed non-realistic square rollout: cloud motion now comes from organic canvas sprites with feathered alpha bounds (no rectangular layer reveal).
- [x] Kept reference look while preserving live movement: `nebo1/nebo2` now drive sprite shape extraction, while drift remains dynamic (Perplexity-like) instead of static texture scrolling.
- [x] PWA icon pass updated to first white logo variant with enlarged glyph occupancy (`meatbar-logo-mark-square-large*.webp`) for better visibility on home screen.
- [x] Added dedicated iOS touch icon (`apple-touch-icon-180.png`) and updated manifest shortcuts/icon set to the enlarged first-variant logo.
- [x] Cloud choreography corrected to user request: now starts with maximum cloud intensity and then progressively thins/dissolves while scrolling (no reverse progression).
- [x] Removed rectangular layer drift artifact: cloud container no longer translates/scales as a block; only organic live-cloud motion remains.
- [x] Improved cloud-shape realism from `nebo1/nebo2`: sprites are rebuilt from many soft near-white fragments, producing more natural Perplexity-like silhouettes.
- [x] Added extra cloud-runtime optimization: adaptive FPS cap (`24/30`), lower mobile cloud density, and rAF-queued resize to reduce scroll/resize jank on old iOS/Android.
- [x] Added cloud idle-pause when layer is visually gone (opacity near zero): canvas animation now auto-sleeps after dissolve and resumes when cloud layer returns.
- [x] Added tab-visibility pause for clouds (`visibilitychange`) so hidden tabs do not spend CPU on cloud animation.
- [x] Added runtime cache for reference cloud sprites (`nebo1/nebo2`): silhouette extraction is reused across remounts instead of rebuilding each time.
- [x] Lowered cloud overdraw cost without visual regression: scene keeps premium look with reduced desktop cloud density and slightly smaller off-viewport draw bounds.
- [x] Extended low-end cloud detection with network tier (`effectiveType` 2g) to keep old mobile browsers smooth while preserving visual logic.

## UPDATE 2026-05-10

- [x] PNG fallback for legacy browsers completed for cloud hero (`cloud-hero.png`, `cloud-hero-sm.png`) with AVIF/WebP still first in `<picture>` sources.
- [x] Service worker app-shell cache updated to include new PNG fallback assets.
- [x] CSS budget reduced to `dist/assets/index-*.css.gz = 13,958 bytes` (target `<= 14 KB` reached by artifact size).
- [x] Additional cloud cleanup completed: removed unused cloud markup/variables and redundant selectors without visual regression.
- [x] Cloud startup path optimized without visual downgrade: non-critical cloud/video resources moved from blocking preload to low-priority prefetch.
- [x] TableMap interaction smoothed on old devices: tooltip hover coordinates now update via `requestAnimationFrame` instead of state updates on every pointer event.
- [x] Cloud sprite generation from `nebo1/nebo2` now starts only when the cloud layer is actually visible, reducing startup pressure on mobile browsers.
- [x] Added SW `navigationPreload` to improve first navigation responsiveness while preserving premium visual continuity and offline behavior.
- [x] SW install-step made lighter for old phones: large cloud hero assets excluded from strict app-shell precache and served via runtime image cache.
- [x] Added idle warmup of booking chunks on capable devices to keep first click into booking premium-smooth without forcing preload on weak devices.
- [x] Hero video preload now adaptive (`none` on save-data/low-tier, `metadata` otherwise) to cut startup contention while keeping visual quality on normal devices.
- [x] Added CI + budget guard so premium visual changes are automatically blocked on gzip regressions (`ci.yml` + `npm run perf:budgets`).
- [x] Kept premium visual delivery stable under production caching: hashed media assets now served immutable from backend.
- [x] Added production runbook with rollback/restore/SEO checks to complete operational closure of premium rollout.
- [x] Plan №2 closed for repository scope: премиум-визуал + performance guards закреплены в коде и CI.
- [x] Bar-menu card pricing visual upgraded to premium leader rows (volume · dotted line · price) without extra runtime cost.
- [x] CloudHero copy block enhanced with brass keyline accent (visual polish only, no change to cloud choreography logic).
- [x] Booking dialog CTA moved to premium outline/fill interaction style while preserving existing flow and accessibility.
- [x] Bar-card pointer tilt optimized with `requestAnimationFrame` batching + static capability check to reduce pointer-move pressure on browsers.
- [x] Ember ambience quality now adapts to real FPS in `EmberField` (automatic `low/mid/high` population scaling) to keep premium fire atmosphere smoother on older devices.
- [x] Hero still-frame quality path improved: AVIF poster is used when supported, with automatic WebP fallback for compatibility.
- [x] Gallery rail render path trimmed: doubled rail list is memoized once per menu-update (less GC churn during frequent UI state changes).
- [x] Touch and low-tier header interactions now skip expensive hover glow layers while preserving core premium typography/contrast.
- [x] Added long-task telemetry + API `Server-Timing` instrumentation so visual regressions can be correlated with real runtime bottlenecks.
