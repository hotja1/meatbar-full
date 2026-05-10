import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initRum } from './lib/rum'
import { applyPerfTierAttribute } from './lib/perfTier'
import { flushQueuedBookings } from './lib/api'
import { installSeoEnhancements } from './lib/seo'
import { initAnalyticsIntegrations } from './lib/analytics-bootstrap'

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

// SEO runtime extras: canonical/og:url from real host + section-based
// title/description updates for hash navigation.
const disposeSeo = installSeoEnhancements()
void disposeSeo

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  /* PWA upgrade-flow (iter3):
     1. при загрузке регистрируем sw.js
     2. сразу зовём reg.update() — заставляет браузер скачать новый SW
        даже если PWA остался открыт неделю
     3. если активный контроллер сменился — мягкий reload, чтобы
        пользователь получил свежий бандл (а не «версия не соответствует»)
  */
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update().catch(() => {})
        /* периодически проверяем апдейты, если PWA-сессия живёт долго */
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
      })
      .catch(() => {})

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
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

/* Phase 9.E — non-critical startup work is deferred to idle time
   so first paint and first interactions stay responsive on old phones. */
scheduleIdle(() => {
  initRum()
})
scheduleIdle(() => {
  initAnalyticsIntegrations()
})

// Offline-booking queue: retry pending bookings on boot and whenever
// the browser regains connectivity.
scheduleIdle(() => {
  void flushQueuedBookings()
})
window.addEventListener('online', () => {
  void flushQueuedBookings()
})
