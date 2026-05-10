import { useEffect, useRef } from 'react'
import { FireText } from './FireText'
import { DriftingClouds } from './DriftingClouds'
import './cloud.css'
import { detectPerfTier } from '../lib/perfTier'
import { subscribeRaf } from '../lib/rafScheduler'

type CloudHeroProps = {
  image?: string
  imageWebp?: string
  imageAvif?: string
  imageSm?: string
  imageSmWebp?: string
  imageSmAvif?: string
  kicker?: string
  title?: string
  subtitle?: string
  altText?: string
}

export function CloudHero({
  image = '/assets/cloud-hero.webp',
  imageWebp,
  imageAvif,
  imageSm,
  imageSmWebp,
  imageSmAvif,
  kicker = 'Сцена · Мясо Бар',
  title = 'Место, где гости остаются на третий час.',
  subtitle = 'Тёплый свет, кирпич, дерево и аромат гриля. Это не просто фото — это место, где вы будете сидеть.',
  altText = 'Зал ресторана Мясо Бар',
}: CloudHeroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // For reduced motion users — show photo+copy immediately, hide clouds and white screen.
      el.style.setProperty('--cloud-progress', '0')
      el.style.setProperty('--cloud-layer-opacity', '0')
      el.style.setProperty('--white-opacity', '0')
      el.style.setProperty('--photo-scale', '1')
      el.style.setProperty('--photo-opacity', '1')
      el.style.setProperty('--photo-blur', '0px')
      el.style.setProperty('--copy-opacity', '1')
      el.style.setProperty('--copy-y', '0px')
      return
    }

    const tier = detectPerfTier()
    const mobile = window.matchMedia('(max-width: 768px)').matches

    let scheduled = false
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let unsubscribe: null | (() => void) = null
    let parallaxActiveUntil = 0

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      parallaxActiveUntil = performance.now() + 1400
    }

    const clamp = (value: number) => Math.min(1, Math.max(0, value))
    const smooth = (start: number, end: number, value: number) => {
      const t = clamp((value - start) / (end - start))
      return t * t * (3 - 2 * t)
    }

    const computeScroll = () => {
      const rect = el.getBoundingClientRect()
      const scrollable = Math.max(1, rect.height - window.innerHeight)
      const phase = clamp(-rect.top / scrollable)
      const entry = clamp((window.innerHeight - rect.top) / window.innerHeight)

      /* Тайминг (iter6 2026-05-07 — точно по описанию пользователя):
         Хореография: белый → облака на белом → меньше облаков →
         появляется чёткое фото → плато → текст.

           phase 0.00 → 0.06 — чисто белый экран, облаков ещё нет.
           phase 0.06 → 0.20 — облака появляются над белым (fade-in).
           phase 0.20 → 0.40 — облака плотные, плывут — видно движение.
           phase 0.40 → 0.55 — облаков становится меньше (density падает),
                                белый начинает уходить, фото проступает.
           phase 0.55 → 0.62 — облака полностью растворились,
                                белый ушёл — на экране ЧЁТКОЕ фото.
           phase 0.62 → 0.84 — ПЛАТО чистого фото без текста.
           phase 0.84 → 0.94 — текст въезжает поверх фото.
           phase 0.94 → 1.00 — soft hand-off в следующую секцию.
      */
      const cloudThin = smooth(0.14, 0.64, phase)
      const cloudExit = smooth(0.46, 0.82, phase)
      const whiteFade = smooth(0.08, 0.5, phase)
      const copyReveal = smooth(0.84, 0.94, phase)
      const copyFade = smooth(0.99, 1.0, phase)

      // Intense cloud start -> progressive thinning/dissolve.
      const cloudOpacity = entry > 0.02 ? (0.96 - cloudThin * 0.18) * (1 - cloudExit) : 0
      const cloudDensity = 1 - cloudThin * 0.9
      // Keep photo slightly visible from first frame (no pure white blank wall).
      const whiteOpacity = 0.82 * (1 - whiteFade)
      const progress = phase * 2 - 1

      el.style.setProperty('--cloud-progress', progress.toFixed(3))
      el.style.setProperty('--cloud-layer-opacity', cloudOpacity.toFixed(3))
      el.style.setProperty('--white-opacity', whiteOpacity.toFixed(3))
      el.style.setProperty('--cloud-density', cloudDensity.toFixed(3))
      el.style.setProperty('--photo-scale', (1.04 - smooth(0.0, 0.7, phase) * 0.04).toFixed(3))
      el.style.setProperty('--photo-opacity', '1')
      el.style.setProperty('--photo-blur', '0px')
      el.style.setProperty('--copy-opacity', Math.max(0, copyReveal - copyFade * 0.7).toFixed(3))
      el.style.setProperty('--copy-y', `${Math.round((1 - copyReveal) * 38)}px`)
    }

    const onScroll = () => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(() => {
        scheduled = false
        computeScroll()
      })
    }

    const tick = (now: number) => {
      // Mobile and low-tier: skip continuous mouse-parallax work.
      if (mobile || tier === 'low') return
      if (now > parallaxActiveUntil) return
      curX += (targetX - curX) * 0.06
      curY += (targetY - curY) * 0.06
      el.style.setProperty('--mx', curX.toFixed(3))
      el.style.setProperty('--my', curY.toFixed(3))
    }

    // Mouse parallax is desktop-only.
    if (!mobile && tier !== 'low') el.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    computeScroll()
    if (!mobile && tier !== 'low') {
      parallaxActiveUntil = performance.now() + 400
      unsubscribe = subscribeRaf(({ now }) => tick(now))
    }
    return () => {
      unsubscribe?.()
      el.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section ref={rootRef} className="cloud-hero" id="our-room" aria-label={altText}>
      <div className="cloud-sticky">
        {/* LQIP — крошечная (24×16, ~140 b) blurred-копия cloud-hero,
            inline-base64 в качестве background-image. Pixel-perfect
            на момент LCP, реальное фото подменяет её при загрузке.
            Плюс «mock сцены» для slow-2g/saveData (Phase 9.B). */}
        <div
          className="cloud-photo cloud-photo--lqip"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url('data:image/webp;base64,UklGRoYAAABXRUJQVlA4IHoAAACwAwCdASoVABAAPxFysFAsJqSisAgBgCIJYgCdABUZNOZxMnbSAAD2ctAilmWeb6HLtRljgrerSnmQ/0jJtCgF7LpIheTIwXB56AmMvJN/KIPS5Uo91diZwDG3Lxyvlu8DX3iTiLCuKD9HIu3i1AmQZ4ZkMtOc87SAAA==')",
          }}
        >
          <picture>
            {imageSmAvif ? (
              <source srcSet={imageSmAvif} type="image/avif-disabled" media="(max-width: 768px)" />
            ) : null}
            {imageSmWebp ? (
              <source srcSet={imageSmWebp} type="image/webp" media="(max-width: 768px)" />
            ) : null}
            {imageSm ? (
              <source srcSet={imageSm} type="image/jpeg" media="(max-width: 768px)" />
            ) : null}
            {imageAvif ? <source srcSet={imageAvif} type="image/avif-disabled" /> : null}
            {imageWebp ? <source srcSet={imageWebp} type="image/webp" /> : null}
            <img
              src={image}
              alt=""
              /* fetchPriority="high" чтобы LCP-картинка не уходила
                 в lazy-очередь после видео и шрифтов (Phase 9.B). */
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={(e) => {
                /* Когда настоящая картинка загружена — убираем
                   LQIP-фон И его blur, чтобы фото-плато было полностью
                   чётким (Task 2025-05-07-3). */
                const parent = (e.currentTarget.parentElement?.parentElement ??
                  null) as HTMLDivElement | null
                if (parent) {
                  parent.style.backgroundImage = 'none'
                  parent.style.filter = 'none'
                }
              }}
            />
          </picture>
          <div className="cloud-photo-fade" />
        </div>

        {/* iter6 (2026-05-07): белый экран старта. На phase 0..0.20 он
            полностью покрывает фото, и облака рисуются поверх белого —
            визуально это «облака на белом небе», а не «облака на
            интерьерном фото». При phase 0.20..0.45 он плавно
            растворяется и обнажает чёткое фото зала. */}
        <div className="cloud-white-screen" aria-hidden="true" />

        {/* Live drifting clouds replace the static SVG puffs.
            Inspired by perplexity.ai/products/computer — soft, slow,
            organic. Fade-out is driven by --cloud-layer-opacity. */}
        <div className="cloud-puffs cloud-puffs--drift" aria-hidden="true">
          <DriftingClouds
            density={34}
            speed={30}
            referenceTextures={['/assets/cloud-ref-nebo-1.jpg', '/assets/cloud-ref-nebo-2.jpg']}
          />
        </div>

        <div className="cloud-grid cloud-grid--left">
          <div className="cloud-copy">
            <span className="chapter">{kicker}</span>
            <FireText as="h2" intensity="strong" stagger={26} sweeps={2}>
              {title}
            </FireText>
            <span className="cloud-copy-keyline" aria-hidden="true" />
            <p>{subtitle}</p>

            <div className="cloud-stats">
              <div>
                <strong>122</strong>
                <span>места в двух залах</span>
              </div>
              <div>
                <strong>35</strong>
                <span>столов на схеме зала</span>
              </div>
              <div>
                <strong>11:00</strong>
                <span>открываемся каждый день</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cloud-floor" aria-hidden="true" />
      </div>
    </section>
  )
}
