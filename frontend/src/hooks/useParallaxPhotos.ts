import { useEffect } from 'react'
import { detectPerfTier } from '../lib/perfTier'

/**
 * Single rAF scheduler для всех `.parallax-photo` элементов на
 * странице (Task 10).
 *
 * Логика:
 *  - IntersectionObserver включает/выключает наблюдение за элементом
 *    в зависимости от пересечения с viewport, чтобы не считать
 *    parallax для скрытых фото.
 *  - На scroll (rAF-throttled) мы для каждого активного элемента
 *    считаем `progress = (centerY - viewportCenter) / (viewportH/2)`
 *    в диапазоне [-1; 1] и пишем в CSS-переменную --photo-progress.
 *    CSS использует это для transform: translate/scale картинки —
 *    лёгкое движение «вверх» при подъёме элемента, «вниз» при
 *    выходе. Эффект как у DriftingClouds, но дешевле — это просто
 *    одно перо CSS-переменной на элемент.
 *  - prefers-reduced-motion: reduce → возвращаем 0 для всех
 *    элементов (CSS правило тоже отключает transform).
 *
 * Производительность:
 *  - 1 rAF, 1 scroll listener, не больше N (видимых) элементов на кадр.
 *  - При выходе из viewport элемент исключается из набора и не
 *    обновляется, что важно для длинных страниц с десятками карточек.
 */
export function useParallaxPhotos(selector = '.parallax-photo') {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowTier = detectPerfTier() === 'low'
    if (reduced || lowTier) return

    const visible = new Set<HTMLElement>()
    let rafId = 0
    let pending = false

    const update = () => {
      pending = false
      const vh = window.innerHeight || 1
      const vCenter = vh / 2
      visible.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const elCenter = rect.top + rect.height / 2
        const progress = (elCenter - vCenter) / vCenter
        const clamped = Math.max(-1, Math.min(1, progress))
        el.style.setProperty('--photo-progress', clamped.toFixed(3))
      })
    }

    const schedule = () => {
      if (pending) return
      pending = true
      rafId = window.requestAnimationFrame(update)
    }

    const observed = new WeakSet<HTMLElement>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const target = e.target as HTMLElement
          if (e.isIntersecting) visible.add(target)
          else visible.delete(target)
        }
        schedule()
      },
      /* iter3: убрали избыточный 5-уровневый threshold — нам хватает
         бинарной видимости. Это режет работу IO в 5 раз. */
      { rootMargin: '20% 0px 20% 0px', threshold: 0 },
    )

    const observe = () => {
      const els = document.querySelectorAll<HTMLElement>(selector)
      els.forEach((el) => {
        if (observed.has(el)) return
        observed.add(el)
        io.observe(el)
      })
    }

    observe()
    /* iter3: MO теперь debounced — раньше каждый React-рендер
       триггерил полный QSA, что ощутимо нагружало long-strings. */
    let moTimer: number | null = null
    const mo = new MutationObserver(() => {
      if (moTimer !== null) return
      moTimer = window.setTimeout(() => {
        moTimer = null
        observe()
      }, 200)
    })
    mo.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()

    return () => {
      io.disconnect()
      mo.disconnect()
      if (moTimer !== null) window.clearTimeout(moTimer)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [selector])
}
