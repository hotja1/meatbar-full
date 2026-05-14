---
inclusion: always
---

# Anti-patterns catalog — консолидированный справочник

Собрано из всех остальных steering-файлов + [Josh W. Comeau](https://www.joshwcomeau.com/), [web.dev](https://web.dev/), [Node.js best practices](https://github.com/goldbergyoni/nodebestpractices), [open-design anti-AI-slop](https://github.com/nexu-io/open-design). Чтобы один раз увидеть — в одном месте.

## Frontend / React

### Типовые ошибки

- `<div onClick>` вместо `<button>` — не работает с клавиатурой, плохо для screen reader.
- `useEffect` без массива зависимостей — бесконечный ре-ренд.
- Создание объекта в JSX: `<X style={{color: 'red'}}>` — новая ссылка каждый рендер, ломает memo.
- Создание функции в JSX: `<X onClick={() => ...}>` — то же самое.
- `React.memo` без стабилизации пропсов через `useCallback`/`useMemo` — бесполезно.
- Context для часто меняющегося состояния — лавина ре-рендеров у всех потребителей.
- `dangerouslySetInnerHTML` с user-input без `DOMPurify`.
- Side-effects в рендере (изменение глобальных переменных, DOM).
- Прямое чтение `window`/`document` в рендере без `typeof window !== 'undefined'`.
- `key={index}` в списке, который меняется — поломанное состояние дочерних компонентов.
- Не отписаться от IntersectionObserver / WebSocket / Socket.IO в cleanup.
- `useState` вместо `useRef` для ID таймеров.
- Спрятать `async/await` в `useEffect` напрямую: `useEffect(async () => {...})` — промис течёт. Правильно: `useEffect(() => { void async () => {...}(); }, [])`.

### TypeScript

- `any` вместо `unknown` + narrowing.
- Type assertion `as Foo` без runtime проверки — обход типов.
- `interface` vs `type` без согласованности. В проекте — `interface` предпочтительно (правила react-typescript-patterns.md).
- Дублирование типов — только в `src/lib/types.ts`.
- Boolean-флаги для состояний вместо discriminated union.

## CSS

- `position: fixed` с `backdrop-filter` на overlay — дорого, тормозит.
- `@keyframes` с анимацией `width`/`height` — layout thrash, вместо `transform: scale()`.
- `background-attachment: fixed` на мобильном — scroll jank, отключено глобально.
- `outline: none` без замены `:focus-visible` — доступность сломана.
- Глобальное `* { transition: all .3s }` — ломает performance везде.
- `z-index: 9999` — хаос в стэкинге. Использовать shared scale (1, 10, 100, 1000).
- Magic numbers в paddings: `padding: 13px 17px` — следствие тыкания в редакторе.
- `!important` без причины — CSS-война. Разрешено только для `data-perf='low'` override (документировано).
- `@media (max-width: 767px)` и `@media (min-width: 767px)` рядом — 767 пересекается. Выбрать одно.
- `vh` без поправки на iOS Safari chrome bar (используем `svh`).
- Hardcode hex-цветов вместо `var(--coal)` / `var(--cream)`.
- `box-shadow: 0 24px 80px rgba(0,0,0,0.4)` на элементе списка на скролле — paint-пик.
- `filter: blur(8px)` на `position: fixed` overlay постоянно — жрёт GPU.

## Visual / AI-slop

Из `design-critique.md`:

- Фиолетовые градиенты (generic AI).
- Emoji-иконки в UI.
- Карточка с left-border accent.
- Inter как display-гарнитура.
- Hand-drawn SVG-человечки.
- Скруглённый квадрат-логотип с градиентом внутри.
- Придуманные числа без источника.
- Lorem ipsum в финальной сдаче.
- Шорох/подпрыгивание на hover (lightweight bounce) — у нас sober premium.
- Pulsing glow на CTA постоянно — визуальный шум.

## Backend / Express

- `app.use((req, res, next) => ...)` без `next()` — соединение виснет.
- `res.send()` два раза — runtime error.
- Отдача stack trace в prod: `res.status(500).send(err.stack)` — утечка info.
- `app.get('/admin/*', ...)` без `authMiddleware` — публичный admin.
- CORS `origin: '*'` — не используем, whitelist через `buildAllowedOrigins`.
- SQL через string concat: `db.prepare('SELECT * FROM x WHERE id=' + id)` — injection. Только prepared + `?`.
- Неcatched async в route: `app.get('/x', async (req, res) => { throw ... })` — uncaught promise rejection.
- Логирование пароля/токена: `console.log('login:', req.body)` — тело содержит пароль.
- Socket.IO без CORS whitelist — open to all origins.
- `process.env.X` без fallback — `undefined` валится позже.
- Один большой `index.js` без разделения по роутерам — хаос на 1000 строк.

## SQLite

- `db.exec(sql)` с user-input — injection.
- Не-идемпотентная миграция — второй раз падает.
- Отсутствие индексов на hot-paths → full scan.
- Держать `.sqlite-wal` через несколько deploy-ев без checkpoint — файл растёт.
- Не закрывать DB в `SIGTERM` — corruption риск.

## Service Worker

- Не бампать `VERSION` при релизе → юзеры застряли на старом кеше.
- Кэшировать `/api/*` POST — стейл данные, фейковые "успехи".
- Кэшировать `/socket.io/*` — полетевшие реалтайм.
- Перехват range-запросов видео — ломает streaming.
- `cache.add(url)` без try/catch — один 404 валит весь install.
- Не версионировать `CACHE_NAME` — старые кеши остаются.
- `fetch(event.request)` без `response.ok` проверки — кешируется ошибка.
- Кеш SPA-fallback `index.html` как `/api/*` fallback — JSON-клиент получит HTML.

## SEO

- Несколько `<h1>` на странице — потерянная иерархия.
- `canonical` без абсолютного URL.
- JSON-LD с синтаксической ошибкой — невидим для Google.
- `robots.txt` без `Host:` для Яндекса — потерянная индексация.
- Meta-description длиннее 160 символов — обрезается.
- Дублирующиеся meta-описания на разных страницах — потерянные rich snippets.
- Alt-тексты из одного слова — «интерьер», а не «интерьер Мясо Бара в Нижневартовске».
- Hash-навигация без обновления title/description — все страницы в поиске одинаковые.

## Accessibility

- `tabindex="-1"` на интерактивах — недоступно с клавиатуры.
- `tabindex="999"` для «поднятия наверх» — ломает порядок.
- Focus без `:focus-visible` — пользователь не видит где он.
- Модалка без focus trap — Tab уводит за пределы.
- Живой регион `aria-live="off"` — screen reader не озвучивает.
- Форма без `<label>` — слепой не понимает что это.
- Ошибка только цветом (красный border) — не виден дальтоникам.

## Git / Security

- `git push --force` в общую ветку.
- Коммит `.env` / `*.sqlite` / `node_modules/`.
- Хардкод токенов в коде.
- `git reset --hard` без бэкапа.
- Merge conflict «решён» через массовое `git checkout --theirs`.
- Push с Tamper-friendly сообщением (`wip`, `asdf`, `.`).
- `--no-verify` для пропуска hooks без причины.

## Mojibake (кириллица)

- Вставка русского текста из источника неизвестной кодировки.
- Win1251 → UTF-8 двойная перекодировка.
- `Get-Content file.md` в PowerShell без `-Encoding UTF8` (консоль врёт).
- `echo "Текст" > file.md` в cmd → BOM + OEM кодировка.
- Исправление одного mojibake-символа вручную (а остальные остаются).

## Performance

- Forgot `loading="lazy"` на ниже-фолд картинке.
- Забыли `width`/`height` атрибуты → CLS.
- `fetchpriority="high"` на 10 картинках — конкурируют.
- Новая зависимость — проверить `index.js.gz` бюджет.
- Dev-only dependency в `dependencies` (не `devDependencies`).
- Source-maps включены в prod — утечка исходников.
- `console.log(...)` в prod без gating — spamит консоль.
- `setInterval` без `clearInterval` в cleanup — утечка.
- Fetch в цикле без `Promise.all` — последовательные запросы.
- Избыточный `JSON.parse(JSON.stringify(x))` для клонирования — есть `structuredClone`.

## Ошибки при работе с ИИ над проектом

- ИИ редактирует файл, не прочитав его целиком.
- ИИ «заодно» чинит unrelated код — нарушение `PRAVILA.md`.
- ИИ угадывает, а не проверяет: «кажется, там используется React Router» — прочитать и убедиться.
- ИИ скипает проверку после правки (`guard:mojibake → lint → build → perf:budgets`).
- ИИ коммитит сам без просьбы.
- ИИ пишет тесты «на всякий случай» — запрещено `<goal>` без явной просьбы.
- ИИ пересобирает `dist/` / `backend/public/` вручную — они артефакты сборки.

## Если увидел анти-паттерн в чужом коде

1. **Не чинить автоматически** если это не задача.
2. Отметить в отчёте: «вижу анти-паттерн X в файле Y, рекомендую вынести в задачу».
3. Предложить добавить в `planopt.md` как P3.
4. Продолжить свою основную задачу.

«Починить всё заодно» — прямо запрещено в `PRAVILA.md` и `WORKFLOW.md`.
