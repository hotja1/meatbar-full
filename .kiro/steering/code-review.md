---
inclusion: manual
---

# Code review — чек-лист перед мержем

Основа — Google Engineering Practices, Thoughtbot guidelines, опыт команды React. Подключать через `#review` перед PR / самопроверкой.

## Перед отправкой на ревью

### 1. Я соблюдаю правила проекта

- [ ] Прочитал правила: `PRAVILA.md`, `WORKFLOW.md`, `PRO.md`.
- [ ] Не нарушил жёсткие запреты (heavy-libs, Phase 13 заморозки, `/api/*` POST в SW, и т.д.).
- [ ] Не менял версии React/Vite/TS/Express/SQLite.
- [ ] Не добавил новых зависимостей без согласия.

### 2. Проверки пройдены

- [ ] `npm --prefix frontend run guard:mojibake` — OK.
- [ ] `npm --prefix frontend run lint` — OK (3 известных admin warning допустимы).
- [ ] `npm --prefix frontend run build` — OK.
- [ ] `npm --prefix frontend run perf:budgets` — OK.
- [ ] `node --check backend/src/index.js` — OK.

### 3. Я сам прошёл глазами по diff

- [ ] Нет закомментированного кода «на всякий случай».
- [ ] Нет `console.log` / `debugger` для дебага.
- [ ] Нет TODO без issue-ссылки.
- [ ] Нет рефакторинга «заодно» вне задачи.
- [ ] Нет файлов, которые не должны были меняться (artifacts, lock-файлы не по делу).

### 4. Секреты и персональные данные

- [ ] Нет `.env`, `*.key`, паролей, токенов.
- [ ] Нет реальных телефонов/email-ов кроме публичных контактов.
- [ ] `backend/data/*.sqlite*` не попал в коммит.

## Предметно для FRONTEND (React 19 + TS)

- [ ] TypeScript strict соблюдён, нет `any`.
- [ ] Типы API-ответов узкие (из `src/lib/types.ts`).
- [ ] Новые компоненты — lazy, если ниже фолда.
- [ ] Иконки `lucide-react` импортированы через deep-path.
- [ ] Нет нестабильных `{...}` объектов в JSX-пропсах мемоизированных компонентов.
- [ ] Все `useEffect` имеют корректный массив зависимостей.
- [ ] В cleanup-функциях отписаны observers / timers / abort controllers.
- [ ] Fallback-first сохранён (если API упал, UI работает на локальных данных).
- [ ] Картинки с `loading="lazy" decoding="async"` ниже фолда.
- [ ] Новые картинки в WebP/AVIF + `-sm` для мобилы + `width`/`height` атрибуты.
- [ ] `alt` осмысленный (или `alt=""` для декоративных).
- [ ] CSS-переменные, а не хардкод цветов.
- [ ] Анимация имеет ветку `@media (prefers-reduced-motion: reduce)`.

## Предметно для BACKEND (Express + SQLite)

- [ ] Все SQL — подготовленные запросы.
- [ ] Новые роуты под admin защищены `authMiddleware`.
- [ ] Новые POST-роуты с валидацией required-полей.
- [ ] Rate-limit применён к публичным мутационным endpoints.
- [ ] Ошибки возвращают `{ error: '...' }` без стека/секретов.
- [ ] После мутации — `clearPublicApiCache('menu|tables|content')`.
- [ ] После изменения столов — `io.emit('tables:updated', ...)`.
- [ ] Новые таблицы — через `CREATE TABLE IF NOT EXISTS` в `bootstrap()`.
- [ ] Новые интеграции — off by default, включаются env-переменной.

## Предметно для SW / PWA

- [ ] Если правил `sw.js` — бампнул `VERSION`.
- [ ] Не кешируются `/api/*` POST.
- [ ] Не кешируются `/socket.io/*`.
- [ ] Не перехватываются видео и range-запросы.
- [ ] Проверил install → activate → fetch flow в DevTools.

## Предметно для CSS

- [ ] Бюджет `index.css.gz ≤ 14 KB`.
- [ ] `will-change` точечно, не на сотнях элементов.
- [ ] Новые `box-shadow` не создают paint-стек на скролле.
- [ ] На `data-perf='low'` тяжёлое отключено.
- [ ] Анимации через `transform`/`opacity`/`filter`, не через `top`/`left`.
- [ ] `word-break: keep-all; hyphens: none` не нарушено.

## Предметно для SEO

- [ ] Meta `description` осмысленный, с городом.
- [ ] `title` актуальный для секции.
- [ ] JSON-LD прошёл валидатор `validator.schema.org`.
- [ ] `canonical` и `og:url` абсолютные.
- [ ] Новые секции добавлены в `SECTION_SEO` в `frontend/src/lib/seo.ts`.
- [ ] `robots.txt` и `sitemap.xml` не ломаются (проверить после `npm run build`).

## Ревью чужого PR

### Архитектура

- Решение вписано в существующий стиль проекта?
- Нет ли более простого пути?
- Правила `PRAVILA.md` соблюдены?

### Читаемость

- Имена переменных говорят сами за себя?
- Функции делают одну вещь?
- Нет магических чисел без комментария?

### Производительность

- Нет ли лишних `useEffect` / ре-рендеров?
- Большие списки виртуализированы / лениво отрендерены?
- Картинки оптимизированы?

### Безопасность

- Нет SQL-инъекций (подготовленные запросы)?
- Нет XSS (`dangerouslySetInnerHTML` с пользовательским вводом)?
- Токены не попали в логи?
- CORS/CSP не ослаблен?

### Доступность

- Клавиатурная навигация работает?
- Focus-visible стили на месте?
- `alt` на картинках?

### Тесты (когда появятся)

- Новая функциональность покрыта тестами?
- Тесты предсказуемые (нет `Math.random()` без seed)?

## Формат комментариев в ревью

- **blocking**: `[must]` — требует правки до мержа.
- **nice to have**: `[nit]` — стилистическая мелочь, не блокирует.
- **question**: `[?]` — просьба объяснить.
- **praise**: `[+]` — хорошо сделано, отметить.

Пример:

```
[must] src/lib/api.ts:87 — забыли catch на fetch, уронит React Error Boundary
[nit] src/components/BookingDialog.tsx:12 — имя `h` малоговорящее, `handleSubmit`?
[?] Зачем здесь useCallback, если зависимостей нет?
[+] хорошая проверка на non-JSON response, теперь SPA fallback не отравит state
```
