import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { barMenu as fallbackBarMenu, type BarCategory, type BarItem } from '../data/bar'
import { FireText } from './FireText'
import './bar-menu.css'
import { detectPerfTier } from '../lib/perfTier'
import { isWebp, toAvif, toSmAvif, toSmWebp } from '../lib/imageSources'

type BarMenuSectionProps = {
  categories?: BarCategory[]
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

const BADGE_LABEL: Record<NonNullable<BarItem['badge']>, string> = {
  hit: 'хит',
  new: 'новинка',
  chef: 'выбор бар-шефа',
}

function ItemCard({ item }: { item: BarItem }) {
  const cardRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingTiltRef = useRef<{ bx: number; by: number; hover: number } | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const priceList = useMemo<{ volume: string; price: number }[]>(() => {
    if (item.prices && item.prices.length) return item.prices
    if (item.price !== undefined) {
      return [{ volume: item.volume ?? '', price: item.price }]
    }
    return []
  }, [item])

  const tiltEnabled = useMemo(() => {
    const perf = typeof window !== 'undefined' ? detectPerfTier() : 'high'
    const mobile =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(max-width: 768px)').matches
        : false
    const reduced =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    return perf !== 'low' && !mobile && !reduced
  }, [])

  /* Cursor-tracked tilt (Task fix-3) — на pointer-move внутри карточки
     обновляем CSS-переменные --bx, --by, --hover. На leave/cancel
     откатываем к нулю. respects prefers-reduced-motion (CSS отключает
     transform). */
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
      className={`bar-card ${item.available === false ? 'is-out' : ''} parallax-photo`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
    >
      {item.image ? (
        <div className="bar-card-photo">
          {isWebp(item.image) ? (
            <picture>
              <source
                type="image/avif-disabled"
                srcSet={`${toSmAvif(item.image)} 480w, ${toAvif(item.image)} 800w`}
                sizes="(max-width: 768px) 92vw, 360px"
              />
              <img
                src={item.image}
                srcSet={`${toSmWebp(item.image)} 480w, ${item.image} 800w`}
                sizes="(max-width: 768px) 92vw, 360px"
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
              sizes="(max-width: 768px) 92vw, 360px"
              alt=""
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
            />
          )}
          {item.badge ? (
            <span className={`bar-card-badge bar-card-badge--${item.badge}`}>
              {BADGE_LABEL[item.badge]}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="bar-card-body">
        {item.tags && item.tags.length ? (
          <div className="bar-card-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="bar-card-tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <h3 className="bar-card-title">{item.title}</h3>
        {item.description ? <p className="bar-card-desc">{item.description}</p> : null}
        <footer className="bar-card-footer">
          {priceList.length === 1 ? (
            <div className="bar-card-price-line">
              <span className="bar-card-volume">{priceList[0].volume}</span>
              <span className="bar-card-leader" aria-hidden="true" />
              <strong className="bar-card-price">{formatPrice(priceList[0].price)} ₽</strong>
            </div>
          ) : priceList.length > 1 ? (
            <ul className="bar-card-prices">
              {priceList.map((p) => (
                <li key={p.volume}>
                  <span className="bar-card-volume">{p.volume}</span>
                  <span className="bar-card-leader" aria-hidden="true" />
                  <strong className="bar-card-price">{formatPrice(p.price)} ₽</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </footer>
      </div>
    </article>
  )
}

/**
 * Бар-меню — отдельный раздел, не входит в доставку (Task 7).
 *
 * Бар-карта — это много категорий (10) и подкатегорий («На кране» /
 * «Бутылочное» / «Безалкогольное» внутри Пива). Поэтому раздел
 * сделан табами по основным категориям, а внутри каждой панели —
 * группировка по `item.group` (если задана).
 */
export function BarMenuSection({ categories }: BarMenuSectionProps) {
  const source = categories?.length ? categories : fallbackBarMenu
  const [activeSlug, setActiveSlug] = useState<string>(source[0]?.slug ?? 'sets')
  const active = source.find((c) => c.slug === activeSlug) ?? source[0]

  /* Группировка позиций активной категории по `item.group`,
     с сохранением порядка определения. */
  const grouped = useMemo(() => {
    if (!active) return [] as { name: string | null; items: BarItem[] }[]
    const map = new Map<string | null, BarItem[]>()
    for (const it of active.items) {
      const key = it.group ?? null
      const list = map.get(key) ?? []
      list.push(it)
      map.set(key, list)
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
  }, [active])

  if (!active) return null

  return (
    <section
      className="bar-section section-with-bg"
      data-bg="3"
      id="bar"
      aria-labelledby="bar-section-title"
    >
      <div className="section-bg" aria-hidden="true" />
      <div className="bar-section-inner">
        <div className="section-intro row">
          <div>
            <span className="chapter">Мясо Бар</span>
            <FireText as="h2" intensity="strong" stagger={26} ariaLabel="Бар-меню">
              Бар-меню — авторские коктейли, вина и крепкое.
            </FireText>
            <p id="bar-section-title" className="visually-hidden">
              Бар-меню
            </p>
          </div>
          <p className="subtitle-reveal subtitle-reveal--right">
            Барная карта работает только в зале — кофейные ритуалы, авторские коктейли с
            дымом, выдержанное крепкое и северные лимонады. В доставку бар-меню не
            отправляем — каждый напиток подаём за стойкой.
          </p>
        </div>

        <div className="bar-tabs" role="tablist" aria-label="Категории бара">
          {source.map((cat) => {
            const isActive = cat.slug === activeSlug
            return (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`bar-panel-${cat.slug}`}
                id={`bar-tab-${cat.slug}`}
                className={`bar-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveSlug(cat.slug)}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        <div
          className="bar-panel"
          role="tabpanel"
          id={`bar-panel-${active.slug}`}
          aria-labelledby={`bar-tab-${active.slug}`}
        >
          {active.caption ? <p className="bar-caption">{active.caption}</p> : null}
          {grouped.map((g) => (
            <div className="bar-subgroup" key={g.name ?? '_'}>
              {g.name ? <h3 className="bar-subgroup-title">{g.name}</h3> : null}
              <div className="bar-grid">
                {g.items.map((item) => (
                  <ItemCard key={`${item.title}-${item.volume ?? ''}`} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="bar-footnote">
          Спрашивайте у бармена сезонные позиции — они меняются вместе с настроением вечера.
          Заказ возможен только в зале (18+, по паспорту).
        </p>
      </div>
    </section>
  )
}
