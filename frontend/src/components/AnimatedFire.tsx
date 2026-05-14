import { useEffect, useRef } from 'react'
import './fire.css'
import { detectPerfTier } from '../lib/perfTier'
import { subscribeRaf } from '../lib/rafScheduler'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

type AnimatedFireProps = {
  width?: number
  height?: number
  intensity?: number
  className?: string
  ariaLabel?: string
}

/*
 * P1.1 — Pre-baked radial-gradient cache shared across AnimatedFire
 * instances. Header has 1 instance but it paints many particles per
 * frame; replacing per-frame createRadialGradient with drawImage is
 * a meaningful paint-time win.
 */
const AF_RING_COUNT = 12
const AF_SPRITE_R = 28
let afRingCache: HTMLCanvasElement[] | null = null
let afRingDpr = 0

function getAfRingCache(dpr: number): HTMLCanvasElement[] {
  if (afRingCache && afRingDpr === dpr) return afRingCache
  const list: HTMLCanvasElement[] = []
  const r = AF_SPRITE_R * dpr
  for (let i = 0; i < AF_RING_COUNT; i++) {
    // hue range 18..42 covers red→yellow flame palette used here
    const hue = 18 + ((42 - 18) * i) / (AF_RING_COUNT - 1)
    const c = document.createElement('canvas')
    c.width = r * 2
    c.height = r * 2
    const g = c.getContext('2d')
    if (!g) continue
    const grad = g.createRadialGradient(r, r, 0, r, r, r)
    grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 1)`)
    grad.addColorStop(0.4, `hsla(${hue - 8}, 100%, 45%, 0.55)`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, r * 2, r * 2)
    list.push(c)
  }
  afRingCache = list
  afRingDpr = dpr
  return list
}

/**
 * Premium canvas-based animated fire — additive-blend particles
 * with smoke, sparks and pulsing core. Uses requestAnimationFrame
 * and pauses when off-screen.
 */
export function AnimatedFire({
  width = 80,
  height = 96,
  intensity = 1,
  className,
  ariaLabel,
}: AnimatedFireProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const tier = detectPerfTier()
    const mobile = window.matchMedia?.('(max-width: 768px)')?.matches ?? false
    const dpr = mobile || tier === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // P1.1 — shared ring-gradient sprites, built once per DPR.
    const rings = getAfRingCache(dpr)

    const particles: Particle[] = []
    const sparks: Spark[] = []
    let unsubscribe: null | (() => void) = null
    let lastSpawn = 0
    let visible = true

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const baseY = height - 8
    const cx = width / 2

    const renderStill = () => {
      ctx.clearRect(0, 0, width, height)
      const baseGrad = ctx.createRadialGradient(cx, baseY, 2, cx, baseY, width * 0.6)
      baseGrad.addColorStop(0, 'rgba(255, 178, 80, 0.55)')
      baseGrad.addColorStop(0.4, 'rgba(216, 60, 30, 0.32)')
      baseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = baseGrad
      ctx.beginPath()
      ctx.ellipse(cx, baseY, width * 0.5, height * 0.18, 0, 0, Math.PI * 2)
      ctx.fill()

      // A few fixed embers to keep the "alive" look without rAF.
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 10; i++) {
        const x = cx + (Math.random() - 0.5) * width * 0.5
        const y = baseY - 10 - Math.random() * height * 0.55
        const radius = 3 + Math.random() * 6
        const alpha = 0.35 + Math.random() * 0.35
        const hueIdx = Math.floor(Math.random() * AF_RING_COUNT)
        const sprite = rings[hueIdx]
        if (sprite) {
          ctx.globalAlpha = alpha
          ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2)
          ctx.globalAlpha = 1
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const spawnParticle = () => {
      const offset = (Math.random() - 0.5) * width * 0.4
      const maxLife = 40 + Math.random() * 50
      particles.push({
        x: cx + offset,
        y: baseY,
        vx: offset * 0.012,
        vy: -1.2 - Math.random() * 1.4,
        life: 0,
        maxLife,
        size: 5 + Math.random() * 7,
        hue: 18 + Math.random() * 24, // 18 (red) → 42 (yellow)
      })
    }
    const spawnSpark = () => {
      sparks.push({
        x: cx + (Math.random() - 0.5) * width * 0.5,
        y: baseY - 4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2 - Math.random() * 2.4,
        life: 0,
      })
    }

    const FRAME_INTERVAL = 1000 / 24
    // P1.3 — throttle down to 12 fps when user scrolled below the hero.
    // The header's AnimatedFire is always technically on-screen
    // (sticky header), so IntersectionObserver alone can't slow it.
    // We read window.scrollY inside the tick (cheap) and bump the
    // interval when the hero is no longer visible.
    const FRAME_INTERVAL_SLOW = 1000 / 12
    // A1: Ещё медленнее когда далеко от hero (>2vh) — почти стоп-кадр
    const FRAME_INTERVAL_CRAWL = 1000 / 6
    let lastFrame = 0
    let scrolledPastHero = false
    let scrolledFarFromHero = false
    const updateScrollFlag = () => {
      // "Past hero" ≈ scrolled more than 70% of viewport height.
      scrolledPastHero = window.scrollY > window.innerHeight * 0.7
      // "Far from hero" ≈ scrolled more than 2 viewport heights.
      scrolledFarFromHero = window.scrollY > window.innerHeight * 2
    }
    updateScrollFlag()
    window.addEventListener('scroll', updateScrollFlag, { passive: true })

    const tick = (time: number) => {
      if (!visible) {
        return
      }
      const interval = scrolledFarFromHero ? FRAME_INTERVAL_CRAWL : scrolledPastHero ? FRAME_INTERVAL_SLOW : FRAME_INTERVAL
      if (time - lastFrame < interval) {
        return
      }
      lastFrame = time
      ctx.clearRect(0, 0, width, height)

      // base ember glow
      const baseGrad = ctx.createRadialGradient(cx, baseY, 2, cx, baseY, width * 0.6)
      baseGrad.addColorStop(0, 'rgba(255, 178, 80, 0.55)')
      baseGrad.addColorStop(0.4, 'rgba(216, 60, 30, 0.32)')
      baseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = baseGrad
      ctx.beginPath()
      ctx.ellipse(cx, baseY, width * 0.5, height * 0.18, 0, 0, Math.PI * 2)
      ctx.fill()

      const spawnRate = Math.max(0.4, intensity) * (tier === 'low' ? 0.85 : 1)
      while (time - lastSpawn > 14 / spawnRate) {
        spawnParticle()
        if (Math.random() < 0.32) spawnSpark()
        lastSpawn += 14 / spawnRate
      }

      // Particles
      ctx.globalCompositeOperation = 'lighter'
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += 1
        const t = p.life / p.maxLife
        if (t >= 1) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx + Math.sin(p.life * 0.18 + p.maxLife) * 0.18
        p.y += p.vy
        p.vy *= 0.984
        p.vx *= 0.985
        const radius = p.size * (1 - t * 0.4)
        const alpha = (1 - t) * 0.85
        // P1.1 — pick pre-baked sprite by hue bin and blit.
        const bin = Math.min(
          AF_RING_COUNT - 1,
          Math.max(0, Math.floor(((p.hue - 18) / 24) * AF_RING_COUNT)),
        )
        const sprite = rings[bin]
        if (sprite) {
          ctx.globalAlpha = alpha
          ctx.drawImage(sprite, p.x - radius, p.y - radius, radius * 2, radius * 2)
          ctx.globalAlpha = 1
        }
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += 1
        if (s.life > 60) {
          sparks.splice(i, 1)
          continue
        }
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.04
        const t = s.life / 60
        ctx.fillStyle = `rgba(255, ${200 - t * 90}, ${110 - t * 70}, ${(1 - t) * 0.95})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

    }

    if (tier === 'low') {
      renderStill()
      return () => {
        observer.disconnect()
        window.removeEventListener('scroll', updateScrollFlag)
      }
    }

    unsubscribe = subscribeRaf(({ now }) => tick(now))
    return () => {
      unsubscribe?.()
      observer.disconnect()
      window.removeEventListener('scroll', updateScrollFlag)
    }
  }, [width, height, intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`animated-fire ${className ?? ''}`.trim()}
      role="img"
      aria-label={ariaLabel ?? 'Анимированный огонь'}
    />
  )
}
