import { useRef, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent } from 'react'
import './fire.css'

type FireButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
  glow?: boolean
}

/**
 * CTA button that emits a fire-ripple on click.
 * Pure CSS animation, no extra deps.
 */
export function FireButton({
  children,
  className,
  variant = 'primary',
  glow = true,
  onClick,
  ...rest
}: FireButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const button = ref.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'fire-ripple'
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      ripple.style.setProperty('--rx', `${x}px`)
      ripple.style.setProperty('--ry', `${y}px`)
      button.appendChild(ripple)
      setTimeout(() => ripple.remove(), 700)

      // Sparks
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('span')
        spark.className = 'fire-spark'
        const angle = Math.random() * Math.PI - Math.PI / 2
        const distance = 30 + Math.random() * 50
        spark.style.setProperty('--rx', `${x}px`)
        spark.style.setProperty('--ry', `${y}px`)
        spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`)
        spark.style.setProperty('--dy', `${Math.sin(angle) * distance - 20}px`)
        spark.style.setProperty('--delay', `${Math.random() * 80}ms`)
        button.appendChild(spark)
        setTimeout(() => spark.remove(), 800)
      }
    }
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      data-firebtn="1"
      className={`fire-btn fire-btn-${variant} ${glow ? 'fire-btn-glow' : ''} ${className ?? ''}`.trim()}
      onClick={handleClick}
      style={
        {
          ...(rest.style ?? {}),
        } as CSSProperties
      }
    >
      <span className="fire-btn-content">{children}</span>
    </button>
  )
}
