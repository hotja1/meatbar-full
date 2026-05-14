---
inclusion: fileMatch
fileMatchPattern: 'frontend/src/**,backend/src/**'
---

# Code review checklist — self-review перед сдачей

Основано на [pr-review-expert](https://github.com/alirezarezvani/claude-skills) и [api-design-reviewer](https://github.com/alirezarezvani/claude-skills). Адаптировано под наш стек (React 19 + Vite + Express + SQLite).

Перед тем как сказать владельцу «готово» — прогнать изменение по этому чеклисту.

## 1. Blast radius — что может сломаться

- Сколько файлов затронуто? > 10 — серьёзно пересмотреть, можно ли разбить.
- Есть ли изменения в «ядре» — `App.tsx`, `main.tsx`, `api.ts`, `db.js`, `index.js`, `sw.js`? Это зоны повышенного риска.
- Меняется ли поведение публичных API (`/api/*`)? Если да — backward compat?
- Меняется ли схема БД? Нужна миграция? Бэкап сделан?
- Меняется ли Service Worker? Бампнут `VERSION`?

## 2. Security scan

- Новые endpoints — есть ли `authMiddleware` там, где он нужен?
- Rate-limiters применены к POST-ручкам (login / bookings / orders / sms)?
- CORS whitelist не ослаблен?
- Нет хардкода секретов, токенов, паролей?
- Пользовательский ввод валидируется? `dangerouslySetInnerHTML` только через `DOMPurify`?
- SQL — только prepared statements, никаких конкатенаций?
- Ошибки не возвращают stack / путь / SQL?

## 3. Performance delta

- Не добавил ли новую зависимость, которая ломает manualChunks?
- Не импортировал ли `lucide-react` через barrel?
- `index.js.gz` всё ещё ≤ 103 KB? `index.css.gz` всё ещё ≤ 14 KB?
- Не поломал ли lazy-загрузку (CartDrawer, TableMap, BookingDialog, BarMenuSection, AdminApp)?
- Новые картинки — AVIF/WebP + `-sm` вариант + `loading="lazy" decoding="async"`?
- Не добавил ли `box-shadow` с `blur > 40px` на элемент-списка?
- Canvas-анимации — `IntersectionObserver` pause + `prefers-reduced-motion`?

## 4. Accessibility

- Новый интерактив — клавиатурно доступен (Tab / Enter / Space / Esc)?
- `:focus-visible` стиль виден?
- Контраст текста ≥ 4.5:1 к фону?
- Тач-цели ≥ 44×44 px на мобильном?
- `alt` на новых картинках (описательный, с упоминанием бренда для значимых)?
- Ошибки форм — `aria-invalid` + `aria-describedby`?
- Живые обновления — `aria-live="polite"`?

## 5. TypeScript

- Никаких `any` (кроме объяснённых случаев)?
- Типы API-ответов узкие, не `Record<string, unknown>`?
- Strict mode не ослаблен?
- Discriminated unions вместо `boolean`-флагов для состояний?
- Нет ли side-effects в рендере?

## 6. Fallback-first

- Если новая функция зависит от `/api/*` — есть ли fallback на `frontend/src/data/*` данные?
- `api.ts` всё ещё кидает ошибку на non-JSON (SPA fallback)?
- Оффлайн-поведение не сломано?

## 7. Breaking changes

Запретные:

- Переименование props у публичных компонентов без deprecation.
- Изменение формата ответа `/api/menu`, `/api/tables`, `/api/content`, `/api/bookings`, `/api/orders`.
- Смена ключа `localStorage` (`meatbar-admin-token`, `meatbar:menu-cache`, `meatbar:offline-bookings`).
- Изменение схемы SQLite без миграции.
- Удаление существующего URL/маршрута.

Если всё-таки нужно — флагнуть владельцу ДО правки.

## 8. Tests

У нас тестов нет (по `PRAVILA.md` — «DO NOT automatically add tests unless explicitly requested»).

Если владелец попросил добавить — Vitest для unit + Playwright для e2e. Иначе — ручная проверка сценариев:

- Бронь столика — дошла до `/api/bookings`.
- Заказ — дошёл до `/api/orders`.
- Админ-логин — `/api/auth/login` отдал токен.
- Offline — бронь встала в очередь.

## 9. Backward compat / миграции

- Если меняется схема БД — `ALTER TABLE ADD COLUMN IF NOT EXISTS` идемпотентно.
- Если меняется формат `localStorage` — миграция на чтение старого формата + запись в новый.
- Если меняется SW — старый cache версии чистится на `activate`.

## 10. Мойябейк (mojibake) и UTF-8

- Ни одного `РњСЏСЃРѕ`, `вЂ`, `в„–` в diff.
- Русский текст в UTF-8 без BOM.
- `guard:mojibake` прошёл.

## 11. Документация

- Если добавилась новая публичная функция — есть JSDoc?
- Если изменилось поведение — обновить соответствующий `docs/*.md` или `planopt.md`?
- Если это было задание из `planopt.md` — отметить `[x]` и записать в «Лог выполнения»?

## 12. Проверки финального прогона

Обязательно, в порядке:

1. `npm --prefix frontend run guard:mojibake` — OK.
2. `npm --prefix frontend run lint` — OK (3 known admin warnings допустимы).
3. `npm --prefix frontend run build` — OK.
4. `npm --prefix frontend run perf:budgets` — OK.
5. `node --check backend/src/index.js` — OK.

Все 5 шагов = `[x]` в `planopt.md` и отчёт владельцу.

Один из них `FAIL` = назад к правке.

## Коммит-сообщение (когда владелец попросит коммит)

Conventional commits:

- `feat(frontend): add responsive srcset for dish cards`
- `fix(backend): prevent API cache leak on booking mutation`
- `perf(sw): dynamic APP_SHELL from precache-manifest`
- `refactor(api): extract booking validation into zod schema`
- `docs(planopt): mark A1 as complete`

Не «fix stuff», не «update code». Конкретно, что и где.
