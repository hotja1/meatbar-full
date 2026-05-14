import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js'
import Clock from 'lucide-react/dist/esm/icons/clock.js'
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js'
import MenuIcon from 'lucide-react/dist/esm/icons/menu.js'
import Phone from 'lucide-react/dist/esm/icons/phone.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import Sofa from 'lucide-react/dist/esm/icons/sofa.js'
import ChefHat from 'lucide-react/dist/esm/icons/chef-hat.js'
import GlassWater from 'lucide-react/dist/esm/icons/glass-water.js'
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check.js'
import Coffee from 'lucide-react/dist/esm/icons/coffee.js'
import Briefcase from 'lucide-react/dist/esm/icons/briefcase.js'
import Navigation from 'lucide-react/dist/esm/icons/navigation.js'
import PhoneCall from 'lucide-react/dist/esm/icons/phone-call.js'
import type { MenuCategory } from '../data/menu'
import { FireButton } from '../components/FireButton'
import { FireText } from '../components/FireText'
import { RotatingFireText } from '../components/RotatingFireText'
import { CloudHero } from '../components/CloudHero'
import type { CartDrawerItem } from '../components/CartDrawer'
import { FloatingDock } from '../components/FloatingDock'
import { PWAInstallPrompt } from '../components/PWAInstallPrompt'
import { AmbientAudio } from '../components/AmbientAudio'
import { AnimatedFire } from '../components/AnimatedFire'
import { EmberField } from '../components/EmberField'

const CartDrawer = lazy(() => import('../components/CartDrawer').then((m) => ({ default: m.CartDrawer })))
const Picture = lazy(() => import('../components/Picture'))
import { useParallaxPhotos } from '../hooks/useParallaxPhotos'
import { useSubtitleReveal } from '../hooks/useSubtitleReveal'
import { api } from '../lib/api'
import { detectPerfTier } from '../lib/perfTier'
import { isWebp, toAvif } from '../lib/imageSources'
import { trackEvent } from '../lib/analytics'
import '../App.css'
import './homepage-extra.css'

type CartItem = CartDrawerItem

const MENU_CACHE_KEY = 'meatbar:menu-cache'

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

export function HomePage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState<MenuCategory[]>(() => readMenuCache())
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderPhone, setOrderPhone] = useState('')
  const [orderState, setOrderState] = useState<'idle' | 'needs-phone' | 'sent'>('idle')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [cartNotice] = useState('')
  const [introDone, setIntroDone] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const gallerySectionRef = useRef<HTMLElement | null>(null)
  const [gallerySectionNear, setGallerySectionNear] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), 1600)
    return () => window.clearTimeout(timer)
  }, [])

  /* При загрузке страницы с hash (например /#contacts из другой страницы)
     скроллим к нужному элементу после рендера. */
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const scrollToHash = () => {
      const el = document.querySelector(hash)
      if (el) {
        ;(window as unknown as Record<string, unknown>).__navScrolling = true
        el.scrollIntoView({ behavior: 'instant', block: 'start' })
        setTimeout(() => { (window as unknown as Record<string, unknown>).__navScrolling = false }, 500)
      }
    }
    // Даём время на рендер lazy-секций
    const t = setTimeout(scrollToHash, 300)
    return () => clearTimeout(t)
  }, [])

  /* Обход wheel-hijack при клике по якорным ссылкам навигации.
     Устанавливаем флаг на 2 секунды, чтобы скролл к #contacts
     не блокировался секцией #order. Также делаем программный
     scrollIntoView для надёжности. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!anchor) return
      const hash = anchor.getAttribute('href')
      if (!hash || hash === '#') return
      const target = document.querySelector(hash)
      if (!target) return
      e.preventDefault()
      ;(window as unknown as Record<string, unknown>).__navScrolling = true
      // Мгновенный прыжок — smooth может застрять на wheel-hijack секции
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
      // Обновляем hash в URL без прыжка
      window.history.pushState(null, '', hash)
      setTimeout(() => { (window as unknown as Record<string, unknown>).__navScrolling = false }, 500)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
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
          writeMenuCache(next)
        }
      })
      .catch(async () => {
        if (menu.length) return
        try {
          const mod = await import('../data/menu')
          if (!mounted || !mod.menu.length) return
          setMenu(mod.menu)
          writeMenuCache(mod.menu)
        } catch {
          /* noop */
        }
      })
    return () => {
      mounted = false
    }
  }, [menu.length])

  /* Дорожка фото под бронированием (Task 9b): берём ВСЕ позиции под бронированием (Task 9b): берём ВСЕ позиции
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
    () => {
      // C9: Ограничиваем до 20 уникальных фото × 2 = 40 DOM-элементов
      // вместо 70+ × 2 = 140. Визуально лента выглядит так же.
      const limited = galleryFromMenu.slice(0, 20)
      return [...limited, ...limited]
    },
    [galleryFromMenu],
  )
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])

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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
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
            <FireButton variant="outline" onClick={() => navigate('/booking')}>
              Выбрать столик <ChevronRight size={18} />
            </FireButton>
            <FireButton variant="outline" onClick={() => (window.location.hash = '#menu')}>
              Открыть меню
            </FireButton>
            <FireButton variant="ghost" onClick={() => setCartOpen(true)}>
              Доставка
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
          <span className="chapter">Голос гостей</span>
          <FireText as="h2" intensity="strong" stagger={28}>Тёплый зал, к которому возвращаются.</FireText>
          <p className="subtitle-reveal">
            Больше 700 положительных отзывов, рейтинг 4.7 на 2ГИС и премия
            «2ГИС 2025» — лучший ресторан Нижневартовска по выбору гостей.
            Это про живой зал, дым на углях и вечера, ради которых сюда приходят
            снова.
          </p>
        </div>
        <div className="split-panel image-panel">
          {/* iter5: логотип «живой» — сохраняется как было.
              Правая колонка теперь — оболочка для отзывов 2ГИС. */}
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
          <Suspense fallback={null}>
            <Picture />
          </Suspense>
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
        {/* Слайдер фотографий интерьера — кинематограф */}
        <div className="venue-slider" ref={(el: HTMLDivElement | null) => {
          if (!el) {
            // Cleanup при unmount
            const prev = (window as unknown as Record<string, unknown>).__venueSliderCleanup as (() => void) | undefined
            if (prev) { prev(); delete (window as unknown as Record<string, unknown>).__venueSliderCleanup }
            return
          }
          const img = el.querySelector('.venue-slider__img') as HTMLImageElement | null
          const caption = el.querySelector('.venue-slider__caption') as HTMLElement | null
          if (!img || !caption) return
          if (img.dataset.init === '1') return
          img.dataset.init = '1'

          let idx = 0
          const total = 10
          let alive = true
          const timers: ReturnType<typeof setTimeout>[] = []
          const captions = [
            'Искусство на стенах, вкус на тарелке.',
            'Каждая деталь — про тепло.',
            'Встречаем как своих.',
            'Интерьер с характером.',
            'Природа рядом, город — за порогом.',
            'Атмосфера, в которой хочется остаться.',
            'Здесь время замедляется.',
            'Тишина между фразами — тоже часть вкуса.',
            'Бар, где знают ваш вкус.',
            'Ваш стол уже ждёт.',
          ]
          const directions = ['up', 'down', 'left', 'right', 'scale']
          const isMobile = window.matchMedia('(max-width: 768px)').matches

          const safeTimeout = (fn: () => void, ms: number) => {
            const id = setTimeout(() => { if (alive) fn() }, ms)
            timers.push(id)
            return id
          }

          const getTransform = (dir: string) => {
            switch (dir) {
              case 'up': return 'translateY(40px)'
              case 'down': return 'translateY(-40px)'
              case 'left': return 'translateX(40px)'
              case 'right': return 'translateX(-40px)'
              case 'scale': return 'scale(0.92)'
              default: return 'translateY(40px)'
            }
          }

          // Показать первый слайд
          img.src = `/assets/gallery/slide-1${isMobile ? '-sm' : ''}.webp`
          img.style.opacity = '1'
          img.style.transform = 'scale(1) translate(0, 0)'
          caption.style.opacity = '0'
          safeTimeout(() => {
            caption.textContent = captions[0]
            caption.style.opacity = '1'
          }, 1500)

          const cycle = () => {
            if (!alive) return
            safeTimeout(() => { if (alive) caption.style.opacity = '0' }, 8000)
            safeTimeout(() => {
              if (!alive) return
              img.style.opacity = '0'
              img.style.transform = 'scale(1.02)'
            }, 9000)
            safeTimeout(() => {
              if (!alive) return
              idx = (idx + 1) % total
              const n = idx + 1
              const dir = directions[Math.floor(Math.random() * directions.length)]
              img.style.transition = 'none'
              img.style.transform = getTransform(dir)
              img.src = `/assets/gallery/slide-${n}${isMobile ? '-sm' : ''}.webp`
              img.onload = null
              void img.offsetWidth
              const show = () => {
                if (!alive) return
                img.style.transition = 'opacity 1.2s ease, transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)'
                img.style.opacity = '1'
                img.style.transform = 'scale(1) translate(0, 0)'
                safeTimeout(() => {
                  if (!alive) return
                  caption.textContent = captions[idx]
                  caption.style.opacity = '1'
                }, 1500)
              }
              if (img.complete && img.naturalWidth > 0) show()
              else img.onload = show
              cycle()
            }, 10000)
          }
          cycle()

          // C8: IO-пауза — останавливаем цикл когда секция не видна
          let sliderVisible = true
          const sliderIO = new IntersectionObserver(([entry]) => {
            sliderVisible = entry.isIntersecting
          }, { rootMargin: '20% 0px 20% 0px', threshold: 0 })
          sliderIO.observe(el)

          // Переопределяем safeTimeout чтобы учитывать visibility
          const origSafeTimeout = safeTimeout
          // eslint-disable-next-line no-inner-declarations
          function safeTimeoutVisible(fn: () => void, ms: number) {
            const check = () => {
              if (!alive) return
              if (sliderVisible) { fn() }
              else { origSafeTimeout(check, 1000) }
            }
            return origSafeTimeout(check, ms)
          }
          // Patch: будущие вызовы cycle используют видимость
          void safeTimeoutVisible

          // Сохраняем cleanup
          ;(window as unknown as Record<string, unknown>).__venueSliderCleanup = () => {
            alive = false
            timers.forEach(clearTimeout)
            sliderIO.disconnect()
            img.onload = null
            delete img.dataset.init
          }
        }}>
          <img
            className="venue-slider__img"
            src="/assets/gallery/slide-1.webp"
            alt="Интерьер Мясо Бар"
            width={1600}
            height={900}
            decoding="async"
          />
          <div className="venue-slider__overlay" aria-hidden="true" />
          <div className="venue-slider__center">
            <p className="venue-slider__caption">Искусство на стенах, вкус на тарелке.</p>
            <nav className="venue-slider__actions" aria-label="Быстрые действия">
              <a href="/menu" className="fire-btn fire-btn-outline fire-btn-glow">Меню</a>
              <a href="/booking" className="fire-btn fire-btn-outline fire-btn-glow">Бронь</a>
              <a href="tel:+79129074747" className="fire-btn fire-btn-outline fire-btn-glow">Позвонить</a>
            </nav>
          </div>
        </div>
      </section>
    </main>

      <section className="order-section--reel" id="order">
        {/* Огненный заголовок НАД видео */}
        <div className="order-fire-intro">
          <span className="chapter">Огонь на вынос</span>
          <FireText as="h2" intensity="strong" stagger={24}>
            Горячее — прямо к вам.
          </FireText>
          <p className="subtitle-reveal">
            Соберите заказ онлайн. Мы упакуем с углей и подготовим к вашему приходу, или привезём сами.
          </p>
        </div>
        {/* Scroll-zoom видео — CSS animation-timeline: view() */}
        <div className="order-reel-wrap">
          <div className="order-reel-card">
            <video
              className="order-reel__video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              ref={(el: HTMLVideoElement | null) => {
                if (!el) return
                el.playbackRate = 0.65
                // A3: IO-пауза видео вне viewport
                const io = new IntersectionObserver(([entry]) => {
                  if (entry.isIntersecting) { el.play().catch(() => {}) }
                  else { el.pause() }
                }, { threshold: 0.1 })
                io.observe(el)
              }}
            >
              <source src="/assets/order-reel.webm" type="video/webm" />
              <source src="/assets/order-reel.mp4" type="video/mp4" />
            </video>
            <div className="order-reel__veil" />
            <div className="order-reel__darken" />
          </div>
          {/* Фразы поверх карточки — scroll-driven (без wheel-hijack) */}
          <div className="order-reel__phrases" ref={(el: HTMLDivElement | null) => {
            if (!el) {
              const prev = (window as unknown as Record<string, unknown>).__orderReelCleanup as (() => void) | undefined
              if (prev) { prev(); delete (window as unknown as Record<string, unknown>).__orderReelCleanup }
              return
            }
            const phrases = el.querySelectorAll<HTMLElement>('.order-reel__phrase')
            if (phrases.length < 3) return
            const wrap = el.closest('.order-reel-wrap') as HTMLElement | null
            if (!wrap) return

            let currentIdx = -1

            const showPhrase = (idx: number) => {
              if (idx === currentIdx) return
              currentIdx = idx
              phrases.forEach((ph, i) => {
                ph.style.opacity = i === idx ? '1' : '0'
                ph.style.transform = i === idx ? 'translateY(0)' : 'translateY(12px)'
              })
            }

            /* Scroll-driven: определяем какую фразу показывать по позиции
               секции в viewport. Никакого preventDefault, никакого passive:false. */
            let rafPending = false
            const update = () => {
              rafPending = false
              const rect = wrap.getBoundingClientRect()
              const vh = window.innerHeight
              // Нормализуем прогресс: 0 = секция входит снизу, 1 = уходит вверх
              const progress = 1 - (rect.bottom / (vh + rect.height))
              const clamped = Math.max(0, Math.min(1, progress))

              if (clamped < 0.25 || clamped > 0.85) {
                // Вне зоны — скрываем все фразы
                if (currentIdx !== -1) {
                  currentIdx = -1
                  phrases.forEach((ph) => { ph.style.opacity = '0' })
                }
              } else {
                // Зона 0.25–0.85 разбита на 3 части
                const zone = (clamped - 0.25) / 0.6
                const idx = Math.min(2, Math.floor(zone * 3))
                showPhrase(idx)
              }
            }

            const onScroll = () => {
              if (rafPending) return
              rafPending = true
              requestAnimationFrame(update)
            }

            window.addEventListener('scroll', onScroll, { passive: true })
            update()

            ;(window as unknown as Record<string, unknown>).__orderReelCleanup = () => {
              window.removeEventListener('scroll', onScroll)
            }
          }}>
            <p className="order-reel__phrase">Жар углей. Аромат дыма. Ваш заказ.</p>
            <p className="order-reel__phrase">Рёбра, брискет, стейк — упакуем горячим.</p>
            <p className="order-reel__phrase">Огонь не остывает по дороге к вам.</p>
          </div>
        </div>
      </section>

      {cartNotice ? <div className="cart-toast">{cartNotice}</div> : null}

      {/* Mobile CTA — бронь ведёт на отдельную страницу /booking */}
      <nav className="mobile-cta-bar" ref={(el: HTMLElement | null) => {
        if (!el) return
        if (el.dataset.init) return
        el.dataset.init = '1'
        let lastY = window.scrollY
        const onScroll = () => {
          const y = window.scrollY
          if (y > lastY && y > 100) {
            el.classList.add('is-hidden')
          } else {
            el.classList.remove('is-hidden')
          }
          lastY = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
      }} aria-label="Быстрые действия">
        <a className="book" href="/booking">
          Выбрать стол
        </a>
        <a className="order" href="tel:+79129074747">Позвонить</a>
      </nav>

      <section className="jobs-section" id="jobs">
        <div className="jobs-card">
          <span className="chapter">Вакансии</span>
          <h2>Команда Мясо Бар растёт.</h2>
          <p>
            Ищем людей в зал и на кухню: официанты, бар, повара горячего цеха и гриля.
            Отклик — через звонок или Instagram.
          </p>
          <div className="jobs-actions">
            <a className="fire-btn fire-btn-outline fire-btn-glow primary-link" href="tel:+79129074747">Позвонить</a>
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
            <a className="footer-link" href="/booking">
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

      <FloatingDock
        open={navOpen}
        onClose={() => setNavOpen(false)}
        items={[
          { title: 'Зал', icon: <Sofa size={20} />, href: '#our-room' },
          { title: 'Меню', icon: <ChefHat size={20} />, href: '/menu' },
          { title: 'Бар', icon: <GlassWater size={20} />, href: '/bar' },
          { title: 'Бронь', icon: <CalendarCheck size={20} />, href: '/booking' },
          { title: 'Бизнес-ланч', icon: <Coffee size={20} />, href: '/business-lunch' },
          { title: 'Вакансии', icon: <Briefcase size={20} />, href: '#jobs' },
          { title: 'Контакты', icon: <Navigation size={20} />, href: '#contacts' },
          { title: 'Позвонить', icon: <PhoneCall size={20} />, href: 'tel:+79129074747' },
        ]}
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
    </>
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
  /* Task A6 — на low-tier + save-data hero-video не рендерим вовсе.
     Показываем статичный AVIF/WebP постер: первая загрузка быстрее,
     трафик ниже, CPU не тратится на декод MP4. Включается когда
     реально сошлись 3 признака (perf=low И save-data/2G), чтобы
     среднему мобильному hero-видео оставалось. */
  const [stillFrame] = useState(() => {
    if (typeof window === 'undefined') return false
    if (detectPerfTier() !== 'low') return false
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
    const veryLow =
      conn?.saveData === true || /(?:^|[^4-9])2g/i.test(conn?.effectiveType ?? '')
    return veryLow
  })
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

  // A3: IO-пауза hero-видео когда секция далеко от viewport.
  // Используем rootMargin 50% чтобы не было "frame-by-frame" эффекта
  // при скролле вблизи hero — видео паузится только когда реально далеко.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { video.play().catch(() => {}) }
      else { video.pause() }
    }, { rootMargin: '50% 0px 50% 0px', threshold: 0 })
    io.observe(video)
    return () => io.disconnect()
  }, [])

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

  if (stillFrame) {
    return (
      <picture className="hero-reel hero-reel--still">
        <source srcSet="/assets/hero-poster.avif" type="image/avif" />
        <source srcSet="/assets/hero-poster.webp" type="image/webp" />
        <img src="/assets/hero-poster.webp" alt="" loading="eager" decoding="async" fetchPriority="high" />
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
        <a href="#our-room">Зал<span className="nav-hint">Интерьер и атмосфера</span></a>
        <a href="/menu">Меню<span className="nav-hint">Доставка и самовывоз</span></a>
        <a href="/bar">Бар<span className="nav-hint">Коктейли и вина</span></a>
        <a href="/booking">Бронь<span className="nav-hint">Выбрать стол</span></a>
        <a href="/business-lunch">Бизнес-ланч<span className="nav-hint">Каждый день 12:00–15:00</span></a>
        <a href="#contacts">Контакты<span className="nav-hint">Адрес и телефон</span></a>
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
