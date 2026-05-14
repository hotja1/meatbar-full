import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Minus from 'lucide-react/dist/esm/icons/minus.js'
import Plus from 'lucide-react/dist/esm/icons/plus.js'
import { FireText } from '../components/FireText'
import { FireButton } from '../components/FireButton'
import { SharedHeader } from '../components/SharedHeader'
import { useCart } from '../lib/CartContext'
import { menu as fallbackMenu, type MenuCategory, type MenuItem } from '../data/menu'
import { api } from '../lib/api'
import { detectPerfTier } from '../lib/perfTier'
import { isWebp, toAvif, toSmAvif, toSmWebp } from '../lib/imageSources'
import '../App.css'

const CartDrawer = lazy(() => import('../components/CartDrawer').then((m) => ({ default: m.CartDrawer })))

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price)
}

type DishCardProps = {
  item: MenuItem
  categoryName: string
  quantity: number
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}

/* DishCard — единый визуальный язык с BarMenuSection: tilt 3D через
   --bx/--by/--hover, warm hover-glow, photo parallax. Tilt отключается
   на mobile / reduced-motion / perf-tier='low'. */
function DishCard({ item, categoryName, quantity, onAdd, onInc, onDec }: DishCardProps) {
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
            <source
              type="image/avif-disabled"
              srcSet={`${toSmAvif(item.image)} 480w, ${toAvif(item.image)} 800w`}
              sizes="(max-width: 720px) 92vw, 380px"
            />
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
            sizes="(max-width: 720px) 92vw, 380px"
            alt=""
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
          />
        )
      ) : null}
      <div className="dish-card-body">
        <h4 className="dish-card-title">
          {item.title}
          {item.featured ? <span className="dish-badge dish-badge--top">топ</span> : null}
          {item.spicy ? <span className="dish-badge dish-badge--spicy" aria-label="Острое"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 2C12 2 14.5 5.5 14.5 9.5C14.5 11.5 13.5 13 12 14C10.5 13 9.5 11.5 9.5 9.5C9.5 5.5 12 2 12 2Z" fill="#d81420"/><path d="M12 6C12 6 13.5 7.8 13.5 9.8C13.5 11 12.8 11.8 12 12.3C11.2 11.8 10.5 11 10.5 9.8C10.5 7.8 12 6 12 6Z" fill="#e0a64b"/><path d="M8 14C7 16 7.5 18 9 19.5C10 20.5 11 21 12 21C13 21 14 20.5 15 19.5C16.5 18 17 16 16 14C15.5 15 14.5 16 12 16C9.5 16 8.5 15 8 14Z" fill="#d81420" opacity="0.7"/></svg></span> : null}
        </h4>
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

export function MenuPage() {
  const [menu, setMenu] = useState<MenuCategory[]>(fallbackMenu)
  const [activeCategory, setActiveCategory] = useState<string>(fallbackMenu[0]?.name ?? '')
  const [cartOpen, setCartOpen] = useState(false)
  const { cart, cartTotal, cartCount, addToCart, removeFromCart, incrementCart, decrementCart } = useCart()

  useEffect(() => {
    api.getMenu()
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setMenu(data)
          setActiveCategory((prev) => (data.find((c) => c.name === prev) ? prev : data[0].name))
        }
      })
      .catch(() => { /* fallback */ })
  }, [])

  const category = useMemo(() => menu.find((c) => c.name === activeCategory), [menu, activeCategory])

  const cartByTitle = useMemo(() => {
    const map = new Map<string, number>()
    cart.forEach((item) => map.set(item.title, item.quantity))
    return map
  }, [cart])

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const noop = useCallback(() => {}, [])

  return (
    <>
      <SharedHeader onOpenCart={openCart} />

      <main className="menu-page">
        {/* Hero-фото шапки меню — вне section-with-bg чтобы не обрезался overflow:clip */}
        <div className="menu-hero">
          <picture>
            <source media="(max-width: 768px)" srcSet="/assets/menu-hero-sm.webp" />
            <img src="/assets/menu-hero.webp" alt="" decoding="async" width={1600} height={900} fetchPriority="high" />
          </picture>
          <div className="menu-hero__veil" aria-hidden="true" />
          <div className="menu-hero__content">
            <span className="chapter">Меню</span>
            <FireText as="h2" intensity="strong" stagger={26}>
              Вкус, который говорит сам за себя.
            </FireText>
          </div>
          <p className="menu-hero__sub">
            Рёбра, брискет, северные ягоды, салаты и супы. Всё — с реальной кухни, с весом и описаниями.
          </p>
        </div>

        <section className="menu-section section-with-bg" data-bg="5" id="menu">
          <div className="section-bg" aria-hidden="true" />
          <div className="menu-layout">
            <aside className="menu-tabs" aria-label="Разделы меню">
              {menu.map((item) => (
                <FireButton
                  variant={item.name === activeCategory ? 'outline' : 'ghost'}
                  glow={item.name === activeCategory}
                  className="menu-tab-btn"
                  key={item.name}
                  onClick={() => setActiveCategory(item.name)}
                >
                  {item.name}
                  <span className="menu-tab-count">{item.items.length}</span>
                </FireButton>
              ))}
            </aside>
            <div className="menu-board menu-board-cards">
              <h3>{category?.name ?? 'Меню'}</h3>
              {category ? (
                <div className="menu-card-grid">
                  {category.items.map((item) => (
                    <DishCard
                      key={`${category.name}-${item.title}`}
                      item={item}
                      categoryName={category.name}
                      quantity={cartByTitle.get(item.title) ?? 0}
                      onAdd={() => addToCart(item.title, item.price, item.id, item.image)}
                      onInc={() => incrementCart(item.title)}
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
