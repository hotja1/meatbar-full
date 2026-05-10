import { useEffect, useRef, useState } from 'react'
import { FireText } from './FireText'

type Props = {
  phrases: string[]
  /** Период между сменами в миллисекундах. По умолчанию 10 секунд (Task 10). */
  intervalMs?: number
  /** Передаётся в FireText. */
  intensity?: 'soft' | 'strong' | 'cinder'
  stagger?: number
  className?: string
}

/**
 * Ротация фраз с огнём для главного экрана (Task 10).
 *
 * Цикл: phrases[0] → phrases[1] → ... → phrases[N-1] → phrases[0] →
 * ... Каждая фраза «разгорается» (FireText effects), держится
 * `intervalMs`, гаснет вместе с появлением следующей. Эффект
 * пропускается при prefers-reduced-motion (фразы просто
 * отображаются текстом без огня).
 */
export function RotatingFireText({
  phrases,
  intervalMs = 10_000,
  intensity = 'strong',
  stagger = 36,
  className,
}: Props) {
  const [index, setIndex] = useState(0)
  const reducedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reducedRef.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (phrases.length <= 1) return
    /* setInterval достаточен — мы не делаем canvas/rAF, просто
       раз в N мс инкрементируем индекс. Это гарантирует ровно
       N-секундный шаг, не зависящий от прошлого FireText. */
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length)
    }, Math.max(2000, intervalMs))
    return () => window.clearInterval(id)
  }, [phrases.length, intervalMs])

  const current = phrases[index] ?? phrases[0] ?? ''

  return (
    <FireText
      /* key=index → FireText размонтируется и заново разгорается
         при каждой смене фразы (одно из его правил). */
      key={`hero-fire-${index}`}
      as="h1"
      intensity={intensity}
      stagger={stagger}
      /* Фраза держится до момента смены; FireText сам управляет
         repeatInterval'ом — 30 с по умолчанию, но если intervalMs
         меньше, key-смена случится раньше и FireText разгорится
         заново уже на новом тексте. */
      repeatInterval={Math.max(15, Math.floor((intervalMs * 1.5) / 1000))}
      className={className}
      ariaLabel={current}
    >
      {current}
    </FireText>
  )
}
