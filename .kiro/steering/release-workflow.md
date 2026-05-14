---
inclusion: manual
---

# Release workflow

Подключать через `#release-workflow` когда готовим релиз. Основано на [release-manager](https://github.com/alirezarezvani/claude-skills) и [changelog-generator](https://github.com/alirezarezvani/claude-skills).

## Semver для «Мясо Бара»

Проект не публичный пакет, но semver помогает отслеживать изменения:

- **MAJOR** (X.0.0) — breaking изменения в `/api/*`, схеме БД, формате localStorage, или удаление функций.
- **MINOR** (X.Y.0) — новые фичи без breaking. Новая секция на сайте, новый endpoint, новый admin-view.
- **PATCH** (X.Y.Z) — багфиксы, оптимизации без изменения поведения, правки текстов.

Номер версии держим в `backend/package.json` + `frontend/package.json`. Бампаем вручную при релизе.

## Conventional commits

Каждый коммит — по формату [conventional commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Типы

- `feat` — новая функциональность (MINOR).
- `fix` — багфикс (PATCH).
- `perf` — оптимизация без смены поведения (PATCH).
- `refactor` — внутренний рефакторинг без user-visible изменений.
- `docs` — правки документации / планов.
- `style` — форматирование, пропущенные точки с запятой (не влияет на логику).
- `test` — добавление/правка тестов.
- `chore` — build/деплой/зависимости.
- `ci` — изменения CI.
- `revert` — откат предыдущего коммита.

### Scope

- `frontend` — общий frontend.
- `backend` — общий backend.
- `sw` — Service Worker.
- `admin` — админка.
- `booking` — бронирование.
- `menu` — меню.
- `cloudhero` — hero-секция.
- `cart` — корзина.
- `ci` — сборка/CI.
- `seo` — SEO-тексты/мета.
- `deps` — зависимости.

### Breaking changes

Если коммит ломает совместимость — в конце тела сообщения:

```
BREAKING CHANGE: /api/bookings теперь требует поле `consent`.
Миграция: все клиенты должны отправлять `consent: true`.
```

Или в заголовке восклицательный знак:

```
feat(api)!: rename /api/bookings to /api/reservations
```

## Changelog

Хранится в `CHANGELOG.md` в корне (создать при первом релизе). Формат — [Keep a Changelog](https://keepachangelog.com/).

```markdown
# Changelog

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.2.0] — 2026-05-11

### Added
- Responsive srcset для dish-cards (planopt A1).
- BackgroundSync для /api/orders (planopt D19).

### Fixed
- Оффлайн-очередь для бронирований не синхронизировалась после reconnect.

### Performance
- index.js.gz: 103.7 KB → 99.8 KB.
```

Генерация из conventional commits — автоматом или вручную на основе `git log`.

## Release readiness — финальный чеклист

Подключать `#deploy-runbook` вместе с этим файлом.

- [ ] Все `planopt.md` задачи текущего спринта `[x]`.
- [ ] Версии в `package.json` бампнуты.
- [ ] `CHANGELOG.md` обновлён с новой версией и датой.
- [ ] `guard:mojibake → lint → build → perf:budgets → node --check` — все OK.
- [ ] Бэкап `backend/data/meatbar.sqlite` сделан.
- [ ] SW `VERSION` бампнут в `backend/public/sw.js`, если SW менялся.
- [ ] `docs/PERF-BASELINE.md` обновлён с новыми метриками.
- [ ] README / PLAN-1 / PLAN-2 / `planopt.md` логи содержат UPDATE с датой.
- [ ] `.env` на VPS актуален для новых интеграций / переменных.
- [ ] Git tag `v1.2.0` создан (после пуша и разрешения владельца).

## Git tag

После успешного релиза:

```bash
git tag -a v1.2.0 -m "v1.2.0 — responsive srcset + background sync for orders"
git push origin v1.2.0
```

Только по явной просьбе владельца — никогда не тегаю сам.

## Rollback процесс

Если после релиза пошло плохо:

1. `git checkout <previous-tag>` на дев-машине.
2. `npm --prefix frontend run build` — пересобрать.
3. `rsync` готового `dist/` на VPS в `backend/public/`.
4. На VPS: `git checkout <previous-tag>` на backend-ветке.
5. `systemctl restart meatbar`.
6. Smoke-check по `docs/PRODUCTION-RUNBOOK.md`.
7. Инцидент-пост-мортем в `docs/INCIDENT-LOG.md` (создать при первом инциденте).

Не делать force-push, не делать `reset --hard`.

## Пост-релизный мониторинг (первый час)

- `/api/health` 200 — проверить раз в 5 минут.
- Ошибки backend в `journalctl -u meatbar -f` — глазами 10 минут.
- Динамика `/api/rum` — есть ли новые `error` события.
- Socket.IO — клиенты переподключились без петель?
- SW — `Application → Service Worker → New version activated` на тесте в Chrome.

## Semver bumping для зависимостей

По `PRAVILA.md` — версии ключевых зависимостей (React, Vite, TypeScript, Express, SQLite) менять только с явного согласия.

Для остальных:

- Patch (X.Y.Z) — можно обновлять при `npm audit` alertах.
- Minor (X.Y.0) — обсудить с владельцем.
- Major (X.0.0) — обсудить с владельцем, прогон полного smoke-теста.

Всегда сначала `npm audit` после обновления.
