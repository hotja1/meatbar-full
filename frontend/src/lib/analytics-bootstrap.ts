import { trackPageView } from './analytics'

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

function appendScript(id: string, src: string, onload?: () => void) {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  if (onload) script.onload = onload
  document.head.appendChild(script)
}

function initGa4(measurementId: string) {
  if (!measurementId) return
  appendScript(`ga4-${measurementId}`, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`, () => {
    window.dataLayer = window.dataLayer ?? []
    if (typeof window.gtag !== 'function') {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer!.push({ gtag_args: args })
      }
    }
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    })
    trackPageView()
  })
}

function initYandexMetrika(counterId: number) {
  if (!(counterId > 0)) return
  appendScript(`ym-${counterId}`, 'https://mc.yandex.ru/metrika/tag.js', () => {
    if (typeof window.ym === 'function') {
      window.ym(counterId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: false,
      })
      trackPageView()
    }
  })
}

export function initAnalyticsIntegrations() {
  if (typeof window === 'undefined') return
  const ga4Id = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
  const ymCounterId = Number(import.meta.env.VITE_YM_COUNTER_ID ?? 0)

  initGa4(ga4Id)
  initYandexMetrika(ymCounterId)

  const onHashChange = () => trackPageView()
  window.addEventListener('hashchange', onHashChange)
}
