import { useEffect, useRef } from 'react'
import { detectPerfTier } from '../lib/perfTier'
import { subscribeRaf } from '../lib/rafScheduler'

type EmberFieldProps = {
  className?: string
  /** target embers alive at any time; clamped down on mobile */
  density?: number
}

type Ember = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  hue: number
  /** flame ring (true) vs bright spark (false) */
  ring: boolean
}

/**
 * EmberField — a canvas of ambient flying fire embers that float
 * upward across the hero section. We emit a steady stream of small
 * orange/yellow circles ("кружки пламени") plus occasional brighter
 * sparks. Particles wrap to the bottom once they exit the top.
 *
 * Performance:
 * - IntersectionObserver pauses rAF when offscreen.
 * - prefers-reduced-motion: render zero embers and exit.
 * - density auto-clamps on (max-width: 768px).
 * - DPR clamped to 2.
 */
export function EmberField({ className, density = 90 }: EmberFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const mobile = window.matchMedia('(max-width: 768px)').matches
    const tier = detectPerfTier()
    const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    const densityMul = mobile ? (tier === 'low' ? 0.4 : 0.55) : 1
    const target = mobile ? Math.round(density * densityMul) : density

    let width = 0
    let height = 0
    const embers: Ember[] = []
    let last = performance.now()
    let visible = true
    let unsubscribe: null | (() => void) = null

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const resize = () => {
      const parent = canvas.parentElement
      width = (parent?.clientWidth ?? canvas.clientWidth) || width || 800
      height = (parent?.clientHeight ?? canvas.clientHeight) || height || 600
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (initial = false) => {
      const ring = Math.random() < 0.78
      embers.push({
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + Math.random() * 30,
        vx: (Math.random() - 0.5) * 22,
        // Slower rise so each ember is on screen long enough to read
        vy: ring ? -14 - Math.random() * 22 : -26 - Math.random() * 40,
        life: 0,
        max: ring ? 5.5 + Math.random() * 5 : 2.4 + Math.random() * 2,
        // Much bigger flame circles — user explicitly asked for visible
        // "кружки пламени".
        size: ring ? 4.5 + Math.random() * 6 : 1.4 + Math.random() * 1.6,
        hue: ring ? 18 + Math.random() * 26 : 38 + Math.random() * 12,
        ring,
      })
    }

    for (let i = 0; i < target; i++) spawn(true)

    const FRAME_INTERVAL = 1000 / 30
    let lastFrame = 0
    let smoothedFps = 30
    let quality: 'low' | 'mid' | 'high' = tier === 'low' ? 'low' : 'mid'

    const draw = (now: number) => {
      if (!visible) {
        last = now
        return
      }
      if (now - lastFrame < FRAME_INTERVAL) {
        return
      }
      lastFrame = now
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      const fps = 1 / Math.max(0.001, dt)
      smoothedFps = smoothedFps * 0.9 + fps * 0.1
      quality = smoothedFps < 26 ? 'low' : smoothedFps < 42 ? 'mid' : 'high'

      const qualityMul = quality === 'low' ? 0.58 : quality === 'mid' ? 0.78 : 1
      const effectiveTarget = Math.max(
        mobile ? 10 : 22,
        Math.round(target * qualityMul),
      )

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]
        e.life += dt
        if (e.life >= e.max || e.y < -20) {
          embers.splice(i, 1)
          continue
        }
        e.x += e.vx * dt + Math.sin(e.life * 1.7 + i) * 0.4
        e.y += e.vy * dt
        // tiny upward acceleration so embers accelerate as they rise (heat)
        e.vy -= 6 * dt
        e.vx *= 0.985

        const k = e.life / e.max
        if (e.ring) {
          // Soft warm circle of flame
          const r = e.size + k * 2.4
          const a = (1 - k) * 1
          const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 4)
          grad.addColorStop(0, `hsla(${e.hue}, 100%, ${72 - k * 24}%, ${a})`)
          grad.addColorStop(0.4, `hsla(${e.hue - 8}, 100%, ${52 - k * 18}%, ${a * 0.55})`)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(e.x, e.y, r * 3.6, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // bright spark
          ctx.fillStyle = `rgba(255, ${220 - k * 90}, ${130 - k * 90}, ${(1 - k) * 0.95})`
          ctx.beginPath()
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalCompositeOperation = 'source-over'

      // top up to target population (cap spawns per frame for stability)
      const need = effectiveTarget - embers.length
      const cap = tier === 'low' ? 2 : 4
      for (let i = 0; i < Math.min(need, cap); i++) spawn(false)

    }

    resize()
    const onResize = () => {
      resize()
    }
    window.addEventListener('resize', onResize)
    last = performance.now()

    // Low-tier: render a still ember field (no continuous rAF) to avoid
    // scroll jank on old iOS/Android while keeping the "premium warmth".
    if (tier === 'low') {
      // Reduce population further for a crisp still-frame.
      embers.splice(0, embers.length)
      for (let i = 0; i < Math.min(12, target); i++) spawn(true)
      draw(last)
      return () => {
        window.removeEventListener('resize', onResize)
        observer.disconnect()
      }
    }

    unsubscribe = subscribeRaf(({ now }) => draw(now))
    return () => {
      unsubscribe?.()
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className={`ember-field ${className ?? ''}`.trim()}
      aria-hidden="true"
    />
  )
}
