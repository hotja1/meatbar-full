import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import './firetext.css'
import { detectPerfTier } from '../lib/perfTier'

type FireTextProps = {
  children: string
  as?: ElementType
  className?: string
  delay?: number
  intensity?: 'soft' | 'strong' | 'cinder'
  stagger?: number
  sweeps?: number
  ariaLabel?: string
  repeatInterval?: number
}

export function FireText({
  children,
  as: Tag = 'span',
  className = '',
  delay = 0,
  intensity = 'strong',
  stagger = 32,
  sweeps = 1,
  ariaLabel,
  repeatInterval = 30,
}: FireTextProps) {
  const text = String(children)
  const words = text.split(' ')
  let charIndex = 0

  const nodes: ReactNode[] = []
  words.forEach((word, wi) => {
    const chars: ReactNode[] = []
    ;[...word].forEach((ch, ci) => {
      const animDelay = delay + charIndex * stagger
      charIndex += 1
      chars.push(
        <span
          key={`c-${wi}-${ci}`}
          className="ft-char"
          aria-hidden="true"
          style={{ '--char-delay': `${animDelay}ms` } as CSSProperties}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>,
      )
    })
    nodes.push(
      <span key={`w-${wi}`} className="ft-word">
        {chars}
      </span>,
    )
    if (wi < words.length - 1) {
      nodes.push(
        <span key={`s-${wi}`} className="ft-space">
          {'\u00A0'}
        </span>,
      )
    }
  })

  const totalLetters = charIndex
  const revealDurationMs = delay + totalLetters * stagger + 1200

  const containerRef = useRef<HTMLSpanElement | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)
  const [phase, setPhase] = useState<'hidden' | 'burning' | 'revealed' | 'fading'>('hidden')
  const [animKey, setAnimKey] = useState(0)

  const startBurn = useCallback(() => {
    setPhase('hidden')
    requestAnimationFrame(() => {
      setAnimKey((k) => k + 1)
      setPhase('burning')
    })
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setPhase('revealed')
      return
    }

    const tier = detectPerfTier()
    // On low-tier devices the fire repeat can cause periodic jank.
    // Keep the same premium first reveal, but repeat less frequently.
    const effectiveRepeatInterval = tier === 'low' ? Math.max(120, repeatInterval) : repeatInterval

    let isVisible = false
    let hasStarted = false
    let repeatTimer: ReturnType<typeof setTimeout> | null = null
    let revealTimer: ReturnType<typeof setTimeout> | null = null
    let fadeTimer: ReturnType<typeof setTimeout> | null = null

    const clearTimers = () => {
      if (repeatTimer) clearTimeout(repeatTimer)
      if (revealTimer) clearTimeout(revealTimer)
      if (fadeTimer) clearTimeout(fadeTimer)
    }

    const scheduleRepeat = () => {
      clearTimers()
      if (effectiveRepeatInterval <= 0) return
      repeatTimer = setTimeout(() => {
        if (isVisible) {
          setPhase('fading')
          fadeTimer = setTimeout(() => {
            if (isVisible) {
              startBurn()
              revealTimer = setTimeout(() => {
                setPhase('revealed')
                scheduleRepeat()
              }, revealDurationMs)
            }
          }, 800)
        }
      }, effectiveRepeatInterval * 1000)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        isVisible = entry.isIntersecting

        if (isVisible && !hasStarted) {
          hasStarted = true
          startBurn()
          revealTimer = setTimeout(() => {
            setPhase('revealed')
            scheduleRepeat()
          }, revealDurationMs)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      clearTimers()
    }
  }, [startBurn, revealDurationMs, repeatInterval])

  const phaseClass =
    phase === 'hidden'
      ? 'ft-phase-hidden'
      : phase === 'burning'
        ? 'ft-phase-burning'
        : phase === 'fading'
          ? 'ft-phase-fading'
          : 'ft-phase-revealed'

  return (
    <Tag
      ref={rootRef}
      className={`firetext firetext-${intensity} ${phaseClass} ${className}`.trim()}
      aria-label={ariaLabel ?? text}
    >
      <span className="ft-sr">{text}</span>
      <span className="ft-visual" ref={containerRef} aria-hidden="true" key={animKey}>
        {nodes}
      </span>
      {phase === 'burning' ? (
        <FireCanvas
          key={`fire-${animKey}`}
          containerRef={containerRef}
          startDelay={delay}
          duration={revealDurationMs}
          sweeps={sweeps}
          intensity={intensity}
        />
      ) : null}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */

type FireCanvasProps = {
  containerRef: React.RefObject<HTMLSpanElement | null>
  startDelay: number
  duration: number
  sweeps: number
  intensity: 'soft' | 'strong' | 'cinder'
}

/**
 * Fire particles rendered on canvas, clipped to text shape.
 * Approach: draw fire first, then use destination-in with text mask
 * so only fire pixels inside letter outlines survive.
 * The white text itself is never visible on the canvas.
 */
function FireCanvas({
  containerRef,
  startDelay,
  duration,
  sweeps,
  intensity,
}: FireCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const host = containerRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    if (typeof window === 'undefined') return
    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mobile = window.matchMedia('(max-width: 768px)').matches
    const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let started = false
    let raf = 0
    let startTs = 0

    const cs = getComputedStyle(host)
    const fontFamily = cs.fontFamily
    const fontSize = parseFloat(cs.fontSize)
    const fontWeight = cs.fontWeight
    const fontStyle = cs.fontStyle

    // Offscreen canvas for text mask
    let maskCanvas: OffscreenCanvas | HTMLCanvasElement
    let maskCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
    try {
      maskCanvas = new OffscreenCanvas(1, 1)
      maskCtx = maskCanvas.getContext('2d')
    } catch {
      maskCanvas = document.createElement('canvas')
      maskCtx = (maskCanvas as HTMLCanvasElement).getContext('2d')
    }

    const resize = () => {
      const cr = canvas.getBoundingClientRect()
      width = Math.max(1, Math.ceil(cr.width))
      height = Math.max(1, Math.ceil(cr.height))
      canvas.width = width * dpr
      canvas.height = height * dpr
      maskCanvas.width = width * dpr
      maskCanvas.height = height * dpr
    }

    const updateTextMask = () => {
      if (!maskCtx) return
      maskCtx.setTransform(1, 0, 0, 1, 0, 0)
      maskCtx.scale(dpr, dpr)
      maskCtx.clearRect(0, 0, width, height)
      maskCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
      maskCtx.fillStyle = '#fff'
      maskCtx.textBaseline = 'top'

      const charSpans = host.querySelectorAll('.ft-char')
      if (charSpans.length === 0) return
      const hostRect = host.getBoundingClientRect()

      charSpans.forEach((span) => {
        const el = span as HTMLElement
        const rect = el.getBoundingClientRect()
        const x = rect.left - hostRect.left
        const y = rect.top - hostRect.top
        const char = el.textContent || ''
        maskCtx!.fillText(char, x, y)
      })
    }

    type P = {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      max: number
      size: number
      hue: number
    }
    const particles: P[] = []

    const palette =
      intensity === 'cinder'
        ? { hueLow: 6, hueHigh: 28, alpha: 1 }
        : intensity === 'soft'
          ? { hueLow: 14, hueHigh: 42, alpha: 0.85 }
          : { hueLow: 8, hueHigh: 50, alpha: 1 }

    const totalDuration = duration
    const sweepWindow = totalDuration / (sweeps + 0.3)

    const spawnAt = (waveX: number, waveStrength: number) => {
      const count = Math.round(8 * waveStrength)
      for (let i = 0; i < count; i++) {
        const x = waveX + (Math.random() - 0.5) * 35
        const y = Math.random() * height
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.6 - Math.random() * 1.0,
          life: 0,
          max: 16 + Math.random() * 20,
          size: 8 + Math.random() * 14,
          hue: palette.hueLow + Math.random() * (palette.hueHigh - palette.hueLow),
        })
      }
    }

    const FRAME_INTERVAL = 1000 / 30
    let lastFrame = 0

    const draw = (ts: number) => {
      if (!started) {
        startTs = ts
        started = true
      }
      const elapsed = ts - startTs

      if (elapsed > totalDuration + 500) return

      if (ts - lastFrame < FRAME_INTERVAL) {
        raf = requestAnimationFrame(draw)
        return
      }
      lastFrame = ts

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      // Step 1: Draw fire particles with normal compositing
      ctx.globalCompositeOperation = 'source-over'

      const tNorm = elapsed / sweepWindow
      const sweepIdx = Math.floor(tNorm)
      const local = tNorm - sweepIdx

      if (sweepIdx < sweeps) {
        const eased = easeInOut(local)
        const waveX = -20 + eased * (width + 40)
        const waveStrength = 1 - Math.abs(local - 0.5) * 1.4
        spawnAt(waveX, Math.max(0.25, waveStrength))

        // Glow wavefront
        const grad = ctx.createLinearGradient(waveX - 50, 0, waveX + 15, 0)
        grad.addColorStop(0, 'rgba(255, 100, 20, 0)')
        grad.addColorStop(0.5, 'rgba(255, 160, 50, 0.6)')
        grad.addColorStop(0.85, 'rgba(255, 230, 180, 0.95)')
        grad.addColorStop(1, 'rgba(255, 230, 180, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(waveX - 50, 0, 70, height)
      }

      ctx.globalCompositeOperation = 'lighter'
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += 1
        const k = p.life / p.max
        if (k >= 1) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx + Math.sin(p.life * 0.15 + i) * 0.1
        p.y += p.vy
        p.vy *= 0.99

        const radius = p.size * (1 - k * 0.3)
        const alpha = (1 - k) * palette.alpha
        const hue = p.hue + k * 10
        const lightness = 65 - k * 35
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
        grad.addColorStop(0, `hsla(${hue}, 100%, ${lightness}%, ${alpha})`)
        grad.addColorStop(0.4, `hsla(${hue - 8}, 100%, ${Math.max(22, lightness - 20)}%, ${alpha * 0.55})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Step 2: Clip fire to text shape using destination-in
      // This removes all fire pixels outside the text outlines.
      // The text mask itself does NOT appear on the final canvas.
      ctx.globalCompositeOperation = 'destination-in'
      updateTextMask()
      ctx.drawImage(maskCanvas, 0, 0)

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    const start = () => {
      resize()
      raf = requestAnimationFrame(draw)
    }

    const startTimer = window.setTimeout(start, Math.max(0, startDelay))
    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.clearTimeout(startTimer)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef, startDelay, duration, sweeps, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="ft-fire"
      aria-hidden="true"
    />
  )
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
