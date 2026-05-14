export type LunchMenuItem = {
  title: string
  weight?: string
  price: number
  description?: string
  image?: string
}

export type LunchCategory = {
  name: string
  items: LunchMenuItem[]
}

export const businessLunch: LunchCategory[] = [
  {
    name: 'Салаты',
    items: [
      { title: 'Салат мимоза', weight: '180 г', price: 166 },
      { title: 'Салат греческий', weight: '150 г', price: 216 },
      { title: 'Салат цезарь с курицей', weight: '150 г', price: 186, image: '/assets/menu/Tsezar-s-kuritsey.webp' },
    ],
  },
  {
    name: 'Супы',
    items: [
      { title: 'Суп грибной', weight: '250 г', price: 146 },
      { title: 'Борщ с говядиной', weight: '250/30/20 г', price: 176, image: '/assets/menu/Borshch.webp' },
      { title: 'Суп харчо', weight: '250/30 г', price: 226 },
    ],
  },
  {
    name: 'Горячее',
    items: [
      { title: 'Чкмерули в сливочном соусе', weight: '220/50 г', price: 416 },
      { title: 'Отбивная из свинины со спагетти', weight: '150/120 г', price: 386 },
      { title: 'Скумбрия на гриле', weight: '240/30 г', price: 406 },
    ],
  },
  {
    name: 'Десерт',
    items: [
      { title: 'Сливочная панна-котта с малиновым вареньем', weight: '150/50 г', price: 236 },
      { title: 'Меренговый рулет', weight: '120 г', price: 156 },
    ],
  },
  {
    name: 'Напитки',
    items: [
      { title: 'Чай чёрный / зелёный', weight: '400 мл', price: 95 },
      { title: 'Американо', weight: '150 мл', price: 95 },
      { title: 'Морс ягодный', weight: '200 мл', price: 85 },
      { title: 'Настойка дня', weight: '50 мл', price: 110, description: 'Уточняйте у официанта' },
      { title: 'Фирменное пиво светлое', weight: '500 мл', price: 255 },
    ],
  },
]
