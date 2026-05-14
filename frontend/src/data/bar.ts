/* Бар-меню Мясо Бар (Task 7).
 *
 * Источник истины — реальная барная карта от заведения (фото
 * предоставлено пользователем). Структура повторяет MenuCategory из
 * ../data/menu, чтобы можно было пере-использовать существующие
 * компоненты карточек. Бар-меню НЕ участвует в доставке.
 *
 * Поле prices позволяет хранить разные объёмы (40/750 мл и т.д.) на
 * одной позиции — компонент BarMenuSection сам форматирует список
 * цен. group — опциональная под-категория внутри основной категории
 * (например, «На кране» / «Бутылочное» внутри Пива).
 */

export type BarPrice = {
  volume: string
  price: number
}

export type BarItem = {
  title: string
  /** Базовая цена/объём, если позиция продаётся в одном виде. */
  volume?: string
  price?: number
  /** Несколько вариантов объёма (50 мл / 500 мл). */
  prices?: BarPrice[]
  description?: string
  image?: string
  /** Стоп-лист — позиция приглушена. */
  available?: boolean
  /** Шорт-теги (страна, классификация). */
  tags?: string[]
  /** Особые отметки. */
  badge?: 'hit' | 'new' | 'chef'
  /** Сабгруппа внутри категории — рисуется отдельным заголовком. */
  group?: string
}

export type BarCategory = {
  /* Slug используется в id и якорях (#bar-cocktails). */
  slug: string
  name: string
  /* Подзаголовок — отображается под названием категории. */
  caption?: string
  items: BarItem[]
}

const meatSetImage = '/assets/menu/Rebra-BBQ.webp'
const wingsImage = '/assets/menu/Krylya-BBQ.webp'

export const barMenu: BarCategory[] = [
  {
    slug: 'sets',
    name: 'На компанию',
    caption: 'Большие сеты под пиво и компанию — забирайте на стол',
    items: [
      {
        title: 'Пивной сет №1',
        volume: '1250 г',
        price: 1986,
        description:
          'Луковые кольца, картофель фри, колбаски на огне из говядины, крылья куриные, рёбра свиные, пивные палочки, гренки чесночные, колбаски из курицы.',
        image: meatSetImage,
        tags: ['BBQ', 'Сет'],
        badge: 'hit',
      },
      {
        title: 'Пивной сет №2',
        volume: '1000 г',
        price: 1856,
        description:
          'Гренки чесночные, картофель фри, мидии с сыром чеддер, креветки, кольца кальмара.',
        image: '/assets/menu/Midii-v-slivochnom-souse.webp',
        tags: ['Море', 'Сет'],
      },
      {
        title: 'Ассорти колбасок',
        volume: '1000 г',
        price: 2156,
        description:
          'Говядина, курица, микс свинина-говядина, тушёная капуста.',
        image: meatSetImage,
        tags: ['Колбаски'],
      },
      {
        title: 'Ассорти BBQ',
        volume: '1800 г',
        price: 4356,
        description:
          'Свиные рёбра, курица, колбаски, тушёная капуста, рулька, крылья BBQ.',
        image: wingsImage,
        tags: ['BBQ', 'Большой сет'],
        badge: 'chef',
      },
    ],
  },

  {
    slug: 'beer',
    name: 'Пиво',
    caption: 'На кране, бутылочное и безалкогольное',
    items: [
      // На кране (300 / 500 мл)
      { group: 'На кране', title: 'Эстрелла Дамм', tags: ['4,6%'], prices: [{ volume: '300 мл', price: 416 }, { volume: '500 мл', price: 686 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'На кране', title: 'Пабс Блю Риббон', tags: ['4,7%'], prices: [{ volume: '300 мл', price: 336 }, { volume: '500 мл', price: 556 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'На кране', title: 'Шлиц Вайцен нефильтр.', tags: ['4,7%'], prices: [{ volume: '300 мл', price: 336 }, { volume: '500 мл', price: 556 }], image: '/assets/bar/beer-craft.webp' },
      { group: 'На кране', title: 'Фирменное пиво светлое', tags: ['4,6%', 'Хит'], prices: [{ volume: '300 мл', price: 206 }, { volume: '500 мл', price: 356 }], image: '/assets/bar/beer-lager.webp', badge: 'hit' },
      { group: 'На кране', title: 'Фирменное пиво тёмное', tags: ['4,6%', 'Хит'], prices: [{ volume: '300 мл', price: 206 }, { volume: '500 мл', price: 356 }], image: '/assets/bar/beer-stout.webp', badge: 'hit' },
      { group: 'На кране', title: 'Фляйсбах Хеллес', tags: ['5%'], prices: [{ volume: '300 мл', price: 296 }, { volume: '500 мл', price: 486 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'На кране', title: 'Фляйсбах Бланш', tags: ['5%'], prices: [{ volume: '300 мл', price: 296 }, { volume: '500 мл', price: 486 }], image: '/assets/bar/beer-craft.webp' },
      { group: 'На кране', title: 'Азотное Фляйсбах Стаут', tags: ['4,7%', 'Стаут'], prices: [{ volume: '300 мл', price: 296 }, { volume: '500 мл', price: 486 }], image: '/assets/bar/beer-stout.webp' },
      { group: 'На кране', title: 'Фляйсбах Вайсбир', tags: ['4,7%'], prices: [{ volume: '300 мл', price: 296 }, { volume: '500 мл', price: 486 }], image: '/assets/bar/beer-craft.webp' },
      // Бутылочное
      { group: 'Бутылочное', title: 'Штигель Вайс', tags: ['Австрия', '5,1%'], prices: [{ volume: '500 мл', price: 596 }], image: '/assets/bar/beer-craft.webp' },
      { group: 'Бутылочное', title: 'Будвайзер', tags: ['Чехия', '5%'], prices: [{ volume: '500 мл', price: 596 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'Бутылочное', title: 'Штигель Голдбрау', tags: ['Австрия', '5,1%'], prices: [{ volume: '500 мл', price: 596 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'Бутылочное', title: 'Циндао', tags: ['Китай', '4,7%'], prices: [{ volume: '500 мл', price: 496 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'Бутылочное', title: 'Волковская пивоварня', description: 'Арахисовый стаут 4,7% 445 мл · Вишнёвое 4,7% 445 мл · Томатное гозе 4,7% 500 мл', tags: ['Россия', 'Крафт'], prices: [{ volume: '440–500 мл', price: 496 }], image: '/assets/bar/beer-craft.webp' },
      { group: 'Бутылочное', title: 'Бивер Премиум', tags: ['5,0%'], prices: [{ volume: '500 мл', price: 386 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'Бутылочное', title: 'Чешское', tags: ['4,7%'], prices: [{ volume: '440 мл', price: 386 }], image: '/assets/bar/beer-lager.webp' },
      // Безалкогольное
      { group: 'Безалкогольное', title: 'Крушовице светлое', tags: ['Безалк.'], prices: [{ volume: '330 мл', price: 286 }], image: '/assets/bar/beer-lager.webp' },
      { group: 'Безалкогольное', title: 'Сладовар нефильтр.', tags: ['Безалк.'], prices: [{ volume: '500 мл', price: 286 }], image: '/assets/bar/beer-craft.webp' },
    ],
  },

  {
    slug: 'wine',
    name: 'Вино',
    caption: 'Бокал и бутылка — белое, красное и игристое',
    items: [
      // Белое
      { group: 'Белое', title: 'Таманский полуостров Шардоне', tags: ['Россия', 'сух.'], prices: [{ volume: '125 мл', price: 292 }, { volume: '750 мл', price: 1756 }], image: '/assets/bar/wine-white.webp' },
      { group: 'Белое', title: 'Стейквайн Торронтес', tags: ['Аргентина', 'п/сух.'], prices: [{ volume: '125 мл', price: 492 }, { volume: '750 мл', price: 2956 }], image: '/assets/bar/wine-white.webp' },
      { group: 'Белое', title: 'Курикано Совиньон Блан', tags: ['Чили', 'п/сл.'], prices: [{ volume: '750 мл', price: 2956 }], image: '/assets/bar/wine-white.webp' },
      { group: 'Белое', title: 'Санвиджилио Пино Гриджио', tags: ['Италия', 'сух.'], prices: [{ volume: '750 мл', price: 3206 }], image: '/assets/bar/wine-white.webp' },
      { group: 'Белое', title: 'Понтебелло Треббьяно Рубиконе', tags: ['Италия', 'сух.'], prices: [{ volume: '750 мл', price: 2656 }], image: '/assets/bar/wine-white.webp' },
      { group: 'Белое', title: 'Высокий Берег Мюллер-Тургау', tags: ['Россия', 'сух.'], prices: [{ volume: '750 мл', price: 2156 }], image: '/assets/bar/wine-white.webp' },
      // Красное
      { group: 'Красное', title: 'Таманский полуостров Каберне', tags: ['Россия', 'сух.'], prices: [{ volume: '125 мл', price: 292 }, { volume: '750 мл', price: 1756 }], image: '/assets/bar/wine-red.webp', badge: 'hit' },
      { group: 'Красное', title: 'Стейквайн Мальбек', tags: ['Аргентина', 'сух.'], prices: [{ volume: '125 мл', price: 492 }, { volume: '750 мл', price: 2956 }], image: '/assets/bar/wine-red.webp' },
      { group: 'Красное', title: 'Курикано Каберне Совиньон', tags: ['Чили', 'п/сл.'], prices: [{ volume: '750 мл', price: 2956 }], image: '/assets/bar/wine-red.webp' },
      { group: 'Красное', title: '«Джи 7» Мерло', tags: ['Чили', 'сух.'], prices: [{ volume: '750 мл', price: 3566 }], image: '/assets/bar/wine-red.webp' },
      { group: 'Красное', title: 'Кьянти Классик', tags: ['Италия', 'сух.'], prices: [{ volume: '750 мл', price: 4166 }], image: '/assets/bar/wine-red.webp', badge: 'chef' },
      { group: 'Красное', title: 'Джейкоб`с Крик Каберне', tags: ['Австралия', 'сух.'], prices: [{ volume: '750 мл', price: 2806 }], image: '/assets/bar/wine-red.webp' },
      // Игристое
      { group: 'Игристое', title: 'Шато Тамань Эритаж Брют', tags: ['Россия', 'п/сл.'], prices: [{ volume: '750 мл', price: 1766 }], image: '/assets/bar/wine-sparkling.webp' },
      { group: 'Игристое', title: 'Ламбруско Бьянко Эмилия', tags: ['Италия'], prices: [{ volume: '750 мл', price: 2856 }], image: '/assets/bar/wine-sparkling.webp' },
      { group: 'Игристое', title: 'Мартини Асти', tags: ['Италия'], prices: [{ volume: '750 мл', price: 5856 }], image: '/assets/bar/wine-sparkling.webp' },
      { group: 'Игристое', title: 'Мартини Просекко', tags: ['Италия'], prices: [{ volume: '750 мл', price: 5856 }], image: '/assets/bar/wine-sparkling.webp' },
    ],
  },

  {
    slug: 'infusions',
    name: 'Фирменные настойки',
    caption: 'Своя кухня настоек: 20° / 30° / 40° — порция 50 мл',
    items: [
      { group: '20° · 176 ₽', title: 'Сливочный банан', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },
      { group: '20° · 176 ₽', title: 'Маракуйя-ваниль', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },
      { group: '20° · 176 ₽', title: 'Печёное яблоко', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },
      { group: '20° · 176 ₽', title: 'Груша-жасмин', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },
      { group: '20° · 176 ₽', title: 'Острый томат', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },
      { group: '20° · 176 ₽', title: 'Клубника-банан', volume: '50 мл', price: 176, image: '/assets/bar/spirits-vodka.webp' },

      { group: '30° · 196 ₽', title: 'Клюква | Бейлиз', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },
      { group: '30° · 196 ₽', title: 'Брусника-апельсин', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },
      { group: '30° · 196 ₽', title: 'Малина-можжевельник', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },
      { group: '30° · 196 ₽', title: 'Клубника-киви | Вишня-бергамот', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },
      { group: '30° · 196 ₽', title: 'Пряный красный апельсин', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },
      { group: '30° · 196 ₽', title: 'Чёрная смородина с чабрецом', volume: '50 мл', price: 196, image: '/assets/bar/spirits-rum.webp' },

      { group: '40° · 216 ₽', title: 'Клубничная текила', volume: '50 мл', price: 216, image: '/assets/bar/spirits-tequila.webp', badge: 'hit' },
      { group: '40° · 216 ₽', title: 'Хреновуха', volume: '50 мл', price: 216, image: '/assets/bar/spirits-vodka.webp' },
      { group: '40° · 216 ₽', title: 'Кофейный ром', volume: '50 мл', price: 216, image: '/assets/bar/spirits-rum.webp' },
      { group: '40° · 216 ₽', title: 'Лимонный джин', volume: '50 мл', price: 216, image: '/assets/bar/spirits-vodka.webp' },
    ],
  },

  {
    slug: 'cocktails',
    name: 'Коктейли',
    caption: 'Алкогольные коктейли — авторские и классика',
    items: [
      {
        title: 'Секрет шефа',
        volume: '350 мл',
        price: 350,
        description: 'Назови основу, и дальше мы продумаем сами. Цена — от 350 до 5000 ₽.',
        tags: ['350–5000 ₽'],
        image: '/assets/bar/cocktail-signature.webp',
        badge: 'chef',
      },
      { title: 'Виски-кола', volume: '350 мл', price: 456, description: 'Виски, Кола, апельсин.', image: '/assets/bar/cocktail-classic.webp' },
      { title: 'Лавандовый Джин', volume: '420 мл', price: 466, description: 'Джин, Спрайт, сироп лаванды, сок лайма.', image: '/assets/bar/cocktail-mojito.webp', badge: 'new' },
      { title: 'Дамский угодник', volume: '420 мл', price: 466, description: 'Амаретто, сироп миндаль, фреш апельсина, сок лимона.', image: '/assets/bar/cocktail-aperol.webp' },
      { title: 'Мохито Классический', volume: '350 мл', price: 456, description: 'Ром, сок лайма, сахар, мята, содовая.', image: '/assets/bar/cocktail-mojito.webp', badge: 'hit' },
      { title: 'Пина Колада', volume: '350 мл', price: 456, description: 'Ром, сок ананаса, сироп кокос.', image: '/assets/bar/cocktail-mojito.webp' },
      { title: 'Креди Сауэр', volume: '350 мл', price: 456, description: 'Ром, сироп бабл гам, ликёр дыня, сауэр, яйцо.', image: '/assets/bar/cocktail-classic.webp' },
      { title: 'Леди Сауэр', volume: '350 мл', price: 456, description: 'Ром, сироп бабл гам, ликёр дыня, сауэр, яйцо.', image: '/assets/bar/cocktail-classic.webp' },
      { title: 'Лонг-Айленд', volume: '350 мл', price: 496, description: 'Водка, джин, текила, ром, ликёр апельсин.', image: '/assets/bar/cocktail-classic.webp' },
      { title: 'Тот самый Апероль', volume: '350 мл', price: 496, description: 'Аперол, игристое, содовая, апельсин.', image: '/assets/bar/cocktail-aperol.webp', badge: 'hit' },
      { title: 'Мартини Тоник', volume: '350 мл', price: 456, description: 'Мартини, тоник, лайм.', image: '/assets/bar/cocktail-classic.webp' },
      { title: 'Джин Тоник', volume: '350 мл', price: 456, description: 'Джин, тоник, лайм.', image: '/assets/bar/cocktail-classic.webp' },
    ],
  },

  {
    slug: 'shots',
    name: 'Хот шоты',
    caption: 'Слоистые горячие шоты — порция 50 мл',
    items: [
      { title: 'Б 52', volume: '50 мл', price: 386, image: '/assets/bar/spirits-rum.webp' },
      { title: 'Б 53', volume: '50 мл', price: 386, image: '/assets/bar/spirits-rum.webp' },
      { title: 'Опухоль мозга', volume: '50 мл', price: 386, description: 'Шот-эффект — оттенки, как у настоящего «мозга».', image: '/assets/bar/cocktail-signature.webp', badge: 'hit' },
      { title: 'Хиросима', volume: '50 мл', price: 356, image: '/assets/bar/cocktail-signature.webp' },
      { title: 'Облака', volume: '50 мл', price: 356, image: '/assets/bar/cocktail-classic.webp' },
    ],
  },

  {
    slug: 'spirits',
    name: 'Крепкое',
    caption: 'Водка, бренди, виски, ром, ликёр, текила, джин',
    items: [
      // Водка (50 / 500)
      { group: 'Водка', title: 'Царская', prices: [{ volume: '50 мл', price: 196 }, { volume: '500 мл', price: 1956 }], image: '/assets/bar/spirits-vodka.webp' },
      { group: 'Водка', title: 'Белая Берёзка', prices: [{ volume: '50 мл', price: 189 }, { volume: '500 мл', price: 1896 }], image: '/assets/bar/spirits-vodka.webp' },
      { group: 'Водка', title: 'Онегин', prices: [{ volume: '50 мл', price: 329 }, { volume: '500 мл', price: 3260 }], image: '/assets/bar/spirits-vodka.webp', badge: 'chef' },
      // Бренди
      { group: 'Бренди', title: 'Арарат, 3 года', prices: [{ volume: '40 мл', price: 336 }, { volume: '700 мл', price: 5856 }], image: '/assets/bar/spirits-cognac.webp' },
      { group: 'Бренди', title: 'Асканели, 6 лет', prices: [{ volume: '40 мл', price: 336 }, { volume: '700 мл', price: 4156 }], image: '/assets/bar/spirits-cognac.webp' },
      { group: 'Бренди', title: 'Ной Подарочный, 5 лет', prices: [{ volume: '40 мл', price: 406 }, { volume: '700 мл', price: 5056 }], image: '/assets/bar/spirits-cognac.webp' },
      // Вермут и биттер
      { group: 'Вермут и биттер', title: 'Мартини · Бьянко | Россо | Фьеро', prices: [{ volume: '50 мл', price: 296 }, { volume: '1000 мл', price: 5856 }], image: '/assets/bar/wine-sparkling.webp' },
      { group: 'Вермут и биттер', title: 'Апероль', prices: [{ volume: '50 мл', price: 466 }, { volume: '1000 мл', price: 6506 }], image: '/assets/bar/cocktail-aperol.webp' },
      // Виски
      { group: 'Виски', title: 'Джемесон', tags: ['Ирландия'], prices: [{ volume: '40 мл', price: 536 }, { volume: '750 мл', price: 9556 }], image: '/assets/bar/spirits-whisky.webp' },
      { group: 'Виски', title: 'Баллантайнс', tags: ['Шотландия'], prices: [{ volume: '40 мл', price: 396 }, { volume: '750 мл', price: 7506 }], image: '/assets/bar/spirits-whisky.webp' },
      { group: 'Виски', title: 'Вильям Лоусонс', tags: ['Шотландия'], prices: [{ volume: '40 мл', price: 316 }, { volume: '750 мл', price: 5556 }], image: '/assets/bar/spirits-whisky.webp' },
      { group: 'Виски', title: 'Синглтон, 12 лет, односолодовый', tags: ['Single Malt'], prices: [{ volume: '40 мл', price: 896 }, { volume: '750 мл', price: 15656 }], image: '/assets/bar/spirits-whisky.webp', badge: 'chef' },
      { group: 'Виски', title: 'Бушмилс', tags: ['Ирландия'], prices: [{ volume: '40 мл', price: 496 }, { volume: '750 мл', price: 6156 }], image: '/assets/bar/spirits-whisky.webp' },
      // Ром
      { group: 'Ром', title: 'Барсело Аньехо', prices: [{ volume: '40 мл', price: 306 }, { volume: '1000 мл', price: 7506 }], image: '/assets/bar/spirits-rum.webp' },
      { group: 'Ром', title: 'Оакхарт Пряный золотой', prices: [{ volume: '40 мл', price: 296 }, { volume: '1000 мл', price: 5156 }], image: '/assets/bar/spirits-rum.webp' },
      { group: 'Ром', title: 'Капитан Морган', prices: [{ volume: '40 мл', price: 296 }, { volume: '700 мл', price: 5156 }], image: '/assets/bar/spirits-rum.webp' },
      { group: 'Ром', title: 'Барсело Бланко', prices: [{ volume: '40 мл', price: 406 }, { volume: '700 мл', price: 5056 }], image: '/assets/bar/spirits-rum.webp' },
      // Ликёр
      { group: 'Ликёр', title: 'Ягермайстер', prices: [{ volume: '50 мл', price: 496 }, { volume: '700 мл', price: 6956 }], image: '/assets/bar/spirits-rum.webp' },
      { group: 'Ликёр', title: 'Бехеровка', prices: [{ volume: '50 мл', price: 466 }, { volume: '700 мл', price: 6556 }], image: '/assets/bar/spirits-rum.webp' },
      { group: 'Ликёр', title: 'Самбука', prices: [{ volume: '50 мл', price: 466 }, { volume: '700 мл', price: 6556 }], image: '/assets/bar/spirits-vodka.webp' },
      { group: 'Ликёр', title: 'Абсент', prices: [{ volume: '50 мл', price: 486 }, { volume: '500 мл', price: 4800 }], image: '/assets/bar/spirits-vodka.webp' },
      // Текила
      { group: 'Текила', title: 'Ольмека · Бланко | Голд', prices: [{ volume: '40 мл', price: 426 }, { volume: '700 мл', price: 6006 }], image: '/assets/bar/spirits-tequila.webp', badge: 'hit' },
      // Джин
      { group: 'Джин', title: 'Гордонс London Dry', prices: [{ volume: '40 мл', price: 326 }, { volume: '1000 мл', price: 8156 }], image: '/assets/bar/spirits-vodka.webp' },
      { group: 'Джин', title: 'Бомбей Сапфир', prices: [{ volume: '40 мл', price: 476 }, { volume: '1000 мл', price: 9100 }], image: '/assets/bar/spirits-vodka.webp' },
      // Медовуха
      { group: 'Медовуха', title: 'Медовуха в ассортименте', prices: [{ volume: '750 мл', price: 796 }], image: '/assets/bar/beer-craft.webp' },
    ],
  },

  {
    slug: 'tea-coffee',
    name: 'Чай · Кофе · Десерты',
    caption: 'Авторский и классический чай, кофейная карта и десерты',
    items: [
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Таёжный с можжевельником', volume: '740 мл', price: 446, image: '/assets/bar/hot-tea.webp', badge: 'chef' },
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Альпийский со смородиной', volume: '740 мл', price: 446, description: 'Чёрный чай с ягодами смородины, ананасом и травяными нотами.', image: '/assets/bar/hot-tea.webp' },
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Апельсин-лайм-облепиха', volume: '740 мл', price: 446, description: 'Цитрусовый микс с грушей и ананасом.', image: '/assets/bar/hot-tea.webp' },
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Клубника-земляника', volume: '740 мл', price: 446, description: 'Гибискус с миксом ягод и ананасом.', image: '/assets/bar/hot-tea.webp' },
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Брусника-ежевика-имбирь', volume: '740 мл', price: 446, description: 'Микс ягод с гибискусом, липой и имбирём.', image: '/assets/bar/hot-tea.webp' },
      { group: 'Авторский чай · 740 мл · 446 ₽', title: 'Фруктовый глинтвейн', volume: '740 мл', price: 446, description: 'Гибискус с фруктами и нотками корицы, цитрусом, кардамоном и гвоздикой.', image: '/assets/bar/hot-mulled.webp' },

      { group: 'Классический чай · 600 мл · 226 ₽', title: 'Чёрный | Зелёный | Фруктовый | Травяной', volume: '600 мл', price: 226, image: '/assets/bar/hot-tea.webp' },

      { group: 'Кофе', title: 'Латте', volume: '300 мл', price: 256, image: '/assets/bar/hot-coffee.webp' },
      { group: 'Кофе', title: 'Американо', volume: '150 мл', price: 186, image: '/assets/bar/hot-coffee.webp' },
      { group: 'Кофе', title: 'Капучино', volume: '150 мл', price: 216, image: '/assets/bar/hot-coffee.webp', badge: 'hit' },
      { group: 'Кофе', title: 'Эспрессо', volume: '30 мл', price: 156, image: '/assets/bar/hot-coffee.webp' },

      { group: 'Десерты', title: 'Чизкейк', volume: '130 г', price: 256, image: '/assets/bar/hot-coffee.webp' },
      { group: 'Десерты', title: 'Бельгийская вафля', volume: '160 г', price: 396, image: '/assets/menu/Vaflya-so-smorodinoy.webp' },
      { group: 'Десерты', title: 'Панна-котта', volume: '120 г', price: 336, image: '/assets/bar/hot-coffee.webp' },
    ],
  },

  {
    slug: 'lemonade',
    name: 'Лимонад',
    caption: 'Фирменные лимонады — варим сами',
    items: [
      { title: 'Тархун-манго', prices: [{ volume: '400 мл', price: 336 }, { volume: '1000 мл', price: 896 }], description: 'Сироп тархун, манго, сауэр, сок апельсина, содовая.', image: '/assets/bar/soft-lemonade.webp', badge: 'hit' },
      { title: 'Яблоко-персик', prices: [{ volume: '400 мл', price: 336 }, { volume: '1000 мл', price: 896 }], description: 'Сироп яблоко, сок персик, сауэр, сок гранатовый, содовая.', image: '/assets/bar/soft-lemonade.webp' },
      { title: 'Огурец-лайм', prices: [{ volume: '400 мл', price: 336 }, { volume: '1000 мл', price: 896 }], description: 'Огурец, сок лайма, содовая.', image: '/assets/bar/soft-lemonade.webp', badge: 'new' },
      { title: 'Фиалка-чёрная смородина', prices: [{ volume: '400 мл', price: 336 }, { volume: '1000 мл', price: 896 }], description: 'Сироп фиалка, сироп смородина, сок лимона, сауэр.', image: '/assets/bar/soft-lemonade.webp' },
      { title: 'Черничная кола', prices: [{ volume: '400 мл', price: 336 }, { volume: '1000 мл', price: 896 }], description: 'Сироп черника, Кола, сауэр, сок яблочный, содовая.', image: '/assets/bar/soft-lemonade.webp' },
    ],
  },

  {
    slug: 'soft',
    name: 'Безалкогольное',
    caption: 'Фреш, сок, морс, вода и тоник',
    items: [
      { group: 'Фреш', title: 'Яблоко | Апельсин', volume: '200 мл', price: 356, image: '/assets/bar/soft-juice.webp' },
      { group: 'Фреш', title: 'Морковь', volume: '200 мл', price: 236, image: '/assets/bar/soft-juice.webp' },

      { group: 'Сок', title: 'Яблоко | Апельсин | Вишня | Томат', prices: [{ volume: '200 мл', price: 166 }, { volume: '1000 мл', price: 566 }], image: '/assets/bar/soft-juice.webp' },

      { group: 'Морс', title: 'Морс ягодный', prices: [{ volume: '200 мл', price: 156 }, { volume: '1000 мл', price: 566 }], image: '/assets/bar/soft-mors.webp' },

      { group: 'Вода и тоник', title: 'Вода с газом / без', volume: '500 мл', price: 206, image: '/assets/bar/soft-juice.webp' },
      { group: 'Вода и тоник', title: 'Кола | Спрайт | Тоник', volume: '330 мл', price: 316, image: '/assets/bar/soft-juice.webp' },
    ],
  },
]
