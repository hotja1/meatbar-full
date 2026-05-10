import { lazy, Suspense, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js'
import Clock from 'lucide-react/dist/esm/icons/clock.js'
import Flame from 'lucide-react/dist/esm/icons/flame.js'
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js'
import MenuIcon from 'lucide-react/dist/esm/icons/menu.js'
import Minus from 'lucide-react/dist/esm/icons/minus.js'
import Phone from 'lucide-react/dist/esm/icons/phone.js'
import Plus from 'lucide-react/dist/esm/icons/plus.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import type { MenuCategory } from '../data/menu'
/* Bar-меню — отдельный chunk; не нужен для FCP/LCP, поэтому
   ленивым импортом сразу попадает в свой бандл (Phase 9.D). */
const BarMenuSection = lazy(() =>
  import('../components/BarMenuSection').then((m) => ({ default: m.BarMenuSection })),
)
import { FireButton } from '../components/FireButton'
import { FireText } from '../components/FireText'
import { RotatingFireText } from '../components/RotatingFireText'
import { CloudHero } from '../components/CloudHero'
import type { CartDrawerItem } from '../components/CartDrawer'
import { SideNav } from '../components/SideNav'
import { PWAInstallPrompt } from '../components/PWAInstallPrompt'
import { AmbientAudio } from '../components/AmbientAudio'
import { AnimatedFire } from '../components/AnimatedFire'
import { EmberField } from '../components/EmberField'

const CartDrawer = lazy(() => import('../components/CartDrawer').then((m) => ({ default: m.CartDrawer })))
import { realisticTables } from '../data/tables-layout'
import type { MapTable } from '../components/TableMap'
const TableMap = lazy(() => import('../components/TableMap').then((m) => ({ default: m.TableMap })))
const BookingDialog = lazy(() =>
  import('../components/BookingDialog').then((m) => ({ default: m.BookingDialog })),
)
import { useRealtimeTables } from '../hooks/useRealtimeTables'
import { useParallaxPhotos } from '../hooks/useParallaxPhotos'
import { useSubtitleReveal } from '../hooks/useSubtitleReveal'
import { api } from '../lib/api'
import type { RestaurantTable } from '../lib/types'
import { detectPerfTier } from '../lib/perfTier'
import { isWebp, toAvif, toSmAvif, toSmWebp } from '../lib/imageSources'
import { trackEvent } from '../lib/analytics'
import '../App.css'
import './homepage-extra.css'

type Table = RestaurantTable

type Booking = {
  table: string
  tableId?: number
  guests: number
  date: string
  time: string
  name: string
  phone: string
  comment: string
}

type CartItem = CartDrawerItem

// Realistic floor layout — used both for the visual map and the
// fallback when the backend hasn't returned table data yet.
const fallbackTables: Table[] = realisticTables.map((table) => ({
  id: table.id,
  title: `Стол №${table.number}`,
  zone: table.zone,
  seats: table.seats,
  status: table.status,
  x: table.x,
  y: table.y,
  scene: table.scene ?? '',
  hall: table.hall,
  number: table.number,
  width: table.width,
  height: table.height,
  shape: table.shape,
}))

const tablesByNumber = new Map(realisticTables.map((table) => [table.number, table]))
const tablesById = new Map(realisticTables.map((table) => [table.id, table]))

/**
 * #11 — «Мой выбор». Помним ид выбранного стола в localStorage,
 * чтобы при возврате на сайт поднять тот же вариант. Админка
 * про этот ключ НЕ знает — 100% клиентская память.
 */
const MY_TABLE_KEY = 'meatbar:my-table'

/**
 * Phase 12 fix #2 + Phase 13 fix — клик по «Бронь» должен жёстко
 * приземлиться на `<section id="booking">`.
 *
 * Раньше, когда мы полагались только на `href="#booking"` или
 * `scrollIntoView({block:'start'})`, в части браузеров пользователь
 * оказывался на секции «Соберите заказ» (она лежит выше брони).
 * Причины две:
 *  - смузи-скролл прерывался intersection-observer-ами на пути;
 *  - 96px sticky-header перекрывал заголовок booking-секции.
 *
 * Phase 13 фикс: к моменту первого клика «Бронь» лениво-загружаемая
 * секция `BarMenuSection` (между #order и #booking) могла ещё не
 * приехать. Пока шёл smooth-scroll, чанк догружался, верхняя часть
 * страницы росла → реальная позиция #booking уезжала вниз и
 * пользователь приземлялся на «Соберите заказ».
 *
 * Решение:
 *  1) Триггерим `import('../components/BarMenuSection')` ещё до
 *     старта скролла (этот же чанк используется в JSX, поэтому
 *     повторных запросов не будет — браузер заберёт уже готовый
 *     модуль из памяти).
 *  2) Считаем `top + scrollY - HEADER_OFFSET` сами и
 *     `window.scrollTo` с явной координатой.
 *  3) После окончания smooth-скролла дополнительно «settle» —
 *     ещё несколько раз пересчитываем позицию (чанк / lazy-images
 *     к этому моменту обычно уже разложились) и при необходимости
 *     дотягиваем точно к #booking. Если пользователь начал крутить
 *     сам — settle прерывается.
 *  4) `scroll-margin-top: 96px` на #booking страхует и хеш-навигацию.
 */
const HEADER_OFFSET = 96
const MENU_CACHE_KEY = 'meatbar:menu-cache'

function runIdle(task: () => void, timeout = 1400) {
  if (typeof window === 'undefined') return
  const ric = (window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  }).requestIdleCallback
  if (typeof ric === 'function') {
    ric(() => task(), { timeout })
    return
  }
  window.setTimeout(task, 32)
}

function readMenuCache(): MenuCategory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(MENU_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const safe = parsed.filter((c) => {
      return (
        c &&
        typeof c === 'object' &&
        typeof (c as { name?: unknown }).name === 'string' &&
        Array.isArray((c as { items?: unknown[] }).items)
      )
    }) as MenuCategory[]
    return safe
  } catch {
    return []
  }
}

function writeMenuCache(menu: MenuCategory[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menu))
  } catch {
    /* ignore localStorage quota/private mode */
  }
}

function preloadBookingChunks() {
  /* Затягиваем оба ленивых чанка между #order и #booking, чтобы к
     моменту приземления курсора их размер уже был учтён в layout. */
  const bar = import('../components/BarMenuSection').catch(() => null)
  // Warm up booking UI chunks too (TableMap + BookingDialog) so the
  // floorplan opens without an extra network roundtrip.
  void import('../components/TableMap').catch(() => null)
  void import('../components/BookingDialog').catch(() => null)
  return bar
}

function scrollToBooking(event?: ReactMouseEvent<HTMLElement>) {
  if (typeof document === 'undefined') return
  const target = document.getElementById('booking')
  if (!target) return
  if (event) event.preventDefault()
  const preload = preloadBookingChunks()

  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const goTo = (smooth: boolean) => {
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({
      top: Math.max(0, top),
      behavior: smooth && !reduced ? 'smooth' : 'auto',
    })
  }

  // Force-stable behavior: always land on booking, never on order.
  // We do immediate jump + several layout-shift corrections.
  void (async () => {
    try {
      await Promise.race([
        preload,
        new Promise((r) => window.setTimeout(r, 300)),
      ])
    } catch {
      /* noop */
    }
    await new Promise<void>((r) => window.requestAnimationFrame(() => r()))
    goTo(false)

    const stops = [80, 180, 320, 520, 760, 980]
    stops.forEach((delay) => {
      window.setTimeout(() => {
        const off = target.getBoundingClientRect().top - HEADER_OFFSET
        if (Math.abs(off) > 6) goTo(false)
      }, delay)
    })

    if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
      history.replaceState(null, '', '#booking')
    }
  })()
}

function readMyTableId(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(MY_TABLE_KEY)
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeMyTableId(id: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MY_TABLE_KEY, String(id))
  } catch {
    /* localStorage может быть недоступен в приват-режиме — игнорируем. */
  }
}

function normalizeTable(table: RestaurantTable): Table | null {
  const mapTable = tablesByNumber.get(table.number ?? table.id) ?? tablesById.get(table.id)
  if (!mapTable) {
    const number = table.number ?? table.id
    return {
      id: table.id,
      title: table.title?.startsWith('Стол №') ? table.title : `Стол №${number}`,
      zone: table.zone,
      seats: table.seats,
      status: table.status,
      x: table.x,
      y: table.y,
      scene: table.scene ?? '',
      hall: table.hall ?? (number <= 21 ? 1 : 2),
      number,
      width: table.width,
      height: table.height,
      shape: table.shape,
      notes: table.notes,
    }
  }
  return {
    id: table.id,
    title: table.title?.startsWith('Стол №') ? table.title : `Стол №${mapTable.number}`,
    zone: mapTable.zone,
    seats: mapTable.seats,
    status: table.status ?? mapTable.status,
    x: mapTable.x,
    y: mapTable.y,
    scene: mapTable.scene ?? table.scene ?? '',
    hall: mapTable.hall,
    number: mapTable.number,
    width: mapTable.width,
    height: mapTable.height,
    shape: mapTable.shape,
    notes: table.notes,
  }
}

const scenes = [
  {
    kicker: '01 · Дым',
    title: 'Зашли — и сразу слышен гриль.',
    text: 'Угли, тёплый свет и шум открытой кухни встречают раньше, чем приносят меню. Это первая причина задержаться.',
    image: '/assets/journey-1.webp',
    imageSm: '/assets/journey-1-sm.webp',
  },
  {
    kicker: '02 · Север',
    title: 'Брискет, брусника и тёмные соусы.',
    text: 'Северная кухня Югры на углях: брискет, рёбра, мясо с лесными ягодами и густыми соусами. Своя, не привезённая.',
    image: '/assets/journey-2.webp',
    imageSm: '/assets/journey-2-sm.webp',
  },
  {
    kicker: '03 · Стол',
    title: 'Свой столик — за минуту.',
    text: 'Выбираете не строчку в списке, а место в зале: окно, гриль или диван у бара. Бронь подтверждаем звонком.',
    image: '/assets/journey-3.webp',
    imageSm: '/assets/journey-3-sm.webp',
  },
]

const cultures = [
  {
    name: 'Дым и угли',
    title: 'Рёбра, брискет и долгий жар',
    text: 'Медленный огонь, тёмная глазурь, лук кольцами и коул-слоу. Берите рёбра — они здесь главные.',
    image: '/assets/clean-ribs-plate.webp',
    stat: '450 г',
  },
  {
    name: 'Север',
    title: 'Томлёное мясо, клюква и тёмные соусы',
    text: 'Югра на тарелке: томлёная говядина, брусника, чёрная смородина и картофельное пюре. Только локальные акценты.',
    image: '/assets/clean-deer-final.webp',
    stat: 'хит',
  },
  {
    name: 'Бар',
    title: 'Стейки, коктейли, окно и вечер',
    text: 'Сядьте у окна или в баре — вечер начинается с напитка и неспешного выбора места.',
    image: '/assets/clean-chef-pour-wide.webp',
    stat: '122 места',
  },
  {
    name: 'Ланч',
    title: 'Быстрый обед без компромиссов',
    text: 'Супы, салаты, горячее и мясо на гриле. С 11:00 — ланчи, которые не отнимают весь обеденный час.',
    image: '/assets/solyanka-wide.webp',
    stat: '11:00',
  },
]

/* Дорожка под бронированием теперь генерируется из реального меню
   (см. galleryFromMenu в HomePage). Старый фиксированный список
   убран в Task 9b. */

const featuredItems = [
  'Брискет с пюре',
  'BBQ',
  'Томлёная рулька',
  'Цезарь с креветками',
  'С тунцом, печёными цуккини и имбирной заправкой',
  'Стейк из свинины',
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU').format(price)
}

export function HomePage() {
  const [menu, setMenu] = useState<MenuCategory[]>(() => readMenuCache())
  const [tables, setTables] = useState<Table[]>(fallbackTables)
  // mobileOpen state replaced by `navOpen` (SideNav drawer)
  const [activeCategory, setActiveCategory] = useState<string>(() => readMenuCache()[0]?.name ?? '')
  const [selectedTable, setSelectedTable] = useState<Table>(() => {
    // #11 — восстанавливаем «мой выбор» из localStorage,
    // если сохранённый стол ещё есть в fallback-данных.
    const savedId = readMyTableId()
    if (savedId != null) {
      const saved = fallbackTables.find((t) => t.id === savedId)
      if (saved) return saved
    }
    return fallbackTables[0]
  })
  const [booking, setBooking] = useState<Booking>({
    table: fallbackTables[0].title,
    tableId: fallbackTables[0].id,
    guests: 2,
    date: '',
    time: '',
    name: '',
    phone: '',
    comment: '',
  })
  const [bookingState, setBookingState] = useState<'idle' | 'sent'>('idle')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderPhone, setOrderPhone] = useState('')
  const [orderState, setOrderState] = useState<'idle' | 'needs-phone' | 'sent'>('idle')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [cartNotice, setCartNotice] = useState('')
  const [introDone, setIntroDone] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const bookingSectionRef = useRef<HTMLElement | null>(null)
  const [bookingSectionNear, setBookingSectionNear] = useState(false)
  const gallerySectionRef = useRef<HTMLElement | null>(null)
  const [gallerySectionNear, setGallerySectionNear] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 1600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    const saveData = Boolean(conn?.saveData)
    const verySlowNetwork = /(?:^|[^4-9])2g/i.test(conn?.effectiveType ?? '')
    if (detectPerfTier() === 'low' || saveData || verySlowNetwork) return
    runIdle(() => {
      preloadBookingChunks()
    }, 2200)
  }, [])

  // Heavy floorplan SVG should run only near the booking section.
  useEffect(() => {
    const el = bookingSectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false
        setBookingSectionNear((prev) => (prev === visible ? prev : visible))
      },
      { root: null, rootMargin: '35% 0px 35% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Infinite gallery animation should run only when its section is nearby.
  useEffect(() => {
    const el = gallerySectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false
        setGallerySectionNear((prev) => (prev === visible ? prev : visible))
      },
      { root: null, rootMargin: '30% 0px 30% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useRealtimeTables(setTables)
  /* Task 10: «живые» фото на скролле — single rAF, IO-throttled. */
  useParallaxPhotos('.parallax-photo')
  /* iter3: subtitle slide-in — все параграфы под FireText въезжают слева/справа. */
  useSubtitleReveal('.subtitle-reveal')

  useEffect(() => {
    let mounted = true
    api
      .getMenu()
      .then((m) => {
        if (Array.isArray(m) && m.length) {
          const next = m as MenuCategory[]
          if (!mounted) return
          setMenu(next)
          setActiveCategory(next[0].name)
          writeMenuCache(next)
        }
      })
      .catch(async () => {
        // Keep fallback-first behavior without forcing heavy local data
        // into the initial bundle.
        if (menu.length) return
        try {
          const mod = await import('../data/menu')
          if (!mounted || !mod.menu.length) return
          setMenu(mod.menu)
          setActiveCategory(mod.menu[0].name)
          writeMenuCache(mod.menu)
        } catch {
          /* noop */
        }
      })
    api
      .getTables()
      .then((t) => {
        if (Array.isArray(t) && t.length) {
          const normalized = t.map(normalizeTable).filter((table): table is Table => table !== null)
          if (!normalized.length) return
          setTables(normalized)
          // #11 — если в localStorage есть «мой стол» и он свободен
          // — поднимаем его, иначе берём первый свободный.
          const savedId = readMyTableId()
          const savedTable = savedId != null
            ? normalized.find((table) => table.id === savedId && table.status !== 'reserved')
            : null
          const firstFree = savedTable ?? normalized.find((table) => table.status === 'free') ?? normalized[0]
          setSelectedTable(firstFree)
          setBooking((current) => ({
            ...current,
            table: firstFree.title,
            tableId: firstFree.id,
          }))
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [menu.length])

  const category = useMemo<MenuCategory | null>(
    () => menu.find((item) => item.name === activeCategory) ?? menu[0] ?? null,
    [activeCategory, menu],
  )
  const visibleMenuCount = useMemo(
    () => menu.reduce((sum, item) => sum + item.items.length, 0),
    [menu],
  )
  const featuredMenu = useMemo(
    () =>
      menu
        .flatMap((menuCategory) => menuCategory.items.map((item) => ({ ...item, category: menuCategory.name })))
        .filter((item) => featuredItems.includes(item.title))
        .slice(0, 6),
    [menu],
  )
  /* Дорожка фото под бронированием (Task 9b): берём ВСЕ позиции
     меню, в которых задана картинка, без дублей. Это автоматически
     обновляется при добавлении новых блюд в menu.ts. */
  const galleryFromMenu = useMemo(() => {
    const seen = new Set<string>()
    const out: { src: string; alt: string }[] = []
    for (const cat of menu) {
      for (const item of cat.items) {
        if (!item.image) continue
        if (seen.has(item.image)) continue
        seen.add(item.image)
        out.push({ src: item.image, alt: item.title })
      }
    }
    return out
  }, [menu])
  const galleryLoopItems = useMemo(
    () => [...galleryFromMenu, ...galleryFromMenu],
    [galleryFromMenu],
  )
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const cartByTitle = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of cart) map.set(item.title, item.quantity)
    return map
  }, [cart])

  const addToCart = (title: string, price: number, itemId?: number, image?: string) => {
    setCart((current) => {
      const existing = current.find((item) => item.title === title)
      if (existing) {
        return current.map((item) => (item.title === title ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...current, { itemId, title, price, quantity: 1, image }]
    })
    setCartNotice(`${title} · в заказе`)
    window.setTimeout(() => setCartNotice(''), 1800)
    setOrderState('idle')
  }

  const removeFromCart = (title: string) => {
    setCart((current) => current.filter((item) => item.title !== title))
    setOrderState('idle')
  }

  const decrementCart = (title: string) => {
    setCart((current) =>
      current
        .map((item) => (item.title === title ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
    setOrderState('idle')
  }

  const incrementCart = (title: string) => {
    setCart((current) => current.map((item) => (item.title === title ? { ...item, quantity: item.quantity + 1 } : item)))
  }

  const submitOrder = async () => {
    if (!cart.length || !orderPhone) {
      setOrderState('needs-phone')
      trackEvent('order_submit_missing_phone', { items_count: cart.length })
      return
    }
    try {
      const result = await api.createOrder({
        items: cart.map((item) => ({
          itemId: item.itemId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        phone: orderPhone,
        total: cartTotal,
        payment: 'pending',
        delivery: 'pickup',
      })
      setOrderState('sent')
      const url = (result as unknown as { paymentUrl?: string | null }).paymentUrl
      if (url) setPaymentUrl(url)
      trackEvent('order_submit_success', {
        items_count: cart.length,
        total: cartTotal,
        payment_link: Boolean(url),
      })
    } catch {
      setOrderState('sent')
      trackEvent('order_submit_failed', { items_count: cart.length, total: cartTotal })
    }
  }

  const chooseTable = (table: Table) => {
    if (table.status === 'reserved') {
      return
    }
    setSelectedTable(table)
    // #11 — фиксируем выбор в localStorage. Бэкенду это ничего
    // не говорит и не бронирует стол — это исключительно «моя память».
    writeMyTableId(table.id)
    setBooking((current) => ({
      ...current,
      table: table.title,
      tableId: table.id,
      guests: Math.min(current.guests, table.seats),
    }))
    setBookingState('idle')
  }

  // mapped для SVG TableMap (нужны hall/x/y/width/height/shape)
  const mappedTables = useMemo<MapTable[]>(() => {
    return (tables as Array<Table & { id: number }>).map((t) => {
      const rt = realisticTables.find(
        (r) => r.number === ((t as { number?: number }).number ?? t.id),
      )
      return {
        id: t.id,
        number: (t as { number?: number }).number ?? t.id,
        hall:
          (rt?.hall ??
            (t as { hall?: 1 | 2 | 3 }).hall ??
            (((t as { number?: number }).number ?? t.id) <= 7
              ? 1
              : ((t as { number?: number }).number ?? t.id) <= 21
                ? 2
                : 3)) as 1 | 2 | 3,
        zone: rt?.zone ?? t.zone,
        seats: rt?.seats ?? t.seats,
        status: rt?.status ?? t.status,
        x: rt?.x ?? t.x,
        y: rt?.y ?? t.y,
        width: rt?.width ?? t.width ?? 70,
        height: rt?.height ?? t.height ?? 60,
        shape: (rt?.shape ?? t.shape ?? 'rect') as 'rect' | 'round',
        scene: rt?.scene ?? t.scene,
      }
    })
  }, [tables])

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!booking.name || !booking.phone || !booking.date || !booking.time) {
      trackEvent('booking_submit_invalid', { table_id: selectedTable.id, guests: booking.guests })
      return
    }
    try {
      await api.createBooking({
        table: selectedTable.title,
        tableId: selectedTable.id,
        guests: booking.guests,
        date: booking.date,
        time: booking.time,
        name: booking.name,
        phone: booking.phone,
        comment: booking.comment.trim() || undefined,
      })
      setBookingState('sent')
      trackEvent('booking_submit_success', { table_id: selectedTable.id, guests: booking.guests })
    } catch {
      setBookingState('sent')
      trackEvent('booking_submit_failed', { table_id: selectedTable.id, guests: booking.guests })
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main>
      {!introDone ? <IntroOverlay /> : null}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenNav={() => setNavOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      <section className="cinema-hero" id="home">
        <div className="film-grain" />
        <div className="hero-video" aria-hidden="true">
          <HeroReel />
          {/* Dense ambient ember/spark field above the video. The user
              asked for many more flying flame circles — EmberField paints
              them on a single canvas, IO-paused when offscreen. */}
          <EmberField className="hero-embers" density={25} />
        </div>
        <div className="hero-content">
          <span className="chapter">Гриль-бар · Нижневартовск</span>
          {/* Task 10: 6 ротационных фраз с огнём, цикл 10 секунд.
              Первая фраза — «якорь» (Мясо, огонь и зал…), потом
              5 новых тематических, потом снова с первой. */}
          <RotatingFireText
            phrases={[
              'Мясо, огонь и зал, где остаются.',
              'Дым в гриле, вино в бокале — вечер не спешит.',
              'Север, дрова и плотный звук разговора.',
              'Здесь рёбра падают с кости — и это норма.',
              'Тёплая медь огня, тёмное дерево, ваш ритм.',
              'Брискет 14 часов на углях. Один час — и вы здесь.',
            ]}
            intervalMs={10_000}
            intensity="strong"
            stagger={36}
          />
          <p>
            Гриль-бар в самом центре Югры: рёбра, брискет, дым и вечер, который
            хочется растянуть. Выберите столик и приходите — остальное мы возьмём на себя.
          </p>
          <div className="hero-actions">
            <FireButton onClick={() => scrollToBooking()}>
              Выбрать столик <ChevronRight size={18} />
            </FireButton>
            <FireButton variant="outline" onClick={() => (window.location.hash = '#menu')}>
              Открыть меню
            </FireButton>
            <FireButton variant="ghost" onClick={() => setCartOpen(true)}>
              Собрать заказ
            </FireButton>
          </div>
        </div>
      </section>

      <CloudHero
        image="/assets/cloud-hero.png"
        imageAvif="/assets/cloud-hero.avif"
        imageWebp="/assets/cloud-hero.webp"
        imageSm="/assets/cloud-hero-sm.png"
        imageSmAvif="/assets/cloud-hero-sm.avif"
        imageSmWebp="/assets/cloud-hero-sm.webp"
        kicker="Наш зал · Мясо Бар"
        title="Место, где гости остаются на третий час."
        subtitle="Диваны, кирпич, дерево и живой огонь в витрине дров. Это не просто фото — именно здесь вы и окажетесь, когда придёте."
      />

      <section className="journey section-with-bg" data-bg="1" id="journey">
        <div className="section-bg" aria-hidden="true" />
        <div className="section-intro">
          <span className="chapter">Путь вечера</span>
          <FireText as="h2" intensity="strong" stagger={28}>Дым, север и свой столик — три истории одного вечера.</FireText>
        </div>
        <div className="scene-stack">
          {scenes.map((scene) => (
            <article className="scene-card" key={scene.title}>
              <div>
                <span>{scene.kicker}</span>
                <h3>{scene.title}</h3>
                <p>{scene.text}</p>
              </div>
              <picture>
                <source
                  type="image/avif-disabled"
                  srcSet={`${toAvif(scene.imageSm)} 800w, ${toAvif(scene.image)} 1600w`}
                  sizes="(max-width: 720px) 100vw, 800px"
                />
                <img
                  src={scene.image}
                  srcSet={`${scene.imageSm} 800w, ${scene.image} 1600w`}
                  sizes="(max-width: 720px) 100vw, 800px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </article>
          ))}
        </div>
      </section>

      <section className="cultures-section section-with-bg" data-bg="2">
        <div className="section-bg" aria-hidden="true" />
        <div className="section-intro row">
          <div>
            <span className="chapter">Четыре настроения</span>
            <FireText as="h2" intensity="soft" stagger={24}>Четыре вечера внутри одного зала.</FireText>
          </div>
          <p className="subtitle-reveal subtitle-reveal--right">
            Рёбра в дыму, северные ягоды, коктейли у окна и сытный ланч — выбирайте,
            каким будет ваш вечер в Мясо Бар.
          </p>
        </div>
        <div className="culture-wheel" aria-label="Интерактивные культуры Мясо Бар">
          {cultures.map((culture, index) => (
            <article className="culture-tile" key={culture.name} style={{ '--i': index } as React.CSSProperties}>
              {isWebp(culture.image) ? (
                <picture>
                  <source srcSet={toAvif(culture.image)} type="image/avif-disabled" />
                  <img src={culture.image} alt="" loading="lazy" decoding="async" />
                </picture>
              ) : (
                <img src={culture.image} alt="" loading="lazy" decoding="async" />
              )}
              <div className="culture-overlay">
                <span>{culture.name}</span>
                <h3>{culture.title}</h3>
                <p>{culture.text}</p>
                <strong>{culture.stat}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="split-story section-with-bg" data-bg="3">
        <div className="section-bg" aria-hidden="true" />
        <div className="split-panel sticky-panel">
          <span className="chapter">Мясо Бар</span>
          <FireText as="h2" intensity="strong" stagger={28}>Жарим и коптим — каждый день под ваш вечер.</FireText>
          <p className="subtitle-reveal">
            Каждое блюдо здесь — приглашение в зал. Садитесь у огня, берите рёбра в дыму
            и оставайтесь на вечер — или берите с собой, если спешите.
          </p>
        </div>
        <div className="split-panel image-panel">
          {/* iter5: логотип и фото — оба «живые». Логотип не уезжает
              из контейнера (object-fit:contain + clamp transforms), а
              фото внутри parallax-photo получает дополнительный 3D-tilt
              как у баркарт. */}
          <div
            className="split-live-logo"
            onPointerMove={(e) => {
              const target = e.currentTarget
              const r = target.getBoundingClientRect()
              const bx = ((e.clientX - r.left) / r.width - 0.5) * 2
              const by = ((e.clientY - r.top) / r.height - 0.5) * 2
              target.style.setProperty('--bx', String(bx))
              target.style.setProperty('--by', String(by))
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.setProperty('--bx', '0')
              e.currentTarget.style.setProperty('--by', '0')
            }}
          >
            <picture>
              <source srcSet="/assets/meatbar-logo-mark.avif" type="image/avif-disabled" />
              <img
                className="split-logo-mark"
                src="/assets/meatbar-logo-mark.webp"
                alt="Логотип Мясо Бар"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="split-live-logo-glow" aria-hidden="true" />
          </div>
          <div
            className="split-live-photo parallax-photo"
            onPointerMove={(e) => {
              const target = e.currentTarget
              const r = target.getBoundingClientRect()
              const bx = ((e.clientX - r.left) / r.width - 0.5) * 2
              const by = ((e.clientY - r.top) / r.height - 0.5) * 2
              target.style.setProperty('--bx', String(bx))
              target.style.setProperty('--by', String(by))
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.setProperty('--bx', '0')
              e.currentTarget.style.setProperty('--by', '0')
            }}
          >
            <picture>
              <source
                type="image/avif-disabled"
                srcSet="/assets/meatbar-hall-sm.avif 800w, /assets/meatbar-hall.avif 1600w"
                sizes="(max-width: 720px) 100vw, 800px"
              />
              <img
                src="/assets/meatbar-hall.webp"
                srcSet="/assets/meatbar-hall-sm.webp 800w, /assets/meatbar-hall.webp 1600w"
                sizes="(max-width: 720px) 100vw, 800px"
                alt="Зал Мясо Бар"
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="split-live-photo-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="interactive-tools section-with-bg" data-bg="4">
        <div className="section-bg" aria-hidden="true" />
        <div className="tool-copy">
          <span className="chapter">Что сделать сейчас</span>
          <FireText as="h2" intensity="strong" stagger={28}>Бронь, заказ или звонок — выберите своё.</FireText>
          <p className="subtitle-reveal subtitle-reveal--right">
            Одним движением: открыть меню, добавить блюдо, забронировать стол
            в зале или позвонить в ресторан напрямую.
          </p>
        </div>
        <div className="tool-grid">
          <a href="#menu">
            <Flame />
            <span>Открыть меню</span>
            <small>{visibleMenuCount} позиций</small>
          </a>
          <a href="#order">
            <ShoppingBag />
            <span>Собрать заказ</span>
            <small>доставка / самовывоз</small>
          </a>
          <a href="#booking" onClick={scrollToBooking}>
            <CalendarDays />
            <span>Выбрать стол</span>
            <small>схема зала</small>
          </a>
          <a href="tel:+79129074747">
            <Phone />
            <span>Позвонить</span>
            <small>+7 912 907-47-47</small>
          </a>
          <a href="https://www.instagram.com/meatbar_nv/" target="_blank" rel="noreferrer">
            <img className="social-icon" src="/assets/social/instagram.svg" alt="" loading="lazy" decoding="async" />
            <span>Instagram</span>
            <small>@meatbar_nv</small>
          </a>
          <a href="https://vk.com/meatbar_nv" target="_blank" rel="noreferrer">
            <img className="social-icon" src="/assets/social/vk.svg" alt="" loading="lazy" decoding="async" />
            <span>VK</span>
            <small>МЯСО БАР</small>
          </a>
          <a href="https://2gis.ru/nizhnevartovsk/firm/70000001086984807" target="_blank" rel="noreferrer">
            <img className="social-icon" src="/assets/social/2gis.webp" alt="" loading="lazy" decoding="async" />
            <span>2ГИС</span>
            <small>4.7 · 751 оценка</small>
          </a>
        </div>
      </section>

      <section className="menu-section section-with-bg" data-bg="5" id="menu">
        <div className="section-bg" aria-hidden="true" />
        <div className="section-intro row">
          <div>
            <span className="chapter">Меню</span>
            <FireText as="h2" intensity="strong" stagger={26}>{`${visibleMenuCount} блюд, которые мы готовим сегодня.`}</FireText>
          </div>
          <p className="subtitle-reveal">Рёбра, брискет, северные ягоды, салаты и супы. Всё — с реальной кухни, с весом и описаниями.</p>
        </div>
        <div className="menu-layout">
          <aside className="menu-tabs" aria-label="Разделы меню">
            {menu.map((item) => (
              <button
                className={item.name === activeCategory ? 'active' : ''}
                key={item.name}
                onClick={() => setActiveCategory(item.name)}
              >
                {item.name}
                <span>{item.items.length}</span>
              </button>
            ))}
          </aside>
          <div className="menu-board menu-board-cards">
            <h3>{category?.name ?? 'Меню'}</h3>
            {category ? (
              <div className="menu-card-grid">
                {category.items.map((item) => (
                  <article className={`dish-card${item.image ? ' parallax-photo' : ' dish-card-no-img'}`} key={`${category.name}-${item.title}`}>
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
                  <div>
                    <span>{item.weight ?? category.name}</span>
                    <h4>{item.title}</h4>
                    {item.description ? <p>{item.description}</p> : null}
                    <footer>
                      <strong>{formatPrice(item.price)} ₽</strong>
                      {cartByTitle.get(item.title) ? (
                        <div className="dish-qty" role="group" aria-label={`Количество: ${item.title}`}>
                          <button
                            type="button"
                            className="dish-qty-btn"
                            aria-label={`Уменьшить ${item.title}`}
                            onClick={() => decrementCart(item.title)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="dish-qty-value" aria-live="polite">
                            {cartByTitle.get(item.title)}
                          </span>
                          <button
                            type="button"
                            className="dish-qty-btn"
                            aria-label={`Увеличить ${item.title}`}
                            onClick={() => incrementCart(item.title)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            addToCart(
                              item.title,
                              item.price,
                              item.id,
                              item.image,
                            )
                          }
                        >
                          В заказ
                        </button>
                      )}
                    </footer>
                  </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="subtitle-reveal is-revealed">Загружаем меню…</p>
            )}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BarMenuSection />
      </Suspense>

      <section className="order-section" id="order">
        <div className="section-intro row">
          <div>
            <span className="chapter">Самовывоз и доставка</span>
            <FireText as="h2" intensity="strong" stagger={26}>Соберите заказ за минуту.</FireText>
          </div>
          <p className="subtitle-reveal subtitle-reveal--right">
            Добавьте блюда в корзину, оставьте телефон — мы перезвоним и подготовим всё
            к вашему приходу. Оплата: карта, наличные, СБП или Онлайн.
          </p>
        </div>
        <div className="order-layout">
          <div className="featured-dishes">
            {featuredMenu.map((item) => (
              <article className="featured-dish parallax-photo" key={item.title}>
                {item.image ? (
                  isWebp(item.image) ? (
                    <picture>
                      <source
                        type="image/avif-disabled"
                        srcSet={`${toSmAvif(item.image)} 480w, ${toAvif(item.image)} 800w`}
                        sizes="(max-width: 980px) 92vw, 520px"
                      />
                      <img
                        src={item.image}
                        srcSet={`${toSmWebp(item.image)} 480w, ${item.image} 800w`}
                        sizes="(max-width: 980px) 92vw, 520px"
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
                      sizes="(max-width: 980px) 92vw, 520px"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={800}
                      height={600}
                    />
                  )
                ) : <div className="featured-dish-placeholder" />}
                <div>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description ?? item.weight}</p>
                  {cartByTitle.get(item.title) ? (
                    <div className="dish-qty featured-dish-qty" role="group" aria-label={`Количество: ${item.title}`}>
                      <button
                        type="button"
                        className="dish-qty-btn"
                        aria-label={`Уменьшить ${item.title}`}
                        onClick={() => decrementCart(item.title)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="dish-qty-value" aria-live="polite">
                        {cartByTitle.get(item.title)} · {formatPrice(item.price * (cartByTitle.get(item.title) ?? 1))} ₽
                      </span>
                      <button
                        type="button"
                        className="dish-qty-btn"
                        aria-label={`Увеличить ${item.title}`}
                        onClick={() => incrementCart(item.title)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addToCart(
                          item.title,
                          item.price,
                          item.id,
                          item.image,
                        )
                      }
                    >
                      Добавить · {formatPrice(item.price)} ₽
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary-card">
            <div className="cart-summary-head">
              <ShoppingBag size={22} />
              <div>
                <strong>Ваш заказ</strong>
                <span>{cartCount ? `${cartCount} поз. · ${formatPrice(cartTotal)} ₽` : 'пока пусто — выберите блюдо'}</span>
              </div>
            </div>
            <p className="cart-summary-text">
              Корзина живёт в правой панели — нажмите кнопку ниже, чтобы посмотреть весь заказ,
              указать телефон и оформить.
            </p>
            <FireButton onClick={() => setCartOpen(true)} className="full">
              Открыть корзину {cartCount ? `· ${formatPrice(cartTotal)} ₽` : ''}
            </FireButton>
          </aside>
        </div>
      </section>

      {cartNotice ? <div className="cart-toast">{cartNotice}</div> : null}

      {/* Сжатая mobile-CTA: убрана дубликатная кнопка корзины — используется верхняя
          и боковая навигация. Оставлены только бронь и звонок. */}
      <nav className="mobile-cta-bar" aria-label="Быстрые действия">
        <a className="book" href="#booking" data-nav="booking" onClick={scrollToBooking}>
          Выбрать стол
        </a>
        <a className="order" href="tel:+79129074747">Позвонить</a>
      </nav>

      <section ref={bookingSectionRef} className="booking-section booking-section--floor" id="booking">
        <div className="section-intro row">
          <div>
            <span className="chapter">Бронь столика</span>
            <FireText as="h2" intensity="strong" stagger={26}>Выберите место в зале — как в жизни.</FireText>
          </div>
          <p className="subtitle-reveal">
            Откройте зал и нажмите на свой столик — откроется большой просмотр
            с живым фото места и форма брони в одном экране. Администратор
            подтвердит время звонком.
          </p>
        </div>

        <div className="booking-experience booking-experience--floor">
          <div className="booking-floor booking-floor--solo">
            {/* Phase 9.2: карточки-сцены и видео переехали внутрь
                BookingDialog. План зала — единственный вход в бронь:
                клик по столу открывает модалку с автоплеем видео. */}
            <Suspense
              fallback={
                <div className="floorplan" aria-hidden="true">
                  <div className="floorplan-stage" style={{ minHeight: 520 }} />
                </div>
              }
            >
              {bookingSectionNear || bookingOpen ? (
                <TableMap
                  tables={mappedTables}
                  selected={mappedTables.find((t) => t.id === selectedTable.id) ?? null}
                  onSelect={(t) => {
                    // Warm up the dialog chunk before showing it.
                    preloadBookingChunks()
                    const matched = (tables as Table[]).find((x) => x.id === t.id)
                    if (!matched) return
                    chooseTable({
                      ...matched,
                      seats: t.seats,
                      hall: t.hall,
                      number: t.number,
                    } as Table)
                    setBookingState('idle')
                    setBookingOpen(true)
                    trackEvent('booking_dialog_open', {
                      table_id: matched.id,
                      table_number: matched.number,
                      hall: t.hall,
                    })
                  }}
                />
              ) : (
                <div className="floorplan" aria-hidden="true">
                  <div className="floorplan-stage" style={{ minHeight: 520 }} />
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BookingDialog
          open={bookingOpen}
          table={
            bookingOpen
              ? mappedTables.find((t) => t.id === selectedTable.id) ?? null
              : null
          }
          booking={{
            guests: booking.guests,
            date: booking.date,
            time: booking.time,
            name: booking.name,
            phone: booking.phone,
            comment: booking.comment,
          }}
          onChange={(next) =>
            setBooking({
              ...booking,
              guests: next.guests,
              date: next.date,
              time: next.time,
              name: next.name,
              phone: next.phone,
              comment: next.comment,
            })
          }
          onClose={() => setBookingOpen(false)}
          onSubmit={(event) => {
            submitBooking(event)
          }}
          state={bookingState}
        />
      </Suspense>

      <section className="jobs-section" id="jobs">
        <div className="jobs-card">
          <span className="chapter">Вакансии</span>
          <h2>Команда Мясо Бар растёт.</h2>
          <p>
            Ищем людей в зал и на кухню: официанты, бар, повара горячего цеха и гриля.
            Отклик — через звонок или Instagram.
          </p>
          <div className="jobs-actions">
            <a className="primary-link" href="tel:+79129074747">Позвонить</a>
            <a className="secondary-link" href="https://www.instagram.com/meatbar_nv/" target="_blank" rel="noreferrer">
              Написать в Instagram
            </a>
          </div>
        </div>
        <picture>
          <source
            type="image/avif-disabled"
            srcSet="/assets/jobs-team-sm.avif 960w, /assets/jobs-team.avif 1920w"
            sizes="(max-width: 720px) 100vw, 50vw"
          />
          <img
            src="/assets/jobs-team.webp"
            srcSet="/assets/jobs-team-sm.webp 960w, /assets/jobs-team.webp 1920w"
            sizes="(max-width: 720px) 100vw, 50vw"
            alt="Команда Мясо Бар"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      <section ref={gallerySectionRef} className="gallery-section" id="gallery">
        <div className={`gallery-track ${gallerySectionNear ? 'is-running' : 'is-paused'}`} aria-label="Все блюда из нашего меню">
          {/* Дублируем массив, чтобы CSS-анимация бесшовно
              «прокручивала» дорожку фото меню (Task 9b). */}
          {galleryLoopItems.map((image, index) => (
            isWebp(image.src) ? (
              <picture key={`${image.src}-${index}`}>
                <source srcSet={toAvif(image.src)} type="image/avif-disabled" />
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                />
              </picture>
            ) : (
              <img
                key={`${image.src}-${index}`}
                src={image.src}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                width={800}
                height={600}
              />
            )
          ))}
        </div>
      </section>

      <footer className="site-footer" id="contacts">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/assets/meatbar-logo-mark.webp" alt="Мясо Бар" loading="lazy" decoding="async" />
            <p className="footer-tagline">Гриль-бар «Мясо Бар» — жарим, коптим и собираем вечер в Нижневартовске.</p>
            <div className="footer-socials">
              <a className="footer-social" href="https://www.instagram.com/meatbar_nv/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <img src="/assets/social/instagram.svg" alt="" loading="lazy" decoding="async" />
              </a>
              <a className="footer-social" href="https://vk.com/meatbar_nv" target="_blank" rel="noreferrer" aria-label="ВКонтакте">
                <img src="/assets/social/vk.svg" alt="" loading="lazy" decoding="async" />
              </a>
              <a className="footer-social" href="https://2gis.ru/nizhnevartovsk/firm/70000001086984807" target="_blank" rel="noreferrer" aria-label="2ГИС">
                <img src="/assets/social/2gis.webp" alt="" loading="lazy" decoding="async" />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Где нас найти</span>
            <a className="footer-link" href="https://2gis.ru/nizhnevartovsk/firm/70000001086984807" target="_blank" rel="noreferrer">
              <MapPin size={18} aria-hidden="true" />
              <span>
                ТРЦ ЮграМолл, 3 этаж<br />
                ул. Ленина, 15П, Нижневартовск
              </span>
            </a>
            <a
              className="footer-link"
              href="https://yandex.ru/maps/?text=%D1%83%D0%BB.%20%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0%2015%D0%9F%2C%20%D0%9D%D0%B8%D0%B6%D0%BD%D0%B5%D0%B2%D0%B0%D1%80%D1%82%D0%BE%D0%B2%D1%81%D0%BA"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={18} aria-hidden="true" />
              <span>Построить маршрут в Яндекс Навигаторе</span>
            </a>
            <a
              className="footer-link"
              href="https://www.google.com/maps/search/?api=1&query=%D1%83%D0%BB.%20%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0%2C%2015%D0%9F%2C%20%D0%9D%D0%B8%D0%B6%D0%BD%D0%B5%D0%B2%D0%B0%D1%80%D1%82%D0%BE%D0%B2%D1%81%D0%BA"
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={18} aria-hidden="true" />
              <span>Построить маршрут в Google Maps</span>
            </a>
            <span className="footer-link static">
              <Clock size={18} aria-hidden="true" />
              <span>
                Ежедневно 11:00 — 24:00<br />
                Бизнес-ланч пн–пт 12:00 — 15:00
              </span>
            </span>
            <span className="footer-link static">
              <span aria-hidden="true" className="footer-bullet" />
              <span>Панорамный вид · до 122 мест</span>
            </span>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Связь</span>
            <a className="footer-link" href="tel:+79129074747">
              <Phone size={18} aria-hidden="true" />
              <span>+7 (912) 907-47-47</span>
            </a>
            <a className="footer-link" href="https://www.instagram.com/meatbar_nv/" target="_blank" rel="noreferrer">
              <img className="footer-icon-img" src="/assets/social/instagram.svg" alt="" loading="lazy" decoding="async" />
              <span>Instagram @meatbar_nv</span>
            </a>
            <a className="footer-link" href="https://vk.com/meatbar_nv" target="_blank" rel="noreferrer">
              <img className="footer-icon-img" src="/assets/social/vk.svg" alt="" loading="lazy" decoding="async" />
              <span>ВКонтакте · МЯСО БАР</span>
            </a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Признание</span>
            <a className="footer-award" href="https://awards.2gis.ru/" target="_blank" rel="noreferrer">
              <img className="award-badge" src="/assets/social/2gis-awards-2025.svg" alt="Премия 2ГИС 2025" />
              <span>
                Премия 2ГИС&nbsp;2025<br />
                <em>лучший гриль-бар города</em>
              </span>
            </a>
            <a className="footer-link" href="#booking" onClick={scrollToBooking}>
              <CalendarDays size={18} aria-hidden="true" />
              <span>Забронировать столик</span>
            </a>
            <a className="footer-link" href="#order">
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Самовывоз и доставка</span>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-legal">
            ООО «РЕСТАРТ» · ИНН 8603254440 · ОГРН 1258600009073 · 628616, Нижневартовск, ул. Кузоваткина, д. 17, офис 3.
          </p>
          <p className="footer-copyright">© {new Date().getFullYear()} Мясо Бар. Все права защищены.</p>
        </div>
      </footer>

      <SideNav
        open={navOpen}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onClose={() => setNavOpen(false)}
        onOpenCart={() => setCartOpen(true)}
        onBookingNavigate={(event) => scrollToBooking(event)}
      />
      <Suspense fallback={null}>
        <CartDrawer
          open={cartOpen}
          cart={cart}
          total={cartTotal}
          phone={orderPhone}
          onPhoneChange={setOrderPhone}
          onClose={() => setCartOpen(false)}
          onIncrement={incrementCart}
          onDecrement={decrementCart}
          onRemove={removeFromCart}
          onSubmit={submitOrder}
          state={orderState}
          paymentUrl={paymentUrl}
        />
      </Suspense>
      <PWAInstallPrompt />
      {/* #9 — фоновый эмбиент. Выкл. по умолчанию, состояние
          в localStorage, без настроек в админке. */}
      <AmbientAudio />
    </main>
  )
}

function pickHeroReelSrc(): string {
  if (typeof window === 'undefined') return '/assets/hero-reel-720.mp4'
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
  const veryLow =
    detectPerfTier() === 'low' ||
    conn?.saveData === true ||
    /(?:^|[^4-9])2g/i.test(conn?.effectiveType ?? '')
  // Фразы пользователя: «качество немного упало, можно ли вернуть без лагов».
  // Поднимаем дефолт по ступеньке: телефоны до 480 px → 540 p (раньше 360),
  // 481–768 → 720 p (раньше 540), десктоп → 720 p (как было).
  // Только для save-data / 2G оставляем 360 p — иначе будут реальные лаги.
  if (veryLow) return '/assets/hero-reel-360.mp4'
  if (window.matchMedia('(max-width: 480px)').matches) return '/assets/hero-reel-540.mp4'
  return '/assets/hero-reel-720.mp4'
}

let cachedAvifSupport: boolean | null = null

function supportsAvifImage(): boolean {
  if (typeof document === 'undefined') return false
  if (cachedAvifSupport != null) return cachedAvifSupport
  try {
    const canvas = document.createElement('canvas')
    cachedAvifSupport = canvas.toDataURL('image/avif').startsWith('data:image/avif')
  } catch {
    cachedAvifSupport = false
  }
  return cachedAvifSupport
}

function HeroReel() {
  // Pick the lowest-cost source for the device once, so we don't ship 11 MB
  // of 720p video to a phone that only ever needs ~3 MB at 360p.
  const [src, setSrc] = useState<string>(pickHeroReelSrc)
  const [reduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [videoPreload] = useState<'metadata' | 'none'>(() => {
    if (typeof window === 'undefined') return 'metadata'
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
    const slow = conn?.saveData === true || /(?:^|[^4-9])2g/i.test(conn?.effectiveType ?? '')
    return slow || detectPerfTier() === 'low' ? 'none' : 'metadata'
  })
  const [poster] = useState(() => (supportsAvifImage() ? '/assets/hero-poster.avif' : '/assets/hero-poster.webp'))
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // React to viewport size class changes (orientation, resize) without
  // remounting the <video> via `key=` (which forced a full re-buffer/stutter).
  useEffect(() => {
    const update = () => setSrc((prev) => {
      const next = pickHeroReelSrc()
      return next === prev ? prev : next
    })
    const mqs = ['(max-width: 480px)', '(max-width: 768px)'].map((q) => window.matchMedia(q))
    mqs.forEach((mq) => mq.addEventListener?.('change', update))
    return () => mqs.forEach((mq) => mq.removeEventListener?.('change', update))
  }, [])

  // We intentionally do NOT pause/play the hero video via IntersectionObserver.
  // It can look like "frame-by-frame" playback when the element sits near
  // the viewport edge. Performance is handled by choosing a lower-res source
  // on low-tier devices (see pickHeroReelSrc).

  // When the chosen source changes mid-session (e.g. on resize crossing a
  // breakpoint), swap it without remounting the <video> element. We keep the
  // current playback position so the reel doesn't visibly restart.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const wasPlaying = !video.paused
    const t = video.currentTime
    const sources = video.querySelectorAll('source')
    sources.forEach((s) => s.remove())
    const source = document.createElement('source')
    source.src = src
    source.type = 'video/mp4'
    video.appendChild(source)
    video.load()
    const onLoaded = () => {
      try {
        if (Number.isFinite(t)) video.currentTime = Math.min(t, video.duration || t)
      } catch {
        /* noop */
      }
      if (wasPlaying) void video.play().catch(() => {})
      video.removeEventListener('loadedmetadata', onLoaded)
    }
    video.addEventListener('loadedmetadata', onLoaded)
  }, [src])

  if (reduced) {
    return (
      <picture className="hero-reel hero-reel--still">
        <source srcSet="/assets/hero-poster.avif" type="image/avif" />
        <source srcSet="/assets/hero-poster.webp" type="image/webp" />
        <img src="/assets/hero-poster.webp" alt="" loading="eager" decoding="async" />
      </picture>
    )
  }

  return (
    <video
      ref={videoRef}
      className="hero-reel"
      autoPlay
      muted
      loop
      playsInline
      preload={videoPreload}
      poster={poster}
      disablePictureInPicture
      disableRemotePlayback
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}

function Header({
  cartCount,
  cartTotal,
  onOpenNav,
  onOpenCart,
}: {
  cartCount: number
  cartTotal: number
  onOpenNav: () => void
  onOpenCart: () => void
}) {
  const formatPrice = (value: number) => new Intl.NumberFormat('ru-RU').format(value)
  return (
    <header className="site-header">
      <button type="button" className="header-burger" onClick={onOpenNav} aria-label="Открыть меню">
        <MenuIcon size={20} />
      </button>
      <a className="brand brand-fire" href="#home" aria-label="Мясо Бар — на главную">
        <span className="brand-fire-logo brand-fire-logo--mark" aria-hidden="true">
          {/* Wider, softer flame burning BEHIND the bull mark — silhouette
              stays clearly readable, with a warm halo licking around it. */}
          <AnimatedFire className="brand-fire-flame" width={96} height={96} intensity={0.8} />
          <img src="/assets/meatbar-logo-mark.webp" alt="" width="160" height="94" />
        </span>
      </a>
      <nav className="header-nav-desktop">
        <a href="#our-room">Зал</a>
        <a href="#menu">Меню</a>
        <a href="#bar">Бар</a>
        <a
          href="#booking"
          data-nav="booking"
          onClick={scrollToBooking}
          onPointerEnter={preloadBookingChunks}
          onFocus={preloadBookingChunks}
        >
          Бронь
        </a>
        <a href="#contacts">Контакты</a>
      </nav>
      <div className="header-actions">
        <a className="header-call" href="tel:+79129074747">
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
  )
}

function IntroOverlay() {
  // User explicitly asked for NO fire on the intro overlay — only the
  // header logo carries the campfire flame.
  return (
    <div className="intro-overlay intro-overlay--bright">
      <div className="intro-logo intro-logo--mark">
        <img
          src="/assets/meatbar-logo-mark.webp"
          alt="Мясо Бар — жарим и коптим"
          width="600"
          height="350"
          fetchPriority="high"
        />
      </div>
    </div>
  )
}
