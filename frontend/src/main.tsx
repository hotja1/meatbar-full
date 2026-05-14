import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyPerfTierAttribute, installPerfTierReactivity } from './lib/perfTier'
import { flushQueuedBookings } from './lib/api'

function scheduleIdle(task: () => void, timeout = 1400) {
  if (typeof window === 'undefined') return
  const ric = (window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  }).requestIdleCallback
  if (typeof ric === 'function') {
    ric(() => task(), { timeout })
    return
  }
  window.setTimeout(task, 32)
}

// Perf tier is used for CSS/canvas fallbacks on older devices.
applyPerfTierAttribute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/* Task H42 — мягкий update-тост вместо моментального reload().
   Показываем subtle-уведомление «Обновление готово» с кнопкой
   «Обновить» — пользователь сам решает, а не теряет контекст. */
function showUpdateToast(onApply: () => void) {
  if (document.getElementById('sw-update-toast')) return
  const host = document.createElement('div')
  host.id = 'sw-update-toast'
  host.setAttribute('role', 'status')
  host.setAttribute('aria-live', 'polite')
  host.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:calc(20px + env(safe-area-inset-bottom))',
    'transform:translateX(-50%)',
    'z-index:2147483646',
    'display:flex',
    'gap:10px',
    'align-items:center',
    'padding:12px 16px',
    'background:rgba(18,13,10,0.96)',
    'color:#f6eee1',
    'border:1px solid rgba(224,166,75,0.36)',
    'border-radius:999px',
    'box-shadow:0 18px 50px rgba(0,0,0,0.48)',
    'font:500 13px/1.2 Inter,system-ui,sans-serif',
    'letter-spacing:0.02em',
    'max-width:min(92vw,460px)',
  ].join(';')

  const label = document.createElement('span')
  label.textContent = 'Обновление готово'
  label.style.cssText = 'color:#e0a64b;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:11px'

  const text = document.createElement('span')
  text.textContent = 'Перезагрузить страницу?'
  text.style.cssText = 'opacity:0.86'

  const apply = document.createElement('button')
  apply.type = 'button'
  apply.textContent = 'Обновить'
  apply.style.cssText = [
    'border:0',
    'padding:8px 14px',
    'border-radius:999px',
    'background:linear-gradient(135deg,#e41627,#821016)',
    'color:#fff',
    'font:700 12px/1 Inter,system-ui,sans-serif',
    'letter-spacing:0.06em',
    'text-transform:uppercase',
    'cursor:pointer',
  ].join(';')

  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.setAttribute('aria-label', 'Отложить обновление')
  dismiss.textContent = '×'
  dismiss.style.cssText = [
    'border:0',
    'padding:0 6px',
    'margin-left:4px',
    'background:transparent',
    'color:rgba(246,238,225,0.6)',
    'font:400 18px/1 system-ui',
    'cursor:pointer',
  ].join(';')

  apply.addEventListener('click', () => {
    host.remove()
    onApply()
  })
  dismiss.addEventListener('click', () => host.remove())

  host.appendChild(label)
  host.appendChild(text)
  host.appendChild(apply)
  host.appendChild(dismiss)
  document.body.appendChild(host)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  /* PWA upgrade-flow:
     1. при загрузке регистрируем sw.js
     2. сразу зовём reg.update() — заставляет браузер скачать новый SW
     3. Task H42: при установке нового SW показываем мягкий update-тост
        вместо внезапного reload(). Пользователь может отложить.
  */
  let updateToastShown = false

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {})
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)

        const askToUpdate = () => {
          if (updateToastShown) return
          updateToastShown = true
          showUpdateToast(() => {
            /* Текущий sw.js вызывает skipWaiting() сам — просто
               перезагружаем страницу по согласию. Если в будущем
               skipWaiting станет отложенным, попытаемся активировать
               ожидающий SW через message. */
            const waiting = reg.waiting
            if (waiting) {
              try {
                waiting.postMessage({ type: 'SKIP_WAITING' })
              } catch {
                /* noop */
              }
            }
            window.location.reload()
          })
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              askToUpdate()
            }
          })
        })
      })
      .catch(() => {})

    /* controllerchange продолжает работать: когда SW сам встал как
       активный контроллер — мы НЕ reload-им автоматически, если
       пользователь уже сам нажал «Обновить». Иначе один ре-лоад
       достаточно. */
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      /* Отдаём приоритет UX: если тост ещё не принят и он видим,
         пусть пользователь сам решит когда перезагрузиться. */
      if (!updateToastShown) {
        window.location.reload()
      }
    })
  })
}

// In local dev we must not keep stale SW caches; they can hide fresh
// assets and create "missing image" regressions during iteration.
if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      void reg.unregister()
    })
  }).catch(() => {})
}

/* Task G36 — реактивный пересчёт perf-tier на connection.change и
   смену prefers-reduced-motion без перезагрузки страницы. */
const disposePerfTier = installPerfTierReactivity()
void disposePerfTier

/* Task B8 — non-critical startup вынесен в idle через динамические
   импорты. Это исключает инициализационный код SEO/analytics/RUM из
   initial bundle — стартовый JS становится легче, а init работает
   когда основной UI уже интерактивен. */
scheduleIdle(() => {
  void import('./lib/rum').then((m) => m.initRum()).catch(() => {})
})
scheduleIdle(() => {
  void import('./lib/analytics-bootstrap')
    .then((m) => m.initAnalyticsIntegrations())
    .catch(() => {})
})
scheduleIdle(() => {
  void import('./lib/seo').then((m) => m.installSeoEnhancements()).catch(() => {})
})
scheduleIdle(() => {
  void flushQueuedBookings()
})

/* P2.6 — IntersectionObserver toggles .is-offscreen on elements with
   expensive CSS animations (fireGlow, grain, fire-flicker) so their
   animation-play-state pauses when not visible. */
scheduleIdle(() => {
  const targets = document.querySelectorAll(
    '.film-grain, .cinema-hero, .animated-fire-glow, [class*="fire-flicker"]',
  )
  if (targets.length === 0) return
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        e.target.classList.toggle('is-offscreen', !e.isIntersecting)
      }
    },
    { rootMargin: '200px' },
  )
  targets.forEach((el) => {
    el.classList.add('is-offscreen')
    io.observe(el)
  })
})

window.addEventListener('online', () => {
  void flushQueuedBookings()
})
