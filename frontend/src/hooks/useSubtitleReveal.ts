/* useSubtitleReveal
 *
 * Простой хук: каждое целевое `<p class="subtitle-reveal">` въезжает в кадр
 * слева/справа (определяется по `data-reveal` или соседним классам)
 * и встаёт на своё место при попадании в viewport.
 *
 * Реализация — один IntersectionObserver на всех элементах, добавляет
 * `.is-revealed` один раз при пересечении 25% порога. Это значит:
 *   - анимация запускается ОДИН РАЗ (не дёргается при скролле туда-сюда)
 *   - не блокирует main thread (IO работает на compositor-уровне)
 *   - prefers-reduced-motion: класс ставится сразу без анимации (CSS)
 */
import { useEffect } from 'react'

export function useSubtitleReveal(selector: string = '.subtitle-reveal') {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
    if (!elements.length) return

    /* Если браузер не поддерживает IO — сразу показываем,
       чтобы не оставить параграфы пустыми/невидимыми. */
    if (typeof IntersectionObserver === 'undefined') {
      for (const el of elements) el.classList.add('is-revealed')
      return
    }

    /* Если у пользователя prefers-reduced-motion — без анимации. */
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) {
      for (const el of elements) el.classList.add('is-revealed')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            io.unobserve(entry.target)
          }
        }
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.25,
      },
    )

    for (const el of elements) io.observe(el)
    return () => io.disconnect()
  }, [selector])
}
