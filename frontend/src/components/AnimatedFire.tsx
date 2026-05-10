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
        const hue = 18 + Math.random() * 24
        const lightness = 60 - Math.random() * 18
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
        grad.addColorStop(0, `hsla(${hue}, 100%, ${lightness}%, ${alpha})`)
        grad.addColorStop(0.5, `hsla(${hue - 8}, 100%, ${Math.max(20, lightness - 15)}%, ${alpha * 0.55})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
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

    const FRAME_INTERVAL = 1000 / 30
    let lastFrame = 0

    const tick = (time: number) => {
      if (!visible) {
        return
      }
      if (time - lastFrame < FRAME_INTERVAL) {
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
        const hue = p.hue + t * 6
        const lightness = 60 - t * 40
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
        grad.addColorStop(0, `hsla(${hue}, 100%, ${lightness}%, ${alpha})`)
        grad.addColorStop(0.4, `hsla(${hue - 8}, 100%, ${Math.max(20, lightness - 15)}%, ${alpha * 0.55})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()
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
      }
    }

    unsubscribe = subscribeRaf(({ now }) => tick(now))
    return () => {
      unsubscribe?.()
      observer.disconnect()
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
