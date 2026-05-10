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
  for (const sub of subscribers) sub(tick)
  rafId = requestAnimationFrame(loop)
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

