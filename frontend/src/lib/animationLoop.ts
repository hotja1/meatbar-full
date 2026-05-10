/* Adaptive rAF loop helper (Phase 9.A).
 *
 * Поверх обычного requestAnimationFrame:
 *  - Возвращает delta-time в секундах.
 *  - Вычисляет скользящее среднее времени кадра и рекомендует
 *    `quality` ∈ {low | mid | high} на основе FPS.
 *      ≥ 50 fps → high
 *      ≥ 30 fps → mid
 *      <  30 fps → low
 *  - Авто-пауза по visibility (visibilityState !== 'visible').
 *  - Опциональный target FPS (через шаг по millisecond budget).
 *
 * Используется компонентами с canvas (EmberField, AnimatedFire,
 * DriftingClouds), чтобы динамически снижать плотность частиц или
 * частоту кадров на слабых устройствах. */

export type Quality = 'low' | 'mid' | 'high'

export type AnimationLoopOptions = {
  /** Целевой FPS (по умолчанию 60). Используется для frame-skip. */
  targetFps?: number
  /** Окно усреднения (кадров). */
  fpsWindow?: number
}

export type AnimationTickArgs = {
  dt: number
  now: number
  fps: number
  quality: Quality
}

export type AnimationLoopHandle = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
  getQuality: () => Quality
}

export function createAnimationLoop(
  tick: (args: AnimationTickArgs) => void,
  opts: AnimationLoopOptions = {},
): AnimationLoopHandle {
  const targetFps = opts.targetFps ?? 60
  const targetMs = 1000 / targetFps
  const fpsWindow = opts.fpsWindow ?? 30

  let raf = 0
  let last = 0
  let running = false
  let lastFrame = 0
  const samples: number[] = []
  let quality: Quality = 'high'

  function loop(now: number) {
    if (!running) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      raf = requestAnimationFrame(loop)
      return
    }
    if (now - lastFrame < targetMs * 0.95) {
      raf = requestAnimationFrame(loop)
      return
    }
    const dt = (now - (last || now)) / 1000
    last = now

    /* Усреднённая FPS оценка. */
    if (lastFrame) {
      const frameMs = now - lastFrame
      samples.push(frameMs)
      if (samples.length > fpsWindow) samples.shift()
      const avgMs = samples.reduce((s, v) => s + v, 0) / samples.length
      const fps = 1000 / Math.max(1, avgMs)
      quality = fps >= 50 ? 'high' : fps >= 30 ? 'mid' : 'low'
      tick({ dt: Math.min(0.1, dt), now, fps, quality })
    } else {
      tick({ dt: Math.min(0.1, dt), now, fps: targetFps, quality })
    }
    lastFrame = now
    raf = requestAnimationFrame(loop)
  }

  return {
    start() {
      if (running) return
      running = true
      lastFrame = 0
      last = 0
      samples.length = 0
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    },
    isRunning: () => running,
    getQuality: () => quality,
  }
}
