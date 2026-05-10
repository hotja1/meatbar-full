/* RUM (Real User Monitoring) — Phase 9.E.
 *
 * Подключаем web-vitals и отправляем 4 ключевые метрики:
 *  - CLS (cumulative layout shift)
 *  - LCP (largest contentful paint)
 *  - INP (interaction to next paint)  — заменил FID в v4
 *  - TTFB (time to first byte)
 *
 * Используется навигационный fetch keepalive. На бэкенде есть
 * легковесный endpoint /api/rum, куда складываются все события —
 * мы можем посчитать p50/p75/p95 без сторонних аналитик.
 *
 * Если /api/rum отвечает 404 — RUM просто молча не отправляется
 * и не ломает UX. Это сделано специально: в локальной dev-среде
 * RUM не обязан работать.
 */

import { onCLS, onLCP, onINP, onTTFB, type Metric } from 'web-vitals'

type RumPayload = {
  name: Metric['name'] | 'LONGTASK'
  value: number
  rating: Metric['rating']
  id: string
  navigationType: Metric['navigationType']
  delta: number
  /* Дополнительный контекст. */
  pathname: string
  ts: number
  ua: string
  conn?: string
  saveData?: boolean
  dpr?: number
  vw?: number
}

let queue: RumPayload[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function context() {
  if (typeof window === 'undefined') return {}
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
  }).connection
  return {
    pathname: window.location.pathname,
    ts: Date.now(),
    ua: navigator.userAgent,
    conn: conn?.effectiveType,
    saveData: conn?.saveData,
    dpr: window.devicePixelRatio,
    vw: window.innerWidth,
  }
}

function flush() {
  if (!queue.length) return
  const body = JSON.stringify({ events: queue })
  queue = []
  /* sendBeacon — лучший способ доставить события при unload. */
  try {
    if ('sendBeacon' in navigator) {
      const ok = navigator.sendBeacon('/api/rum', new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
  } catch {
    /* fall through */
  }
  /* Fallback — fetch keepalive (отрабатывает даже после unload в современных браузерах). */
  try {
    fetch('/api/rum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* nothing */
  }
}

function record(m: Metric) {
  const ctx = context()
  queue.push({
    name: m.name,
    value: m.value,
    rating: m.rating,
    id: m.id,
    navigationType: m.navigationType,
    delta: m.delta,
    ...(ctx as Omit<RumPayload, 'name' | 'value' | 'rating' | 'id' | 'navigationType' | 'delta'>),
  })
  /* Батчим до 1.2 с — большинство web-vitals прилетает в первые
     несколько секунд, дальше будет хвост INP. */
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, 1200)
}

function longTaskRating(duration: number): Metric['rating'] {
  if (duration < 100) return 'good'
  if (duration < 200) return 'needs-improvement'
  return 'poor'
}

function recordLongTask(duration: number, startTime: number) {
  const ctx = context()
  queue.push({
    name: 'LONGTASK',
    value: duration,
    rating: longTaskRating(duration),
    id: `lt-${Math.round(startTime)}-${Math.round(duration)}`,
    navigationType: 'navigate',
    delta: duration,
    ...(ctx as Omit<RumPayload, 'name' | 'value' | 'rating' | 'id' | 'navigationType' | 'delta'>),
  })
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, 1200)
}

export function initRum() {
  if (typeof window === 'undefined') return
  /* Если пользователь явно отказался от телеметрии — уважаем. */
  try {
    if (window.localStorage?.getItem('rum.disabled') === '1') return
  } catch {
    /* private mode и т.п. */
  }

  onCLS(record)
  onLCP(record)
  onINP(record)
  onTTFB(record)

  // Phase 9.E pass 6: capture long main-thread tasks (>50ms) so we can
  // correlate interaction jank with device/network tiers in RUM.
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          recordLongTask(entry.duration, entry.startTime)
        }
      })
      observer.observe({ type: 'longtask', buffered: true })
    } catch {
      /* longtask not supported in this browser */
    }
  }

  /* На pagehide / visibilitychange сбрасываем буфер сразу. */
  const onHide = () => flush()
  window.addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
