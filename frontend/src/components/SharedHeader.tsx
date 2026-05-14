import { memo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import MenuIcon from 'lucide-react/dist/esm/icons/menu.js'
import Phone from 'lucide-react/dist/esm/icons/phone.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import Sofa from 'lucide-react/dist/esm/icons/sofa.js'
import ChefHat from 'lucide-react/dist/esm/icons/chef-hat.js'
import GlassWater from 'lucide-react/dist/esm/icons/glass-water.js'
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check.js'
import Coffee from 'lucide-react/dist/esm/icons/coffee.js'
import Navigation from 'lucide-react/dist/esm/icons/navigation.js'
import PhoneCall from 'lucide-react/dist/esm/icons/phone-call.js'
import { AnimatedFire } from './AnimatedFire'
import { FloatingDock } from './FloatingDock'
import { useCart } from '../lib/CartContext'

type SharedHeaderProps = {
  onOpenCart: () => void
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/* Task F35 — memo вокруг шапки, чтобы изменения cartCount/cartTotal
   (часто при клике по +/-) не ре-рендерили тяжёлый AnimatedFire и
   навигационные Link. Для этого cart-данные читаются в отдельной
   обёртке, а сама шапка не зависит от них напрямую. */
function SharedHeaderImpl({ onOpenCart }: SharedHeaderProps) {
  const { cartCount, cartTotal } = useCart()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header className="site-header">
        <button type="button" className="header-burger" onClick={() => setNavOpen(true)} aria-label="Открыть меню">
          <MenuIcon size={20} />
        </button>
        <Link className="brand brand-fire" to="/" aria-label="Мясо Бар — на главную">
          <span className="brand-fire-logo brand-fire-logo--mark" aria-hidden="true">
            <AnimatedFire className="brand-fire-flame" width={96} height={96} intensity={0.8} />
            <img src="/assets/meatbar-logo-mark.webp" alt="" width="160" height="94" />
          </span>
        </Link>
        <nav className="header-nav-desktop">
          <Link to="/#our-room" className={isActive('/') ? 'is-current' : ''} title="Интерьер и атмосфера">Зал<span className="nav-hint">Интерьер и атмосфера</span></Link>
          <Link to="/menu" className={isActive('/menu') ? 'is-current' : ''} title="Доставка и самовывоз">Меню<span className="nav-hint">Доставка и самовывоз</span></Link>
          <Link to="/bar" className={isActive('/bar') ? 'is-current' : ''} title="Коктейли и вина">Бар<span className="nav-hint">Коктейли и вина</span></Link>
          <Link to="/booking" className={isActive('/booking') ? 'is-current' : ''} title="Выбрать стол">Бронь<span className="nav-hint">Выбрать стол</span></Link>
          <Link to="/business-lunch" className={isActive('/business-lunch') ? 'is-current' : ''} title="Каждый день 12:00–15:00">Бизнес-ланч<span className="nav-hint">Каждый день 12:00–15:00</span></Link>
          <a href="/#contacts" title="Адрес и телефон">Контакты<span className="nav-hint">Адрес и телефон</span></a>
        </nav>
        <div className="header-actions">
          <a className="fire-btn fire-btn-outline fire-btn-glow header-call" href="tel:+79129074747">
            <Phone size={16} />
            <span>+7 (912) 907-47-47</span>
          </a>
          <button type="button" className="header-cart" onClick={onOpenCart} aria-label="Открыть корзину">
            <ShoppingBag size={18} />
            {cartCount ? <span className="header-cart-badge">{cartCount}</span> : null}
            <span className="header-cart-amount">{cartCount ? `${formatPrice(cartTotal)} ₽` : 'Корзина'}</span>
          </button>
        </div>
      </header>
      <FloatingDock
        open={navOpen}
        onClose={() => setNavOpen(false)}
        items={[
          { title: 'Зал', icon: <Sofa size={20} />, href: '/#our-room' },
          { title: 'Меню', icon: <ChefHat size={20} />, href: '/menu' },
          { title: 'Бар', icon: <GlassWater size={20} />, href: '/bar' },
          { title: 'Бронь', icon: <CalendarCheck size={20} />, href: '/booking' },
          { title: 'Бизнес-ланч', icon: <Coffee size={20} />, href: '/business-lunch' },
          { title: 'Контакты', icon: <Navigation size={20} />, href: '/#contacts' },
          { title: 'Позвонить', icon: <PhoneCall size={20} />, href: 'tel:+79129074747' },
        ]}
      />
    </>
  )
}

export const SharedHeader = memo(SharedHeaderImpl)
