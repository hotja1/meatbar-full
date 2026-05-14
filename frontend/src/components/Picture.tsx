import { memo, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

import './picture.css'

/* Picture.tsx — swipe-стек отзывов 2ГИС.
 *
 * Механика:
 *   - Карточки лежат стопкой друг над другом (как Tinder).
 *   - Верхняя тянется pointer-событиями (mouse + touch + pen).
 *   - При свайпе > 100 px карточка улетает с rotate + translateX
 *     и удаляется из стека насовсем (не возвращается — экономия памяти
 *     и UX-логика «увидел и пошёл дальше»).
 *   - Под верхней — preview двух следующих с уменьшением scale.
 *   - В DOM одновременно максимум 3 карточки. Остальные 47 — нет.
 *
 * Производительность:
 *   - drag через прямой DOM (style.transform), без React-рендеров на 60 fps;
 *   - transition стартует только при pointerup;
 *   - prefers-reduced-motion → fallback в обычный список без swipe;
 *   - содержимое одного компонента, отдельный chunk через React.lazy.
 */

interface Review {
  id: number
  /** Имя автора (отображается снизу карточки). */
  author: string
  /** Дата отзыва человекочитаемая. */
  date: string
  /** Текст отзыва как есть, без кавычек. */
  text: string
  /** Опциональный путь к фото-фону. Если задан — рендерится поверх CSS-пейзажа. */
  image?: string
}

const reviews: ReadonlyArray<Review> = [
  {
    id: 1,
    author: 'Соня Ефименко',
    date: '4 апреля 2026',
    text:
      'Очень прекрасное место. По всему Нижневартовску для меня оно лучшее. ' +
      'Вся еда вкусная а так же очень вкусный кальян. Всем советую',
  },
  {
    id: 2,
    author: 'Наталья А.',
    date: '27 марта 2026',
    text:
      'Очень классное место! Рёбра — просто топ, сочные и очень вкусные. ' +
      'Бургер тоже на уровне, прям зашёл. Официанты быстро реагируют, ' +
      'всё приносят без задержек, приятно. Коктейли вообще огонь, барменам ' +
      'респект. Диляре отдельное спасибо за обслуживание! Ещё вернёмся.',
  },
  {
    id: 3,
    author: 'Сергей Сапичев',
    date: '27 марта 2026',
    text:
      'Кухня великолепная. Быстрое обслуживание. Внимательный персонал. ' +
      'Очень классная, ненавязчивая атмосфера. Креативное меню. Музыка ' +
      'в меру, позволяет разговаривать. Всегда можно добавить и изменить заказ.',
  },
  {
    id: 4,
    author: 'Надежда Сергаева',
    date: '27 марта 2026',
    text:
      'Мне понравилось заведение. Кухня вкусная, обслуживание хорошее. ' +
      'Музыка приятная. Хорошее место для встречи с друзьями.',
  },
  {
    id: 5,
    author: 'Инна Пляскина',
    date: '22 марта 2026',
    text:
      'Очень понравилось данное заведение, приятный персонал, очень вежливые, ' +
      'накормили быстро, вкусно и не дорого. Рекомендую.',
  },
  {
    id: 6,
    author: 'Антон Аксёнов',
    date: '24 февраля 2026',
    text:
      'Уже второй раз тут. Скажу из того, что брали: рёбра и бургер очень вкусные ' +
      'и большие порции, том ям тоже хороший — не сильно острый, что радует. ' +
      'Приятная комфортная обстановка.',
  },
  {
    id: 7,
    author: 'Эмин Магеррамов',
    date: '26 октября 2026',
    text: 'Спасибо большое. Мы у вас не в первый раз и всё очень нравится. Рекомендую.',
  },
  {
    id: 8,
    author: 'Илья Морозович',
    date: '4 апреля 2026',
    text:
      'Всё супер: атмосфера классная, кухня очень хорошая, самое место чтобы ' +
      'отдохнуть семьёй. Обязательно попробуйте рёбрышки — пальчики оближешь.',
  },
  {
    id: 9,
    author: 'Алина Ветер',
    date: '4 апреля 2026',
    text:
      'Достаточно уютное заведение. В меню есть что выбрать, кухня вкусная, ' +
      'подача красивая. Официанты выглядят очень опрятно, вежливы в общении. ' +
      'Лайк заведению, рекомендую к посещению.',
  },
  {
    id: 10,
    author: 'Сергей Цыганец',
    date: '8 марта 2026',
    text:
      'В заведении очень вкусная еда, мне очень понравилось. Обслуживание ' +
      'хорошее, приятные вежливые официанты. Всем советую.',
  },
  {
    id: 11,
    author: 'Анна Лещенкова',
    date: '1 марта 2026',
    text:
      'Спасибо большое за хорошее и внимательное обслуживание. Быстро очень ' +
      'приготовили, чем порадовали, и даже зарядили мой телефон. Диляра — лучший ' +
      'официант. И кальянщик Тимофей тоже внимательный.',
  },
  {
    id: 12,
    author: 'Ирина',
    date: '28 февраля 2026',
    text:
      'Очень вкусная кухня и приятный персонал! Отдельно бы хотелось отметить ' +
      'официанта Диляру за быстрое и качественное обслуживание. Обязательно вернёмся ещё.',
  },
  {
    id: 13,
    author: 'Дмитрий Солнцев',
    date: '27 февраля 2026',
    text:
      'Добрый вечер. Хочу отметить официанта Диляру — эта девушка нас обслужила ' +
      'на пять с плюсом, всё было по высшему разряду. Мы ещё не раз придём в это ' +
      'место. Диляра просто создана для этой работы.',
  },
  {
    id: 14,
    author: 'Мирон',
    date: '1 февраля 2026',
    text:
      'Посетили Мясо Бар. Приятно удивлены ценой и очень вкусной едой, прекрасным ' +
      'обслуживанием. Официант Диляра была приветлива, и нам захотелось ещё не раз ' +
      'посетить данное заведение.',
  },
  {
    id: 15,
    author: 'Екатерина Владимировна',
    date: '6 сентября 2025',
    text:
      'Выражаем благодарность за хорошую работу официанту Александру. Спасибо, ' +
      'прекрасное обслуживание.',
  },
  {
    id: 16,
    author: 'Виктория Владимировна',
    date: '4 сентября 2025',
    text: 'Всё вкусно и оперативно, благодарю официанта Александра за обслуживание.',
  },
  {
    id: 17,
    author: 'Оксана Клыкова',
    date: '3 февраля 2026',
    text: 'Мы в восторге сегодня и всегда. Приятно, вкусно и невероятно комфортно. Класс.',
  },
  {
    id: 18,
    author: 'Ms A',
    date: '18 января 2026',
    text:
      'Всё очень вкусно, хороший выбор блюд и напитков, быстрая подача, хорошее ' +
      'обслуживание. По рекомендации официанта Екатерины попробовали ваши ' +
      'рёбрышки — это просто вау.',
  },
  {
    id: 19,
    author: 'Алексей Волков',
    date: '7 февраля 2025',
    text:
      'Были 7 августа, встретили вежливые и внимательные Дарья и Виолетта — ' +
      'отдельное вам спасибо. Всё очень вкусно. Спасибо, советую всем.',
  },
  {
    id: 20,
    author: 'Елена Сергеевна',
    date: '31 марта 2026',
    text: 'Самые вкусные рёбра в городе.',
  },
  {
    id: 21,
    author: 'Екатерина Григорьева',
    date: '5 декабря 2025',
    text: 'Отличное заведение, приятная официантка Юлия, обслуживание на высшем уровне.',
  },
  {
    id: 22,
    author: 'Николай Обухов',
    date: '20 октября 2025',
    text:
      'Хочу поделиться своим невероятно позитивным впечатлением от посещения ' +
      'Мясо-гриль. Это было просто отлично, и я с уверенностью могу сказать: ' +
      'этот ресторан стал для меня настоящим открытием. С первых минут чувствуется ' +
      'тёплая и уютная атмосфера. Персонал очень внимательный и доброжелательный, ' +
      'что сразу задаёт прекрасный тон всему вечеру. Но самое главное, конечно ' +
      'же, это кухня.',
  },
  {
    id: 23,
    author: 'Лаша Афанасьева',
    date: '11 октября 2025',
    text:
      'Отличное место. Всё было очень вкусно — просто потрясающе. Очень рекомендую ' +
      'попробовать оленину в этом ресторане, мягкая, сочная, картофель в мундире ' +
      'отлично подошёл к мясу. Из ресторана просто выкатилась как колобок. А цены ' +
      'были достаточно приятные. Заходили вечером, так что музыка была просто огонь.',
  },
  {
    id: 24,
    author: 'Алина',
    date: '6 мая 2026',
    text:
      'Впервые побывала в этом заведении. Всё очень красиво и вкусно. Менеджер ' +
      'Анастасия проконсультировала, помогла с выбором.',
  },
  {
    id: 25,
    author: 'Инесса Бауэр',
    date: '3 марта 2026',
    text:
      'Прекрасное место. Хотите атмосферно покушать, пообщаться — Вам сюда. ' +
      'Большой выбор мест. Прекрасное меню. Брали два вида рёбрышек: в медово-еловом ' +
      'соусе и BBQ. Мясо прекрасное. Салаты тоже вкусные. Порции большие. Вместе ' +
      'с пивом чек вышел по две тысячи.',
  },
  {
    id: 26,
    author: 'Альбина Подколзина',
    date: '28 июня 2025',
    text:
      'Официанты просто невероятные, очень любезные и доброжелательные. Настойки ' +
      'самые любимые, еда вкусная. Постоянные клиенты любимого бара.',
  },
  {
    id: 27,
    author: 'Михаил Талмач',
    date: '25 сентября 2025',
    text:
      'Отличное заведение: как провести время вечером, так и для визита на ' +
      'бизнес-ланч. За приемлемую цену — всегда вкусные блюда и быстрая подача. ' +
      'Уютное место с прекрасным обслуживанием.',
  },
  {
    id: 28,
    author: 'Б. Б.',
    date: '20 сентября 2025',
    text:
      'Посетили ресторан и остались очень довольны. Заказывали бургер, стейк ' +
      'и колбаски — всё было приготовлено превосходно, каждое блюдо достойно внимания.',
  },
  {
    id: 29,
    author: 'Екатерина Z',
    date: '20 сентября 2026',
    text:
      'Вкусные стейки, шикарный чай. Спасибо официанту Алексею за прекрасное ' +
      'обслуживание, придём ещё не один раз.',
  },
  {
    id: 30,
    author: 'Наталья Каледжи',
    date: '12 сентября 2025',
    text:
      'Приходили в данный Мясо Бар. Сказать что мы в восторге — это ничего не ' +
      'сказать. Испытала просто вкусовой шок, подача блюд и вкус божественны. ' +
      'Особая благодарность повару. Быстрое обслуживание, официанты внимательны ' +
      'к клиентам, подскажут по любому блюду.',
  },
]

const TWO_GIS_URL = 'https://2gis.ru/nizhnevartovsk/firm/70000001086984807'

const SWIPE_THRESHOLD_PX = 100

/* Звезда 2ГИС: line-icon, brass через currentColor. */
const StarIcon = memo(function StarIcon() {
  return (
    <svg
      className="picture-star"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        d="M12 2.6l2.94 6.43 7.06.78-5.27 4.78 1.49 6.91L12 17.9l-6.22 3.6 1.49-6.91L2 9.81l7.06-.78L12 2.6z"
        fill="currentColor"
      />
    </svg>
  )
})

const Stars = memo(function Stars() {
  return (
    <div className="picture-stars" role="img" aria-label="Оценка 5 из 5 на 2ГИС">
      <StarIcon />
      <StarIcon />
      <StarIcon />
      <StarIcon />
      <StarIcon />
    </div>
  )
})

interface CardProps {
  review: Review
  /** 0 — верхняя (тянется), 1/2 — preview под ней. */
  position: number
  isTop: boolean
  onSwiped: () => void
}

function Card({ review, position, isTop, onSwiped }: CardProps) {
  const cardRef = useRef<HTMLElement | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const lastDx = useRef(0)
  const lastDy = useRef(0)
  const dragging = useRef(false)
  const exiting = useRef(false)

  /* Когда карточка перестаёт быть top (после свайпа предыдущей —
     эта поднимается на её место), сбрасываем inline-transform,
     чтобы CSS-rule по data-pos сделал плавный переход. */
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (isTop) return
    if (exiting.current) return
    el.style.transform = ''
    el.style.opacity = ''
  }, [isTop, position])

  function setTransform(dx: number, dy: number) {
    const el = cardRef.current
    if (!el) return
    const rotate = dx / 20
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rotate}deg)`
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (!isTop || exiting.current) return
    dragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    lastDx.current = 0
    lastDy.current = 0
    const el = cardRef.current
    if (!el) return
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* setPointerCapture может не сработать на старых браузерах — не фатально. */
    }
    el.style.transition = 'none'
    el.classList.add('is-dragging')
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging.current) return
    lastDx.current = e.clientX - startX.current
    lastDy.current = e.clientY - startY.current
    setTransform(lastDx.current, lastDy.current)
  }

  function endDrag(e: ReactPointerEvent) {
    if (!dragging.current) return
    dragging.current = false
    const el = cardRef.current
    if (!el) return
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    el.classList.remove('is-dragging')

    const dx = lastDx.current
    const dy = lastDy.current

    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      /* Exit-анимация: улетает в сторону свайпа, потом удаляется. */
      exiting.current = true
      const dir = dx > 0 ? 1 : -1
      el.style.transition =
        'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 360ms ease'
      el.style.transform = `translate3d(${dir * 720}px, ${dy + dir * 60}px, 0) rotate(${dir * 28}deg)`
      el.style.opacity = '0'
      const finish = () => {
        el.removeEventListener('transitionend', finish)
        onSwiped()
      }
      el.addEventListener('transitionend', finish, { once: true })
    } else {
      /* Snap back. */
      el.style.transition = 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = ''
    }
  }

  return (
    <article
      ref={(node) => {
        cardRef.current = node
      }}
      className="picture-card"
      data-pos={position}
      data-top={isTop ? 'true' : 'false'}
      style={{ '--scene': (review.id * 3 + review.author.length) % 8 } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="picture-card__photo" aria-hidden="true">
        {review.image ? (
          <img src={review.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <>
            <span className="picture-card__sun" />
            <span className="picture-card__mountain picture-card__mountain--back" />
            <span className="picture-card__mountain picture-card__mountain--front" />
            <span className="picture-card__mist" />
          </>
        )}
        <span className="picture-card__veil" />
      </div>

      <div className="picture-card__text">
        <p>{review.text}</p>
        <Stars />
      </div>

      <footer className="picture-card__foot">
        <span className="picture-card__name">{review.author}</span>
        <time className="picture-card__date">{review.date}</time>
      </footer>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="picture-empty" role="status">
      <span className="picture-empty__eyebrow">Все отзывы прочитаны</span>
      <p className="picture-empty__text">
        Спасибо, что дочитали до конца. Мы ждём Вас на ужин.
      </p>
      <a
        className="picture-empty__cta"
        href={TWO_GIS_URL}
        target="_blank"
        rel="noreferrer"
      >
        <span>Больше отзывов на 2ГИС</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          className="picture-empty__cta-arrow"
        >
          <path
            d="M7 17L17 7M17 7H8M17 7V16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  )
}

/* Простой статический список — fallback для prefers-reduced-motion. */
function StaticList() {
  return (
    <div className="picture picture--list" role="region" aria-label="Отзывы гостей">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="picture-card picture-card--static"
          style={{ '--scene': (review.id * 3 + review.author.length) % 8 } as React.CSSProperties}
        >
          <div className="picture-card__photo" aria-hidden="true">
            <span className="picture-card__sun" />
            <span className="picture-card__mountain picture-card__mountain--back" />
            <span className="picture-card__mountain picture-card__mountain--front" />
            <span className="picture-card__mist" />
            <span className="picture-card__veil" />
          </div>
          <div className="picture-card__text">
            <p>{review.text}</p>
            <Stars />
          </div>
          <footer className="picture-card__foot">
            <span className="picture-card__name">{review.author}</span>
            <time className="picture-card__date">{review.date}</time>
          </footer>
        </article>
      ))}
    </div>
  )
}

function Picture() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  /* Определяем prefers-reduced-motion на маунте. SSR-safe. */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (reduceMotion) {
    return <StaticList />
  }

  /* В DOM одновременно максимум 3 карточки. */
  const visible = reviews.slice(activeIndex, activeIndex + 3)
  const totalCount = reviews.length
  const remainingCount = totalCount - activeIndex

  return (
    <div className="picture picture--stack" role="region" aria-label="Отзывы гостей">
      <div className="picture-stack">
        {remainingCount === 0 ? (
          <EmptyState />
        ) : (
          visible.map((review, i) => (
            <Card
              key={review.id}
              review={review}
              position={i}
              isTop={i === 0}
              onSwiped={() => setActiveIndex((prev) => prev + 1)}
            />
          ))
        )}
      </div>

      {remainingCount > 0 && (
        <p className="picture-counter" aria-live="polite">
          <span className="picture-counter__current">
            {Math.min(activeIndex + 1, totalCount)}
          </span>
          <span className="picture-counter__sep">/</span>
          <span className="picture-counter__total">{totalCount}</span>
          <span className="picture-counter__hint">свайп вправо или влево</span>
        </p>
      )}
    </div>
  )
}

export default Picture
