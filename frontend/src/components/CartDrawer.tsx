import { useEffect } from 'react'
import CreditCard from 'lucide-react/dist/esm/icons/credit-card.js'
import Minus from 'lucide-react/dist/esm/icons/minus.js'
import Plus from 'lucide-react/dist/esm/icons/plus.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js'
import X from 'lucide-react/dist/esm/icons/x.js'
import { FireButton } from './FireButton'
import { isWebp, toAvif } from '../lib/imageSources'
import './drawer.css'

export type CartDrawerItem = {
  itemId?: number
  title: string
  price: number
  quantity: number
  image?: string
}

type CartDrawerProps = {
  open: boolean
  cart: CartDrawerItem[]
  total: number
  phone: string
  onPhoneChange: (value: string) => void
  onClose: () => void
  onIncrement: (title: string) => void
  onDecrement: (title: string) => void
  onRemove: (title: string) => void
  onSubmit: () => void
  state: 'idle' | 'needs-phone' | 'sent'
  paymentUrl: string | null
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function CartDrawer({
  open,
  cart,
  total,
  phone,
  onPhoneChange,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onSubmit,
  state,
  paymentUrl,
}: CartDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={`drawer-root ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="drawer-scrim" aria-label="Закрыть корзину" onClick={onClose} />
      <aside className="drawer drawer-cart" role="dialog" aria-label="Корзина" aria-modal="true">
        <header className="drawer-head">
          <div className="drawer-title">
            <ShoppingBag size={20} />
            <div>
              <strong>Ваш заказ</strong>
              <span>{count ? `${count} поз. · ${formatPrice(total)} ₽` : 'пока пусто — выберите блюдо'}</span>
            </div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Закрыть корзину">
            <X size={20} />
          </button>
        </header>

        <div className="drawer-body">
          {cart.length ? (
            <ul className="drawer-list">
              {cart.map((item) => (
                <li key={item.title} className="drawer-line">
                  {item.image ? (
                    isWebp(item.image) ? (
                      <picture className="drawer-line-image">
                        <source srcSet={toAvif(item.image)} type="image/avif-disabled" />
                        <img className="drawer-line-image" src={item.image} alt="" loading="lazy" decoding="async" />
                      </picture>
                    ) : (
                      <img className="drawer-line-image" src={item.image} alt="" loading="lazy" decoding="async" />
                    )
                  ) : (
                    <span className="drawer-line-image drawer-line-image-fallback" aria-hidden="true">
                      <ShoppingBag size={18} />
                    </span>
                  )}
                  <div className="drawer-line-body">
                    <strong>{item.title}</strong>
                    <span>{formatPrice(item.price)} ₽ · за позицию</span>
                    <div className="drawer-qty">
                      <button type="button" onClick={() => onDecrement(item.title)} aria-label="Уменьшить">
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onIncrement(item.title)} aria-label="Увеличить">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="drawer-line-total">
                    <strong>{formatPrice(item.price * item.quantity)} ₽</strong>
                    <button type="button" className="drawer-line-remove" onClick={() => onRemove(item.title)} aria-label={`Убрать ${item.title}`}>
                      <Trash2 size={14} /> убрать
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="drawer-empty">
              <ShoppingBag size={36} />
              <strong>Корзина пуста</strong>
              <p>Добавьте блюдо из меню — здесь оно сразу появится. Можно править количество и сразу оформить.</p>
            </div>
          )}
        </div>

        <footer className="drawer-foot">
          <label className="drawer-input">
            <span>Телефон для подтверждения</span>
            <input
              inputMode="tel"
              placeholder="+7"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              autoComplete="tel"
            />
          </label>

          <div className="drawer-pay-line">
            <CreditCard size={18} />
            <span>Картой при получении · СБП · Онлайн</span>
          </div>

          <div className="drawer-total">
            <span>Итого</span>
            <strong>{formatPrice(total)} ₽</strong>
          </div>

          <FireButton onClick={onSubmit} className="full" disabled={!cart.length}>
            Оформить заказ
          </FireButton>

          {state === 'sent' && paymentUrl ? (
            <a href={paymentUrl} className="primary-link full drawer-pay-link">
              Перейти к оплате →
            </a>
          ) : null}
          {state === 'sent' && !paymentUrl ? (
            <p className="drawer-success">Готово! Менеджер позвонит для подтверждения заказа.</p>
          ) : null}
          {state === 'needs-phone' ? (
            <p className="drawer-error">Добавьте блюдо и оставьте телефон — без них заказ не уйдёт.</p>
          ) : null}
        </footer>
      </aside>
    </div>
  )
}
