---
inclusion: always
---

# Dependency policy

Основано на [dependency-auditor](https://github.com/alirezarezvani/claude-skills) + правила из `PRAVILA.md`.

## Железные правила

- **Не добавлять новые зависимости без явного согласия владельца.**
- **Не обновлять ключевые зависимости без согласия:** React, React-DOM, Vite, TypeScript, Express, better-sqlite3, Socket.IO.
- Минорные/патч-обновления безопасные зависимостей (`helmet`, `cors`, `dotenv`, `lucide-react`) — можно при `npm audit` alertах, но с отметкой в отчёте.

## Почему так строго

1. Каждая зависимость — поверхность атаки (supply chain).
2. Каждая зависимость — вес бандла. У нас бюджет `index.js.gz ≤ 103 KB`.
3. Каждая зависимость — когнитивная нагрузка поддержки.
4. У нас уже всё есть: React, Express, SQLite, Socket.IO. Добавить легко, убрать — сложно.

## Когда можно предложить новую зависимость

Только если:

1. **Задача не решается своим кодом разумно** (решение > 100 строк нетривиального кода).
2. **Зависимость вес ≤ 10 KB gzip** (для frontend).
3. **Популярная и живая** (> 10k stars GitHub, коммиты в последние 6 месяцев).
4. **Лицензия совместимая** (MIT, Apache-2.0, BSD, ISC). GPL — только с явного согласия.
5. **Нет в блеклисте** (см. ниже).

Даже при выполнении всех пяти — **сначала предложить владельцу**, показать альтернативы («своими руками + 50 строк» vs «библиотека + 10 KB»).

## Блеклист — никогда не добавлять

- **framer-motion, GSAP, three.js, anime.js, lottie-react** — запрещены в `PRAVILA.md` (heavy animation).
- **Moment.js** — deprecated, heavy, используем нативный `Date` + `Intl`.
- **Lodash** целиком — только точечные импорты, если очень надо. Обычно без него живётся.
- **Styled-components / Emotion** — у нас CSS-файлы, не CSS-in-JS.
- **MUI / Ant Design / Chakra** — свой дизайн-язык, не используем шаблонные системы.
- **jQuery** — в React-проекте не место.
- **Underscore** — та же история.
- **Axios** — у нас `fetch` + обёртка в `api.ts`, добавлять axios смысла нет.
- **Webpack / Parcel / Rollup отдельно** — у нас Vite.
- **CRA (create-react-app)** — у нас Vite.
- **Redux / MobX / Zustand** — состояние в локальном `useState` и `HomePage` компоненте, Context только где реально нужно.

## Whitelist — безопасные добавки (если вдруг понадобится)

С явного согласия и с обсуждением:

- `zod` — валидация схем, planned в PLAN-1. ~8 KB gzip.
- `date-fns` — если нужны сложные операции с датами. Tree-shakeable.
- `DOMPurify` — только если появится user-generated HTML.
- `pino` — структурированные логи backend, заменил бы `console.log`.
- `web-vitals` — уже есть.
- `socket.io-client` — уже есть.

## Аудит регулярно

Раз в месяц:

```bash
npm --prefix frontend audit
npm --prefix backend audit
```

Критичные (`severity: critical`) — чинить сразу, обсудить с владельцем если надо менять major.

High — обсудить, запланировать в `planopt.md`.

Moderate / Low — по возможности, в рамках следующего minor-релиза.

## Supply chain защита

### Проверка пакета перед добавлением

- [ ] Имя совпадает с тем, что искал (нет typosquatting: `lodasj`, `reactt`, `axois`).
- [ ] В GitHub есть активность последние 6 месяцев.
- [ ] > 10k downloads/неделя.
- [ ] Лицензия совместима.
- [ ] `package.json` не содержит подозрительных `postinstall` / `preinstall` скриптов.
- [ ] Автор — известный maintainer или организация, не аноним.

### Подозрительные паттерны

- Pакет с именем типа `@scope/package-helper` от нового автора.
- Пакет запрашивает права на сеть при установке.
- Пакет пустой или почти пустой в основном файле.
- Зависимости пакета тянут 50+ других пакетов.

Если нашёл подозрительное — отказаться, предложить альтернативу.

## Лицензии

Проверяем лицензии всех зависимостей:

```bash
npx license-checker --summary  # если будем ставить, сейчас нет
```

Или вручную через `npm view <package> license`.

Совместимые с Apache-2.0 / MIT проектом:

- MIT ✅
- Apache-2.0 ✅
- BSD (2-Clause, 3-Clause) ✅
- ISC ✅
- CC0 ✅

Требуют осторожности (copyleft):

- GPL-2.0 / GPL-3.0 — вирусная лицензия, нельзя в closed-source.
- LGPL — можно, если используем как библиотеку без модификаций.
- MPL-2.0 — можно с оговорками.
- AGPL — не совместимо с серверным проектом.

## Обновления

### Patch (X.Y.Z)

- Прогнать `npm --prefix <folder> install <pkg>@<new-version>`.
- `npm audit` — OK?
- Перезапустить `guard:mojibake → lint → build → perf:budgets → node --check`.
- Если всё OK — коммит `chore(deps): bump <pkg> from X.Y.Z to X.Y.Z+1`.

### Minor (X.Y.0)

- То же + прочитать changelog пакета.
- Проверить breaking changes в minor (иногда бывает нарушение semver).
- Прогнать smoke-check вручную.
- Обсудить с владельцем если пакет важный.

### Major (X.0.0)

- Обязательно согласовать с владельцем.
- Прочитать migration guide.
- Создать фичевую ветку `chore/bump-<pkg>-v<new>`.
- Прогнать полный smoke-check.
- Откатываемся легко если что.

## Peer dependencies

Если какой-то пакет требует peer deps:

- Проверить совместимость с нашими версиями (React 19 и т.п.).
- Если несовместимо — не ставим, ищем альтернативу.
- Никогда не добавляем пакет, который требует downgrade React / Vite / TypeScript.

## Dev vs prod dependencies

- `dependencies` — попадает в runtime / бандл / production.
- `devDependencies` — только для разработки и сборки.

Правильно:

```json
"dependencies": {
  "react": "^19.0.0"
},
"devDependencies": {
  "@types/react": "^19.0.2",
  "vite": "^6.0.5"
}
```

Typescript types — всегда `devDependencies`.

## Lock-файл

- `package-lock.json` — коммитится всегда.
- `npm ci` в CI и на VPS (не `npm install`).
- Если lock поехал — `git diff package-lock.json` посмотреть что поменялось, убедиться что осмысленно.

## Дерево зависимостей

Периодически:

```bash
npm --prefix frontend ls --depth=0
npm --prefix backend ls --depth=0
```

- Нет ли дубликатов разных версий одного пакета?
- Нет ли неиспользуемых (`npm prune` или `depcheck`)?

Не выкидывать сразу — иногда их использует другой пакет как peer dep.
