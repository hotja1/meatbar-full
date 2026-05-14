export type RafTick = {
  now: number
  dt: number
  fps: number
}

type Subscriber = (tick: RafTick) => void

let rafId = 0
let running = false
let lastNow = 0
let lastFrameNow = 0
const frameSamples: number[] = []
const subscribers = new Set<Subscriber>()

/* C7: Staggered resume — при возврате на вкладку не запускаем все
   canvas разом. Первые 600ms после visibility=visible пропускаем
   подписчиков по одному с интервалом, чтобы GPU не получил burst. */
let resumeTs = 0

function computeFps(now: number) {
  if (!lastFrameNow) {
    lastFrameNow = now
    return 60
  }
  const frameMs = now - lastFrameNow
  lastFrameNow = now
  frameSamples.push(frameMs)
  if (frameSamples.length > 30) frameSamples.shift()
  const avgMs = frameSamples.reduce((s, v) => s + v, 0) / Math.max(1, frameSamples.length)
  return 1000 / Math.max(1, avgMs)
}

function loop(now: number) {
  if (!running) return
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    rafId = requestAnimationFrame(loop)
    return
  }
  const dt = Math.min(0.05, (now - (lastNow || now)) / 1000 || 0.016)
  lastNow = now
  const fps = computeFps(now)
  const tick: RafTick = { now, dt, fps }

  // C7: staggered resume — limit active subscribers during first 600ms after tab return
  const sinceResume = now - resumeTs
  if (sinceResume < 600 && resumeTs > 0) {
    // Allow progressively more subscribers each 150ms
    const allowedCount = Math.min(subscribers.size, Math.floor(sinceResume / 150) + 1)
    let i = 0
    for (const sub of subscribers) {
      if (i >= allowedCount) break
      sub(tick)
      i++
    }
  } else {
    for (const sub of subscribers) sub(tick)
  }

  rafId = requestAnimationFrame(loop)
}

// Track tab visibility for staggered resume
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      resumeTs = performance.now()
      // Reset timing so first frame after resume doesn't have huge dt
      lastNow = 0
      lastFrameNow = 0
      frameSamples.length = 0
    }
  })
}

export function subscribeRaf(sub: Subscriber) {
  subscribers.add(sub)
  if (!running && typeof window !== 'undefined') {
    running = true
    lastNow = 0
    lastFrameNow = 0
    frameSamples.length = 0
    rafId = requestAnimationFrame(loop)
  }
  return () => {
    subscribers.delete(sub)
    if (subscribers.size === 0) {
      running = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      lastNow = 0
      lastFrameNow = 0
      frameSamples.length = 0
    }
  }
}
