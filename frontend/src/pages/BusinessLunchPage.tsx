import { lazy, Suspense, useCallback, useMemo, useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react'
import Minus from 'lucide-react/dist/esm/icons/minus.js'
import Plus from 'lucide-react/dist/esm/icons/plus.js'
import { FireText } from '../components/FireText'
import { FireButton } from '../components/FireButton'
import { SharedHeader } from '../components/SharedHeader'
import { useCart } from '../lib/CartContext'
import { businessLunch, type LunchMenuItem } from '../data/business-lunch'
import { detectPerfTier } from '../lib/perfTier'
import { isWebp, toSmWebp } from '../lib/imageSources'
import '../App.css'

const CartDrawer = lazy(() => import('../components/CartDrawer').then((m) => ({ default: m.CartDrawer })))

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price)
}

/* Нижневартовск — UTC+5 (Asia/Yekaterinburg).
   Бизнес-ланч доступен с 12:00 до 15:00 по местному времени. */
const LUNCH_TZ = 'Asia/Yekaterinburg'
const LUNCH_START = 12
const LUNCH_END = 15

function isLunchTime(): boolean {
  const now = new Date()
  const nvHour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: LUNCH_TZ }).format(now)
  )
  return nvHour >= LUNCH_START && nvHour < LUNCH_END
}

type LunchCardProps = {
  item: LunchMenuItem
  categoryName: string
  quantity: number
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}

function LunchCard({ item, categoryName, quantity, onAdd, onInc, onDec }: LunchCardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingTiltRef = useRef<{ bx: number; by: number; hover: number } | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const tiltEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    const perf = detectPerfTier()
    const touch = window.matchMedia?.('(hover: none)')?.matches ?? false
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    return perf !== 'low' && !touch && !reduced
  }, [])

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!tiltEnabled) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const bx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const by = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    pendingTiltRef.current = { bx, by, hover: 1 }
    if (rafRef.current != null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const next = pendingTiltRef.current
      const node = cardRef.current
      if (!next || !node) return
      node.style.setProperty('--bx', next.bx.toFixed(3))
      node.style.setProperty('--by', next.by.toFixed(3))
      node.style.setProperty('--hover', String(next.hover))
    })
  }

  const onPointerLeave = (e: ReactPointerEvent<HTMLElement>) => {
    pendingTiltRef.current = { bx: 0, by: 0, hover: 0 }
    if (rafRef.current != null) return
    const el = e.currentTarget
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const next = pendingTiltRef.current
      if (!next) return
      el.style.setProperty('--bx', next.bx.toFixed(3))
      el.style.setProperty('--by', next.by.toFixed(3))
      el.style.setProperty('--hover', String(next.hover))
    })
  }

  return (
    <article
      ref={cardRef}
      className={`dish-card${!item.image ? ' dish-card-no-img' : ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
    >
      {item.image ? (
        isWebp(item.image) ? (
          <picture>
            <img
              src={item.image}
              srcSet={`${toSmWebp(item.image)} 480w, ${item.image} 800w`}
              sizes="(max-width: 720px) 92vw, 380px"
              alt=""
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
            />
          </picture>
        ) : (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
          />
        )
      ) : null}
      <div className="dish-card-body">
        <h4 className="dish-card-title">{item.title}</h4>
        {item.description ? <p className="dish-card-desc">{item.description}</p> : null}
        <footer className="dish-card-footer">
          <div className="dish-card-price-line">
            <span className="dish-card-volume">{item.weight ?? categoryName}</span>
            <span className="dish-card-leader" aria-hidden="true" />
            <strong className="dish-card-price">{formatPrice(item.price)} ₽</strong>
          </div>
        </footer>
        <div className="dish-card-action">
          {quantity ? (
            <div className="dish-qty" role="group" aria-label={`Количество: ${item.title}`}>
              <button type="button" className="dish-qty-btn" aria-label={`Уменьшить ${item.title}`} onClick={onDec}>
                <Minus size={14} />
              </button>
              <span className="dish-qty-value" aria-live="polite">{quantity}</span>
              <button type="button" className="dish-qty-btn" aria-label={`Увеличить ${item.title}`} onClick={onInc}>
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <FireButton variant="outline" glow onClick={onAdd}>
              В заказ
            </FireButton>
          )}
        </div>
      </div>
    </article>
  )
}

export function BusinessLunchPage() {
  const [activeCategory, setActiveCategory] = useState<string>(businessLunch[0]?.name ?? '')
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(false)
  const { cart, cartTotal, cartCount, addToCart, removeFromCart, incrementCart, decrementCart } = useCart()

  const category = useMemo(() => businessLunch.find((c) => c.name === activeCategory), [activeCategory])

  const cartByTitle = useMemo(() => {
    const map = new Map<string, number>()
    cart.forEach((item) => map.set(item.title, item.quantity))
    return map
  }, [cart])

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const noop = useCallback(() => {}, [])

  /* Обёртка над addToCart с проверкой времени */
  const guardedAdd = useCallback((title: string, price: number) => {
    if (!isLunchTime()) {
      setToast(true)
      return
    }
    addToCart(title, price)
  }, [addToCart])

  const guardedInc = useCallback((title: string) => {
    if (!isLunchTime()) {
      setToast(true)
      return
    }
    incrementCart(title)
  }, [incrementCart])

  /* Автоскрытие тоста */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <SharedHeader onOpenCart={openCart} />

      <main className="menu-page">
        <div className="menu-hero">
          <picture>
            <source media="(max-width: 768px)" srcSet="/assets/lunch-hero-sm.webp" />
            <img src="/assets/lunch-hero.webp" alt="" decoding="async" width={1600} height={900} fetchPriority="high" />
          </picture>
          <div className="menu-hero__veil" aria-hidden="true" />
          <div className="menu-hero__content">
            <span className="chapter">Бизнес-ланч</span>
            <FireText as="h2" intensity="strong" stagger={26}>
              Обед, ради которого выходят из офиса.
            </FireText>
          </div>
          <p className="menu-hero__sub">
            Каждый день с 12:00 до 15:00. Салат, суп, горячее и напиток — быстро, сытно, по-настоящему.
          </p>
        </div>

        <section className="menu-section section-with-bg" data-bg="5" id="business-lunch">
          <div className="section-bg" aria-hidden="true" />
          <div className="menu-layout">
            <aside className="menu-tabs" aria-label="Разделы бизнес-ланча">
              {businessLunch.map((cat) => (
                <FireButton
                  variant={cat.name === activeCategory ? 'outline' : 'ghost'}
                  glow={cat.name === activeCategory}
                  className="menu-tab-btn"
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.name}
                  <span className="menu-tab-count">{cat.items.length}</span>
                </FireButton>
              ))}
            </aside>
            <div className="menu-board menu-board-cards">
              <h3>{category?.name ?? 'Бизнес-ланч'}</h3>
              {category ? (
                <div className="menu-card-grid">
                  {category.items.map((item) => (
                    <LunchCard
                      key={`${category.name}-${item.title}`}
                      item={item}
                      categoryName={category.name}
                      quantity={cartByTitle.get(item.title) ?? 0}
                      onAdd={() => guardedAdd(item.title, item.price)}
                      onInc={() => guardedInc(item.title)}
                      onDec={() => decrementCart(item.title)}
                    />
                  ))}
                </div>
              ) : (
                <p>Загружаем меню…</p>
              )}
            </div>
          </div>
        </section>

        {cartCount === 0 ? (
          <div className="menu-page__empty-cart-hint">
            <p>Корзина пуста — добавьте блюда из меню</p>
          </div>
        ) : null}
      </main>

      {/* Тост: бизнес-ланч закрыт */}
      <div className={`lunch-toast${toast ? ' lunch-toast--visible' : ''}`} role="alert" aria-live="polite">
        <p className="lunch-toast__title">Бизнес-ланч откроется завтра</p>
        <p className="lunch-toast__sub">Заказ доступен каждый день с 12:00 до 15:00</p>
      </div>

      <Suspense fallback={null}>
        {cartOpen ? (
          <CartDrawer
            open={cartOpen}
            cart={cart.map((item) => ({ ...item, image: item.image }))}
            total={cartTotal}
            phone=""
            onPhoneChange={noop}
            onClose={closeCart}
            onRemove={removeFromCart}
            onIncrement={incrementCart}
            onDecrement={decrementCart}
            onSubmit={noop}
            state="idle"
            paymentUrl={null}
          />
        ) : null}
      </Suspense>
    </>
  )
}
