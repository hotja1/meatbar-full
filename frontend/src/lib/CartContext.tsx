import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type CartItem = {
  itemId?: number
  title: string
  price: number
  quantity: number
  image?: string
}

type CartContextValue = {
  cart: CartItem[]
  cartTotal: number
  cartCount: number
  cartNotice: string
  addToCart: (title: string, price: number, itemId?: number, image?: string) => void
  removeFromCart: (title: string) => void
  incrementCart: (title: string) => void
  decrementCart: (title: string) => void
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartNotice, setCartNotice] = useState('')

  const addToCart = useCallback((title: string, price: number, itemId?: number, image?: string) => {
    setCart((current) => {
      const existing = current.find((item) => item.title === title)
      if (existing) {
        return current.map((item) => (item.title === title ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...current, { itemId, title, price, quantity: 1, image }]
    })
    setCartNotice(`${title} · в заказе`)
    window.setTimeout(() => setCartNotice(''), 1800)
  }, [])

  const removeFromCart = useCallback((title: string) => {
    setCart((current) => current.filter((item) => item.title !== title))
  }, [])

  const decrementCart = useCallback((title: string) => {
    setCart((current) =>
      current
        .map((item) => (item.title === title ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const incrementCart = useCallback((title: string) => {
    setCart((current) => current.map((item) => (item.title === title ? { ...item, quantity: item.quantity + 1 } : item)))
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, cartNotice, addToCart, removeFromCart, incrementCart, decrementCart, setCart }}>
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
