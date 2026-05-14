export type PerfTier = 'low' | 'mid' | 'high'

function safeNumber(n: unknown): number | null {
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function getIOSMajorVersion(): number | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  // iPhone OS 15_7 like
  const m = ua.match(/iPhone OS (\d+)[._]/)
  if (!m) return null
  const v = Number.parseInt(m[1] ?? '', 10)
  return Number.isFinite(v) ? v : null
}

export function detectPerfTier(): PerfTier {
  if (typeof window === 'undefined') return 'high'

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  const mobile = window.matchMedia?.('(max-width: 768px)')?.matches ?? false

  // Network save-data is a strong signal to reduce background work.
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection
  const saveData = Boolean(conn?.saveData)

  const hc = safeNumber((navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency)
  const iOSMajor = getIOSMajorVersion()

  // Conservative heuristics:
  // - iPhone 7/8 class devices are typically iOS 15.x and struggle with heavy blur/canvas.
  // - Low core-count mobile devices should avoid expensive background animation.
  const likelyOldIOS = mobile && iOSMajor !== null && iOSMajor <= 15
  const lowCores = mobile && hc !== null && hc <= 4

  if (reducedMotion) return 'low'
  if (saveData) return 'low'
  if (likelyOldIOS) return 'low'
  if (lowCores) return 'low'

  if (mobile) return 'mid'
  return 'high'
}

export function applyPerfTierAttribute() {
  if (typeof document === 'undefined') return
  const tier = detectPerfTier()
  document.documentElement.dataset.perf = tier
}

/*
 * Task G36 — динамически пересчитывает `data-perf` при реальной смене
 * условий: `navigator.connection.change` (4G → 2G при переходе в
 * метро/пригород), смена `prefers-reduced-motion` или ориентации
 * экрана. Возвращает cleanup-функцию.
 */
export function installPerfTierReactivity(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  const refresh = () => {
    const tier = detectPerfTier()
    if (document.documentElement.dataset.perf !== tier) {
      document.documentElement.dataset.perf = tier
    }
  }

  const conn = (navigator as Navigator & {
    connection?: EventTarget & { saveData?: boolean; effectiveType?: string }
  }).connection
  conn?.addEventListener?.('change', refresh)

  const mqReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const mqMobile = window.matchMedia?.('(max-width: 768px)')
  /* Safari < 14 поддерживает только deprecated addListener; современные
     браузеры — addEventListener. Обработчик универсален. */
  mqReduced?.addEventListener?.('change', refresh)
  mqMobile?.addEventListener?.('change', refresh)

  return () => {
    conn?.removeEventListener?.('change', refresh)
    mqReduced?.removeEventListener?.('change', refresh)
    mqMobile?.removeEventListener?.('change', refresh)
  }
}

