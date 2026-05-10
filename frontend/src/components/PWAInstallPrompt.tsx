import { useEffect, useState } from 'react'
import Download from 'lucide-react/dist/esm/icons/download.js'
import Smartphone from 'lucide-react/dist/esm/icons/smartphone.js'
import X from 'lucide-react/dist/esm/icons/x.js'
import './pwa-prompt.css'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'meatbar-pwa-install-dismissed'

/**
 * Lightweight PWA install banner.
 * - Hooks beforeinstallprompt (Chromium / Edge / Android)
 * - For iOS Safari falls back to a manual instruction toast
 * - Auto-hides if installed, dismissed, or after Add-to-Home-Screen
 */
export function PWAInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return
    if (sessionStorage.getItem(STORAGE_KEY)) return

    const handler = (event: Event) => {
      event.preventDefault()
      setEvent(event as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS fallback — Safari doesn't fire beforeinstallprompt
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua)
    if (isIos) {
      setIosHint(true)
      setHidden(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ }
  }

  const install = async () => {
    if (!event) return
    await event.prompt()
    await event.userChoice.catch(() => null)
    setHidden(true)
  }

  return (
    <div className="pwa-prompt" role="dialog" aria-label="Установка приложения Мясо Бар">
      <button type="button" className="pwa-prompt-close" onClick={dismiss} aria-label="Закрыть">
        <X size={16} />
      </button>
      <div className="pwa-prompt-body">
        <div className="pwa-prompt-icon">
          <Smartphone size={22} />
        </div>
        <div>
          <strong>Установить Мясо Бар</strong>
          {iosHint ? (
            <span>Поделиться → «На экран Домой»</span>
          ) : (
            <span>Открывайте меню и бронь одним тапом, без браузера</span>
          )}
        </div>
      </div>
      {!iosHint && event ? (
        <button type="button" className="pwa-prompt-action" onClick={install}>
          <Download size={16} />
          Установить
        </button>
      ) : null}
    </div>
  )
}
