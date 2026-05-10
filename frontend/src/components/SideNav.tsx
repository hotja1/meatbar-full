import { useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js'
import Clock from 'lucide-react/dist/esm/icons/clock.js'
import Flame from 'lucide-react/dist/esm/icons/flame.js'
import Instagram from 'lucide-react/dist/esm/icons/instagram.js'
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js'
import Menu from 'lucide-react/dist/esm/icons/menu.js'
import Phone from 'lucide-react/dist/esm/icons/phone.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import Star from 'lucide-react/dist/esm/icons/star.js'
import Users from 'lucide-react/dist/esm/icons/users.js'
import X from 'lucide-react/dist/esm/icons/x.js'
import './drawer.css'

type SideNavProps = {
  open: boolean
  cartCount: number
  cartTotal: number
  onClose: () => void
  onOpenCart: () => void
  onBookingNavigate?: (event: ReactMouseEvent<HTMLAnchorElement>) => void
}

const navItems = [
  { href: '#our-room', label: 'Зал', icon: Star, hint: 'тёплый свет, кирпич, дерево' },
  { href: '#journey', label: 'История', icon: Flame, hint: 'дым, север и наш характер' },
  { href: '#menu', label: 'Меню', icon: Menu, hint: 'рёбра · брискет · ягоды Югры' },
  { href: '#bar', label: 'Бар', icon: Flame, hint: 'коктейли · вино · крепкое' },
  { href: '#order', label: 'Заказ', icon: ShoppingBag, hint: 'самовывоз и доставка' },
  { href: '#booking', label: 'Бронь столика', icon: CalendarDays, hint: 'живая схема зала' },
  { href: '#jobs', label: 'Работа в команде', icon: Users, hint: 'кухня и зал' },
  { href: '#contacts', label: 'Контакты', icon: MapPin, hint: 'ТРЦ ЮграМолл, 3 этаж' },
]

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function SideNav({ open, cartCount, cartTotal, onClose, onOpenCart, onBookingNavigate }: SideNavProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`drawer-root drawer-left ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="drawer-scrim" aria-label="Закрыть меню" onClick={onClose} />
      <aside className="drawer drawer-nav" role="dialog" aria-label="Навигация" aria-modal="true">
        <header className="drawer-head">
          <div className="drawer-title">
            <Flame size={20} />
            <div>
              <strong>Мясо Бар</strong>
              <span>жарим · коптим · встречаем</span>
            </div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Закрыть меню">
            <X size={20} />
          </button>
        </header>

        <nav className="drawer-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  if (item.href === '#booking' && onBookingNavigate) {
                    onBookingNavigate(event)
                  }
                  onClose()
                }}
              >
                <span className="drawer-nav-icon"><Icon size={18} /></span>
                <span className="drawer-nav-text">
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </a>
            )
          })}
        </nav>

        <div className="drawer-cart-cta">
          <button type="button" onClick={() => { onClose(); onOpenCart() }}>
            <ShoppingBag size={18} />
            <span>
              <strong>Корзина</strong>
              <small>{cartCount ? `${cartCount} поз. · ${formatPrice(cartTotal)} ₽` : 'пока пусто'}</small>
            </span>
          </button>
        </div>

        <footer className="drawer-nav-foot">
          <a className="drawer-foot-link" href="tel:+79129074747">
            <Phone size={18} />
            <span>
              <strong>+7 (912) 907-47-47</strong>
              <small>звонок — самый быстрый путь</small>
            </span>
          </a>
          <a className="drawer-foot-link" href="https://www.instagram.com/meatbar_nv/" target="_blank" rel="noreferrer">
            <Instagram size={18} />
            <span>
              <strong>@meatbar_nv</strong>
              <small>фото из зала каждый день</small>
            </span>
          </a>
          <span className="drawer-foot-link drawer-foot-static">
            <Clock size={18} />
            <span>
              <strong>11:00 → 24:00</strong>
              <small>работаем без выходных</small>
            </span>
          </span>
        </footer>
      </aside>
    </div>
  )
}
