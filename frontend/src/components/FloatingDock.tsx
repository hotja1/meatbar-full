import { useState } from 'react'
import './floating-dock.css'

type DockItem = {
  title: string
  icon: React.ReactNode
  href: string
}

type FloatingDockProps = {
  items: DockItem[]
  open: boolean
  onClose: () => void
}

export function FloatingDock({ items, open, onClose }: FloatingDockProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`dock-backdrop ${open ? 'dock-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dock */}
      <nav
        className={`floating-dock ${open ? 'floating-dock--open' : ''}`}
        aria-label="Навигация"
      >
        {items.map((item, idx) => (
          <a
            key={item.title}
            href={item.href}
            className={`dock-item ${hoveredIdx === idx ? 'dock-item--active' : ''}`}
            style={{ '--dock-delay': `${(items.length - 1 - idx) * 40}ms` } as React.CSSProperties}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={onClose}
            aria-label={item.title}
          >
            <span className="dock-item__icon">{item.icon}</span>
            <span className="dock-item__tooltip">{item.title}</span>
          </a>
        ))}
      </nav>
    </>
  )
}
