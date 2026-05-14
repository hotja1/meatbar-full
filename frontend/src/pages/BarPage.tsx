import { lazy, Suspense, useState } from 'react'
import { SharedHeader } from '../components/SharedHeader'
import { BarMenuSection } from '../components/BarMenuSection'
import { useCart } from '../lib/CartContext'
import '../App.css'

const CartDrawer = lazy(() => import('../components/CartDrawer').then((m) => ({ default: m.CartDrawer })))

export function BarPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const { cart, cartTotal, removeFromCart, incrementCart, decrementCart } = useCart()

  return (
    <>
      <SharedHeader onOpenCart={() => setCartOpen(true)} />

      <main className="bar-page">
        <BarMenuSection />
      </main>

      <Suspense fallback={null}>
        {cartOpen ? (
          <CartDrawer
            open={cartOpen}
            cart={cart.map((item) => ({ ...item, image: item.image }))}
            total={cartTotal}
            phone=""
            onPhoneChange={() => {}}
            onClose={() => setCartOpen(false)}
            onRemove={removeFromCart}
            onIncrement={incrementCart}
            onDecrement={decrementCart}
            onSubmit={() => {}}
            state="idle"
            paymentUrl={null}
          />
        ) : null}
      </Suspense>
    </>
  )
}
