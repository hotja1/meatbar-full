type EventParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
    ym?: (
      counterId: number,
      method: string,
      arg1?: string | Record<string, unknown>,
      arg2?: Record<string, unknown>,
    ) => void
  }
}

const YM_COUNTER_ID = Number(import.meta.env.VITE_YM_COUNTER_ID ?? 0)

function sanitizeParams(params: EventParams) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue
    out[key] = value
  }
  return out
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  const clean = sanitizeParams(params)

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({ event: name, ...clean })

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, clean)
  }

  if (YM_COUNTER_ID > 0 && typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'reachGoal', name, clean)
  }
}

export function trackPageView(path: string = window.location.pathname + window.location.hash) {
  if (typeof window === 'undefined') return
  const url = `${window.location.origin}${path}`

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push({
    event: 'page_view',
    page_path: path,
    page_location: url,
  })

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: url,
    })
  }

  if (YM_COUNTER_ID > 0 && typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'hit', path)
  }
}
