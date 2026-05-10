import { useEffect, useRef, useState } from 'react'
import Volume2 from 'lucide-react/dist/esm/icons/volume-2.js'
import VolumeX from 'lucide-react/dist/esm/icons/volume-x.js'
import './ambient-audio.css'

/**
 * #9 — Аудио-эмбиент по желанию.
 *
 * Один loop ≤200 КБ (`/assets/audio/ambient-evening.webm`,
 * ~132 KB Opus 48 kbps). Выключен по умолчанию. Состояние
 * запоминается в `localStorage` под ключом `meatbar:ambient`,
 * админка про этот тумблер не знает.
 *
 * Поведение:
 *  - кнопка фиксированно слева внизу (поверх контента, под
 *    SideNav-drawer-ом).
 *  - первый клик = play + сохранить «on», ещё один клик = pause + «off».
 *  - громкость нарастает плавно (1.5 сек), чтобы не било в уши.
 *  - при `prefers-reduced-motion: reduce` — без fade, сразу 0.55.
 *  - aria-pressed + aria-label, фокус-кольцо, клавиатурно доступна.
 */
const STORAGE_KEY = 'meatbar:ambient'
const SRC = '/assets/audio/ambient-evening.webm'
const TARGET_VOLUME = 0.55

export function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  const [enabled, setEnabled] = useState(false)

  // Восстанавливаем состояние тумблера, но НЕ автозапускаем звук —
  // браузеры всё равно блокируют autoplay-with-sound без жеста.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'on') setEnabled(true)
    } catch {
      /* localStorage может быть недоступен (приват/ssr) — молча игнорируем. */
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (fadeRef.current) {
      window.clearInterval(fadeRef.current)
      fadeRef.current = null
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (enabled) {
      audio.volume = reduced ? TARGET_VOLUME : 0
      const playPromise = audio.play()
      if (playPromise) {
        playPromise.catch(() => {
          // autoplay заблокирован — откатываем тумблер обратно.
          setEnabled(false)
          try {
            window.localStorage.setItem(STORAGE_KEY, 'off')
          } catch {
            /* ignore */
          }
        })
      }
      if (!reduced) {
        const start = performance.now()
        const duration = 1500
        fadeRef.current = window.setInterval(() => {
          const t = Math.min(1, (performance.now() - start) / duration)
          audio.volume = TARGET_VOLUME * t
          if (t >= 1 && fadeRef.current) {
            window.clearInterval(fadeRef.current)
            fadeRef.current = null
          }
        }, 60)
      }
    } else {
      audio.pause()
    }

    return () => {
      if (fadeRef.current) {
        window.clearInterval(fadeRef.current)
        fadeRef.current = null
      }
    }
  }, [enabled])

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        preload="none"
        loop
        aria-hidden="true"
      />
      <button
        type="button"
        className={`ambient-toggle ${enabled ? 'is-on' : ''}`}
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? 'Выключить фоновую музыку' : 'Включить фоновую музыку'}
        title={enabled ? 'Выключить фоновую музыку' : 'Включить фоновую музыку'}
      >
        {enabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
        <span className="ambient-toggle__label">
          {enabled ? 'Эмбиент: вкл.' : 'Эмбиент: выкл.'}
        </span>
      </button>
    </>
  )
}
