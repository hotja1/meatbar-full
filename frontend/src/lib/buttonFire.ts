/* Global click-fire effect for every button on the site.
 *
 * Spawns a short, low-intensity ripple+sparks burst at the click point
 * inside the target button. Pure CSS animation — see fire.css for the
 * keyframes (.fire-ripple, .fire-spark). Style of the effect is tuned
 * to be subtle: small ripple, fewer sparks, faster fade.
 *
 * Mobile: spark count and duration are reduced.
 * PWA standalone: same as web (already light).
 * Reduced motion: skipped entirely.
 *
 * The function is idempotent — `installGlobalButtonFire` may be called
 * multiple times (StrictMode double-mount, HMR), it cleans up first.
 */

const HANDLER_KEY = '__meatbarButtonFireHandler' as const

type GlobalWindow = typeof window & {
  [HANDLER_KEY]?: (event: MouseEvent) => void
}

function emitButtonFire(button: HTMLButtonElement | HTMLAnchorElement, x: number, y: number) {
  // Disabled buttons: no effect
  if ('disabled' in button && button.disabled) return

  // Honour an opt-out attribute for places where the fire would clash
  // (e.g. inputs styled as buttons inside forms, drag handles).
  if (button.dataset.fire === 'off' || button.closest('[data-fire="off"]')) return

  // Make sure the host can absolutely-position children.
  const computed = window.getComputedStyle(button)
  if (computed.position === 'static') {
    button.style.position = 'relative'
  }
  if (computed.overflow !== 'hidden') {
    // Don't force overflow:hidden — many headers/cards use overflow:visible
    // intentionally. Sparks will simply clip if the button itself does.
  }

  const isMobile = window.matchMedia('(max-width: 640px)').matches
  const sparkCount = isMobile ? 4 : 6

  // Click-ripple
  const ripple = document.createElement('span')
  ripple.className = 'fire-ripple fire-ripple--mini'
  ripple.style.setProperty('--rx', `${x}px`)
  ripple.style.setProperty('--ry', `${y}px`)
  button.appendChild(ripple)
  window.setTimeout(() => ripple.remove(), 700)

  // Sparks
  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('span')
    spark.className = 'fire-spark fire-spark--mini'
    const angle = Math.random() * Math.PI - Math.PI / 2
    const distance = 18 + Math.random() * 26
    spark.style.setProperty('--rx', `${x}px`)
    spark.style.setProperty('--ry', `${y}px`)
    spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
    spark.style.setProperty('--dy', `${Math.sin(angle) * distance - 14}px`)
    spark.style.setProperty('--delay', `${Math.random() * 60}ms`)
    button.appendChild(spark)
    window.setTimeout(() => spark.remove(), 700)
  }
}

export function installGlobalButtonFire() {
  if (typeof window === 'undefined') return () => {}
  const w = window as GlobalWindow

  // Clean up previous handler in case of HMR / double-mount
  if (w[HANDLER_KEY]) {
    document.removeEventListener('click', w[HANDLER_KEY], true)
    w[HANDLER_KEY] = undefined
  }

  // Skip if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  const handler = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    // Find the closest interactive element we care about
    const host = target.closest<HTMLButtonElement | HTMLAnchorElement>(
      'button, a.fire-btn, a.primary-link, a.secondary-link, a.header-call, a.cart-cta',
    )
    if (!host) return
    // Skip the dedicated <FireButton/>: it emits its own (richer) effect.
    if (host.dataset.firebtn === '1') return
    const rect = host.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    emitButtonFire(host, x, y)
  }

  document.addEventListener('click', handler, true)
  w[HANDLER_KEY] = handler

  return () => {
    if (w[HANDLER_KEY] === handler) {
      document.removeEventListener('click', handler, true)
      w[HANDLER_KEY] = undefined
    }
  }
}
