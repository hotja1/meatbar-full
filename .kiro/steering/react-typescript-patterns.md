---
inclusion: fileMatch
fileMatchPattern: 'frontend/src/**/*.{ts,tsx}'
---

# React 19 + TypeScript паттерны

Основа — официальная документация React 19, TypeScript Handbook, рекомендации команды React. Адаптировано под правила проекта.

## TypeScript

- Strict mode **включён** в `tsconfig.app.json` — не ослаблять.
- Никогда не `any`. Если не знаешь тип — `unknown` + narrowing.
- Shared types — только в `src/lib/types.ts`. Не дублировать.
- Типы API-ответов обязательно узкие: `MenuCategory`, `RestaurantTable`, не `Record<string, unknown>`.
- `as const` для литеральных объектов-констант.
- Discriminated unions вместо `boolean`-флагов для состояний: `{ status: 'idle' } | { status: 'loading' } | { status: 'error', error: Error } | { status: 'ok', data: T }`.
- `satisfies` для объектов, где важна и проверка соответствия, и сохранение литерального типа.

## React 19 фичи, которые мы используем

- `React.lazy()` + `<Suspense>` для всего ниже фолда (CartDrawer, TableMap, BarMenuSection, BookingDialog, AdminApp).
- `use()` — для условного чтения промисов/контекстов (React 19).
- Server Components — **не применимы**, Vite SPA.

## Хуки

- `useEffect` — только для синхронизации с внешним миром (DOM, timers, subscriptions, API). Не для вычислений.
- Для дорогих вычислений — `useMemo`, но только после измерения, а не «на всякий случай».
- `useCallback` — только если функция передаётся в `React.memo`-компонент или в `useEffect`-зависимости.
- `useTransition` — для не-срочных обновлений (фильтрация меню, переключение разделов). Планируется в `planopt.md` F30.
- `useDeferredValue` — для поля поиска при большом списке.
- `useId` — для связывания label/input без ручной генерации.

## React.memo

- Применять только после профилирования в React DevTools.
- Не мемоизировать компоненты, которые всё равно ре-рендерятся из-за context.
- Если мемоизируешь — стабилизируй пропсы через `useCallback` / `useMemo`, иначе memo бесполезен.

## Производительность

- Lazy-чанки уже настроены в `vite.config.ts` (`react-vendor`, `router-vendor`, `icons-vendor`). Не ломать.
- Не импортировать `lucide-react` через `import { Phone } from 'lucide-react'` без deep-import: тянет барел.
  - Правильно: `import Phone from 'lucide-react/dist/esm/icons/phone'`.
- Не создавать объектов в JSX в рендере (`<X style={{...}}>`) — это новая ссылка каждый рендер.
- `IntersectionObserver` для пауз тяжёлых сабтри вне viewport.
- `requestIdleCallback` (с `setTimeout` fallback) для некритичной инициализации — см. `src/main.tsx`.

## Структура компонентов

- Один компонент — один файл.
- CSS рядом: `Foo.tsx` + `foo.css`, импорт стиля в начале TSX.
- Именованные экспорты предпочтительны: `export function Foo()`. Default-export — только для lazy-entry.
- Props типизируются inline для локальных компонентов, отдельным `type` — для публичных.

## Fallback-first данные

Железное правило проекта:

```tsx
const [menu, setMenu] = useState<MenuCategory[]>(fallbackMenu)

useEffect(() => {
  api.getMenu()
    .then((data) => Array.isArray(data) && setMenu(data))
    .catch(() => {
      /* остаёмся на fallback */
    })
}, [])
```

Если `/api/*` упал — сайт работает. `api.ts` в `src/lib/api.ts` уже кидает ошибку на non-JSON ответы.

## Socket.IO

- Подписка через `useRealtimeTables` хук.
- Unsubscribe в cleanup функции `useEffect`.
- Не дублировать соединения — всё через один singleton в хуке.

## Форма + отправка

- Кнопка submit блокируется на время запроса: `disabled={loading}`.
- После успеха — тост.
- После ошибки — внятное сообщение (не «Ошибка 500»).
- Оффлайн — через `api.createBooking`, там уже есть fallback в localStorage queue.

## StrictMode

- Включён в `main.tsx`. Все хуки должны переживать двойной mount в dev.
- В cleanup обязательно отписываемся от observers, таймеров, abort-controllers.

## Анти-паттерны

- Context для часто меняющегося состояния — вызывает лавину ре-рендеров. Используем локальный state или подстейт-контексты.
- `dangerouslySetInnerHTML` с пользовательским контентом без `DOMPurify`.
- `useEffect` без массива зависимостей.
- Side effects в рендере.
- Прямое чтение `window`/`document` в рендере без проверки `typeof window`.
