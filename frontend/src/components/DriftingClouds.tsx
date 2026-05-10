import { useEffect, useRef } from 'react'
import { detectPerfTier } from '../lib/perfTier'
import { subscribeRaf } from '../lib/rafScheduler'

type DriftingCloudsProps = {
  /** className passed through; expected to position the canvas */
  className?: string
  /** number of cloud sprites; clamped down on phones */
  density?: number
  /** baseline horizontal speed in px/s; each cloud varies around this */
  speed?: number
  /** optional white-cloud reference textures (used for sprite extraction) */
  referenceTextures?: string[]
}

type Sprite = {
  /** prebaked offscreen canvas for one cloud silhouette */
  bake: HTMLCanvasElement
  /** width/height of the baked sprite in CSS pixels */
  w: number
  h: number
}

type Cloud = {
  spriteIndex: number
  x: number
  y: number
  scale: number
  opacity: number
  /** parallax depth 0.4..1.4 — слой глубины (фон/средний план/перед) */
  depth: number
  /** px/s — negative = leftward drift, positive = rightward */
  vx: number
  vy: number
  /** subtle vertical bob in radians */
  bob: number
  bobSpeed: number
  bobAmplitude: number
}

const referenceSpriteCache = new Map<string, Promise<Sprite[]>>()

/**
 * DriftingClouds — canvas-based drifting cloud field.
 *
 * v2 (Task fix-5, 2026-05-07): сделали облака существенно мягче и
 * органичнее, чтобы на скролле/во весь viewport они не выглядели
 * «квадратными». Что поменяли:
 *
 *  • Больше и крупнее sprites (560×260 вместо 360×160), 14–20
 *    перекрывающих soft-blob слоёв вместо 6–9 — чтобы силуэт был
 *    рваным и не повторялся.
 *  • Радиальные градиенты теперь имеют 5 stop-точек с очень
 *    мягким feathering (alpha 0.95→0.55→0.18→0.04→0) — это даёт
 *    заметно более «акварельный» край.
 *  • На границы спрайта дополнительно накладываем большой
 *    feather-envelope (alpha 0→0.05→0) на всю ширину холста —
 *    значит даже когда облако пересекает границу canvas, мы не
 *    видим прямоугольной отсечки.
 *  • Слои глубины (depth 0.45..1.35) — облака с маленьким depth
 *    идут медленнее и крупнее, более передние — быстрее и резче.
 *  • DPR clamped to 2; mobile density × 0.55.
 *  • IntersectionObserver pause + reduced-motion still-frame.
 */
export function DriftingClouds({
  className,
  density = 18,
  speed = 22,
  referenceTextures,
}: DriftingCloudsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    if (typeof window === 'undefined') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 768px)').matches
    const tier = detectPerfTier()
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
      hardwareConcurrency?: number
    }).connection
    const saveData = Boolean(conn?.saveData)
    const verySlowNetwork = /(^|-)2g$/.test(String(conn?.effectiveType ?? ''))
    const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8
    const ultraLow = tier === 'low' || saveData || verySlowNetwork || (mobile && cores <= 4)
    const densityMul = mobile ? (ultraLow ? 0.24 : 0.46) : 1
    const effectiveDensity = mobile ? Math.max(6, Math.round(density * densityMul)) : density
    const speedMul = ultraLow ? 0.72 : mobile ? 0.88 : 1
    const useReferenceSprites = Boolean(referenceTextures?.length) && !ultraLow
    // Old iOS devices choke on high-DPR canvas fills. Keep the same visual
    // design, but render at DPR=1 on mobile to cut fill/gradient cost.
    const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)

    let width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1600
    let height = canvas.clientHeight || canvas.parentElement?.clientHeight || 900
    let destroyed = false
    let last = 0
    let visible = true
    let layerVisible = true
    let tabVisible = typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
    let nextVisibilityCheck = 0
    let unsubscribe: null | (() => void) = null
    let referenceLoadStarted = false
    const maybeLoadReferenceSprites = (force = false) => {
      if (!useReferenceSprites || !referenceTextures) return
      if (destroyed || referenceLoadStarted) return
      if (!force && (!visible || !layerVisible || !tabVisible)) return
      referenceLoadStarted = true
      void getCachedReferenceSprites(referenceTextures, dpr)
        .then((refSprites) => {
          if (destroyed || refSprites.length === 0) return
          sprites.splice(0, sprites.length, ...refSprites)
          seed()
          drawFrame()
        })
        .catch(() => {})
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible) maybeLoadReferenceSprites()
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const sprites: Sprite[] = []
    const clouds: Cloud[] = []

    /** bake one cloud sprite — iter5/v2: дискретный пушистый клуб (не лента).
     *
     *  Подход (1:1 как у perplexity scrn1/scrn2 — пушистые белые комки):
     *   • Холст 480×360 (близкий к квадрату → силуэт «клуба»).
     *   • 18–24 круга разного радиуса, лёгкое отклонение от центра.
     *   • Радиальный feathering на каждом круге: alpha 0.95 → 0.
     *   • После всех кругов — destination-in радиальный feather на ВЕСЬ
     *     спрайт: гарантия что края canvas ВСЕГДА прозрачные → нет
     *     прямоугольных артефактов.
     *   • Чисто белые тона; лёгкая серая тень снизу для объёма.
     */
    const bakeSprite = (seed: number): Sprite => {
      const w = 480
      const h = 360
      const c = document.createElement('canvas')
      c.width = w * dpr
      c.height = h * dpr
      const cx = c.getContext('2d')
      if (!cx) return { bake: c, w, h }
      cx.scale(dpr, dpr)
      const rand = mulberry32(seed)

      /* Центр клуба и его «ядро». */
      const centerX = w / 2
      const centerY = h * 0.55
      const coreRadius = Math.min(w, h) * 0.32

      /* 18–24 круга, расположены случайно вокруг центра. */
      const puffCount = 18 + Math.floor(rand() * 7)
      cx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < puffCount; i++) {
        const angle = rand() * Math.PI * 2
        /* Дистанция от центра: чем ближе к центру → больше радиус. */
        const dist = Math.pow(rand(), 0.6) * coreRadius * 1.1
        const bx = centerX + Math.cos(angle) * dist
        /* Y-сжимаем сверху (clouds bump up), чуть растягиваем снизу. */
        const by = centerY + Math.sin(angle) * dist * 0.6 - rand() * coreRadius * 0.3
        const r = 36 + rand() * 80
        const grad = cx.createRadialGradient(bx, by, 0, bx, by, r)
        /* Pure white, very soft fade. */
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.65)')
        grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.18)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        cx.fillStyle = grad
        cx.beginPath()
        cx.arc(bx, by, r, 0, Math.PI * 2)
        cx.fill()
      }
      cx.globalCompositeOperation = 'source-over'

      /* Лёгкая тень снизу для объёма (как в perplexity scrn1 — облака
         с мягким серым низом). */
      cx.globalCompositeOperation = 'source-atop'
      const shadow = cx.createRadialGradient(centerX, centerY + coreRadius * 0.45, 0,
                                              centerX, centerY + coreRadius * 0.45, coreRadius * 0.95)
      shadow.addColorStop(0, 'rgba(170, 170, 178, 0.22)')
      shadow.addColorStop(0.6, 'rgba(170, 170, 178, 0.05)')
      shadow.addColorStop(1, 'rgba(170, 170, 178, 0)')
      cx.fillStyle = shadow
      cx.fillRect(0, 0, w, h)
      cx.globalCompositeOperation = 'source-over'

      /* КРИТИЧНО: destination-in радиальный feather. Гарантирует что
         края канваса fully transparent — никаких прямоугольных артефактов. */
      cx.globalCompositeOperation = 'destination-in'
      const featherR = Math.min(w, h) * 0.5
      const feather = cx.createRadialGradient(centerX, centerY, 0, centerX, centerY, featherR)
      feather.addColorStop(0, 'rgba(0, 0, 0, 1)')
      feather.addColorStop(0.55, 'rgba(0, 0, 0, 1)')
      feather.addColorStop(0.85, 'rgba(0, 0, 0, 0.55)')
      feather.addColorStop(1, 'rgba(0, 0, 0, 0)')
      cx.fillStyle = feather
      cx.fillRect(0, 0, w, h)
      cx.globalCompositeOperation = 'source-over'

      return { bake: c, w, h }
    }

    /* В low-tier уменьшаем число уникальных спрайтов: меньше bake cost,
       но визуально почти не заметно из-за depth/scale/opacity. */
    const spriteCount = tier === 'low' ? 5 : 7
    for (let i = 0; i < spriteCount; i++) sprites.push(bakeSprite(11 + i * 23))

    const resetCloud = (cloud: Cloud, off = false) => {
      const sprite = sprites[cloud.spriteIndex]
      /* Слой глубины: чем меньше depth, тем дальше облако
         (медленнее, крупнее, более blurred → opacity ниже).
         iter2: подняли opacity floor c 0.36 → 0.7 чтобы облака
         реально читались на фото даже на cream-фоне неба. */
      cloud.depth = 0.5 + Math.random() * 0.9
      const baseScale = 0.85 + Math.random() * 1.65
      cloud.scale = baseScale / cloud.depth /* далёкие — крупнее */
      cloud.opacity = Math.min(1, (0.7 + Math.random() * 0.3) * Math.min(1, cloud.depth + 0.25))
      cloud.y = Math.random() * height * 1.05 - height * 0.05
      cloud.bobAmplitude = 4 + Math.random() * 10
      cloud.bobSpeed = 0.0004 + Math.random() * 0.0009
      cloud.bob = Math.random() * Math.PI * 2
      const direction = Math.random() < 0.85 ? 1 : -1
      /* iter2: ускорил базовую скорость на 1.5×, разброс шире —
         глаз должен ВИДЕТЬ как они плывут. */
      cloud.vx = direction * (speed * speedMul * cloud.depth * (0.85 + Math.random() * 1.7))
      cloud.vy = (Math.random() - 0.5) * (mobile ? 0.5 : 1.1)
      const spriteWidth = sprite.w * cloud.scale
      cloud.x = off
        ? cloud.vx > 0
          ? -spriteWidth - Math.random() * width
          : width + Math.random() * width
        : Math.random() * width
    }

    const seed = () => {
      clouds.length = 0
      for (let i = 0; i < effectiveDensity; i++) {
        const cloud: Cloud = {
          spriteIndex: i % sprites.length,
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          depth: 1,
          vx: 0,
          vy: 0,
          bob: 0,
          bobSpeed: 0,
          bobAmplitude: 0,
        }
        resetCloud(cloud)
        clouds.push(cloud)
      }
      /* Сортируем back-to-front, чтобы передние слои перекрывали задние. */
      clouds.sort((a, b) => a.depth - b.depth)
    }

    const resize = () => {
      const parent = canvas.parentElement
      width = (parent?.clientWidth ?? canvas.clientWidth) || width
      height = (parent?.clientHeight ?? canvas.clientHeight) || height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height)
      for (const c of clouds) {
        const sprite = sprites[c.spriteIndex]
        const w = sprite.w * c.scale
        const h = sprite.h * c.scale
        ctx.globalAlpha = c.opacity
        ctx.drawImage(
          sprite.bake,
          c.x,
          c.y + Math.sin(c.bob) * c.bobAmplitude,
          w,
          h,
        )
      }
      ctx.globalAlpha = 1
    }

    /* Лёгкая FPS-крышка 30 fps — облака не выигрывают от 60. */
    const FRAME_INTERVAL = ultraLow ? 1000 / 24 : 1000 / 30
    let lastFrame = 0

    const tick = (now: number) => {
      if (now >= nextVisibilityCheck) {
        nextVisibilityCheck = now + 260
        const layer = canvas.parentElement
        const opacity = layer ? Number.parseFloat(window.getComputedStyle(layer).opacity || '1') : 1
        layerVisible = Number.isFinite(opacity) ? opacity > 0.025 : true
        if (layerVisible) maybeLoadReferenceSprites()
      }

      if (!visible || !layerVisible || !tabVisible) {
        last = now
        return
      }
      if (now - lastFrame < FRAME_INTERVAL) {
        return
      }
      lastFrame = now
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      for (const c of clouds) {
        c.x += c.vx * dt
        c.y += c.vy * dt
        c.bob += c.bobSpeed * (now - (last - dt * 1000))
        const sprite = sprites[c.spriteIndex]
        const w = sprite.w * c.scale
        const h = sprite.h * c.scale
        if (c.vx > 0 && c.x > width + 80) {
          resetCloud(c, true)
          c.x = -w - 20
        } else if (c.vx < 0 && c.x < -w - 80) {
          resetCloud(c, true)
          c.x = width + 20
        }
        if (c.y < -h * 0.35) c.y = height + Math.random() * (h * 0.3)
        if (c.y > height + h * 0.35) c.y = -Math.random() * (h * 0.3)
      }
      drawFrame()
    }

    resize()
    seed()
    drawFrame()

    maybeLoadReferenceSprites()

    if (reduced) {
      return () => {
        destroyed = true
        observer.disconnect()
      }
    }

    // Low-tier devices (old iOS / save-data / low core count) struggle with
    // continuous canvas gradients. Render a still frame to keep the premium
    // look without burning CPU on scroll.
    if (tier === 'low') {
      return () => {
        destroyed = true
        observer.disconnect()
      }
    }

    unsubscribe = subscribeRaf(({ now }) => tick(now))
    let resizeQueued = false
    const onResize = () => {
      if (resizeQueued) return
      resizeQueued = true
      window.requestAnimationFrame(() => {
        resizeQueued = false
        resize()
      })
    }
    const onVisibilityChange = () => {
      tabVisible = document.visibilityState !== 'hidden'
      if (tabVisible) maybeLoadReferenceSprites()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', onResize)
    return () => {
      destroyed = true
      unsubscribe?.()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [density, speed, referenceTextures])

  return (
    <canvas
      ref={canvasRef}
      className={`drifting-clouds ${className ?? ''}`.trim()}
      aria-hidden="true"
    />
  )
}

/** small deterministic PRNG so sprite shapes look hand-tuned but vary */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`failed to load ${url}`))
    image.src = url
  })
}

function alphaFromNearWhite(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const luma = r * 0.2126 + g * 0.7152 + b * 0.0722
  const white = clamp01((luma - 170) / 78)
  const lowSat = clamp01((82 - sat) / 82)
  return Math.pow(white * lowSat, 0.82)
}

function clamp01(value: number) {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

async function loadReferenceSprites(urls: string[], dpr: number): Promise<Sprite[]> {
  const sources = await Promise.all(urls.map((url) => loadImage(url)))
  const sprites: Sprite[] = []
  for (const source of sources) {
    const mask = document.createElement('canvas')
    const sw = Math.max(1, source.naturalWidth)
    const sh = Math.max(1, source.naturalHeight)
    mask.width = sw
    mask.height = sh
    const mctx = mask.getContext('2d', { willReadFrequently: true })
    if (!mctx) continue
    mctx.drawImage(source, 0, 0, sw, sh)
    const image = mctx.getImageData(0, 0, sw, sh)
    const pixels = image.data
    for (let i = 0; i < pixels.length; i += 4) {
      const a = alphaFromNearWhite(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0)
      pixels[i] = 255
      pixels[i + 1] = 255
      pixels[i + 2] = 255
      pixels[i + 3] = Math.round(a * 255)
    }
    mctx.putImageData(image, 0, 0)

    for (let i = 0; i < 4; i++) {
      const w = 480
      const h = 360
      const sprite = document.createElement('canvas')
      sprite.width = w * dpr
      sprite.height = h * dpr
      const sctx = sprite.getContext('2d')
      if (!sctx) continue
      sctx.scale(dpr, dpr)
      sctx.clearRect(0, 0, w, h)

      // Build one cloud from many soft fragments from the reference mask.
      // This keeps silhouettes organic and removes rectangle-like rollouts.
      const centerX = w / 2
      const centerY = h * 0.56
      const puffCount = 14 + Math.floor(Math.random() * 8)
      sctx.globalCompositeOperation = 'lighter'
      sctx.filter = 'blur(8px)'
      for (let puff = 0; puff < puffCount; puff++) {
        const cw = Math.max(84, Math.round(sw * (0.18 + Math.random() * 0.18)))
        const ch = Math.max(72, Math.round(sh * (0.16 + Math.random() * 0.16)))
        const sx = Math.max(0, Math.floor(Math.random() * Math.max(1, sw - cw)))
        const sy = Math.max(0, Math.floor(Math.random() * Math.max(1, sh - ch)))
        const angle = Math.random() * Math.PI * 2
        const dist = Math.pow(Math.random(), 0.78) * Math.min(w, h) * 0.26
        const dx = centerX + Math.cos(angle) * dist
        const dy = centerY + Math.sin(angle) * dist * 0.72
        const dw = 120 + Math.random() * 180
        const dh = dw * (0.58 + Math.random() * 0.28)
        sctx.globalAlpha = 0.28 + Math.random() * 0.42
        sctx.drawImage(mask, sx, sy, cw, ch, dx - dw / 2, dy - dh / 2, dw, dh)
      }
      sctx.filter = 'none'
      sctx.globalAlpha = 1
      sctx.globalCompositeOperation = 'source-over'

      sctx.globalCompositeOperation = 'destination-in'
      const feather = sctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(w, h) * 0.54)
      feather.addColorStop(0, 'rgba(0,0,0,1)')
      feather.addColorStop(0.52, 'rgba(0,0,0,1)')
      feather.addColorStop(0.84, 'rgba(0,0,0,0.46)')
      feather.addColorStop(1, 'rgba(0,0,0,0)')
      sctx.fillStyle = feather
      sctx.fillRect(0, 0, w, h)
      sctx.globalCompositeOperation = 'source-over'

      sprites.push({ bake: sprite, w, h })
    }
  }
  return sprites
}

function getCachedReferenceSprites(urls: string[], dpr: number): Promise<Sprite[]> {
  const key = `${dpr}|${urls.join('|')}`
  const cached = referenceSpriteCache.get(key)
  if (cached) return cached
  const pending = loadReferenceSprites(urls, dpr).catch((error) => {
    referenceSpriteCache.delete(key)
    throw error
  })
  referenceSpriteCache.set(key, pending)
  return pending
}
