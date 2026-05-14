---
inclusion: manual
---

# Conventional Commits — формат сообщений

Стандарт: [conventionalcommits.org](https://www.conventionalcommits.org/). Используется в большинстве профессиональных проектов.

Подключать через `#commits` когда готовим коммит или серию коммитов.

## Структура

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type** (обязательно) — категория.
- **scope** (опц.) — затронутая часть (`frontend`, `backend`, `booking`, `sw`, `seo`).
- **subject** (обязательно) — краткое описание, 50–72 символа, глагол в настоящем времени, без точки в конце.
- **body** (опц.) — подробности, что и зачем. Перенос строки после subject обязателен.
- **footer** (опц.) — ссылки на задачи, breaking changes.

## Типы

| Type       | Когда                                                   |
| ---------- | ------------------------------------------------------- |
| `feat`     | Новая функциональность                                  |
| `fix`      | Исправление бага                                        |
| `perf`     | Оптимизация производительности                          |
| `refactor` | Рефакторинг без изменения поведения                     |
| `style`    | Форматирование, отступы (не CSS визуал)                 |
| `docs`     | Документация                                            |
| `test`     | Добавление/правка тестов                                |
| `build`    | Сборка, зависимости, CI                                 |
| `ci`       | GitHub Actions, деплой-скрипты                          |
| `chore`    | Мелочь, не попадающая в другие категории                |
| `revert`   | Откат предыдущего коммита                               |

## Примеры хороших коммитов

```
feat(booking): add hall 3 lounge bar to table map

Added 14 new tables for the lounge & bar area, wired up the same
hit-zone interaction as halls 1 and 2, updated backend seed data.

Refs: #42
```

```
perf(frontend): lazy-load analytics bootstrap

Moved installSeoEnhancements and analytics-bootstrap to a separate
idle chunk. Initial JS.gz: 103.7 KB -> 100.2 KB.

See planopt.md B8.
```

```
fix(sw): bump cache version to v21

v20 kept stale hashed assets on devices that had the site installed
before the cloud-hero PNG fallback was added.
```

```
refactor(backend): extract rate limiters to security.js
```

```
docs: update planopt.md with 4 new steering files
```

## Примеры плохих коммитов

- `fix stuff` — бессмысленно.
- `WIP` — в финальном коммите не нужно.
- `Updated files` — ничего не говорит.
- `update` — глагол не в настоящем времени, нет scope, нет сути.
- `Fix.` — точка в конце, заглавная в начале, не сказано что чинилось.
- `feat: Добавил стол 15 и еще немного поправил css вокруг и обновил seo mета теги в head` — смешано несколько задач.

## Breaking changes

Если меняется публичный API:

```
feat(api)!: change /api/tables response schema

BREAKING CHANGE: removed `x`, `y` fields; replaced with `position: {x, y}`.
Migrate frontend accordingly.
```

## Merge / Pull Request

- Squash-merge предпочтительно → история чище.
- Title PR = первая строка итогового коммита (≤ 70 символов).
- Body PR — как `body` + `footer` коммита.

## Локальные правила проекта

- Писать коммиты на английском (привычка международных команд).
- `feat` и `fix` должны быть по возможности маленькими (1–3 файла).
- Перед коммитом — прогон `guard:mojibake → lint → build → perf:budgets`.
- Никогда не `git commit --amend` по чужим коммитам.
- Не использовать `--no-verify` без явного разрешения.

## Автоматизация (на будущее)

Можно подключить:

- **commitlint** — валидация формата pre-commit (не добавляем пока без согласия, `PRAVILA.md` про зависимости).
- **husky** — git-hooks для `guard:mojibake` + `lint` перед коммитом.
- **conventional-changelog** — автогенерация CHANGELOG.md.

Это в отдельную задачу, не прямо сейчас.
