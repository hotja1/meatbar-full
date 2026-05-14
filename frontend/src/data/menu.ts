export type MenuItem = {
  id?: number
  title: string
  weight?: string
  price: number
  description?: string
  image?: string
  available?: boolean
  featured?: boolean
  spicy?: boolean
}

export type MenuCategory = {
  id?: number
  name: string
  order?: number
  items: MenuItem[]
}

export const menu: MenuCategory[] = [
  {
    name: 'Бургеры',
    items: [
      {
        title: 'Ореховый цыплёнок',
        weight: '320 г',
        price: 696,
        description:
          'Сочный куриный шницель, плавленый чеддер, запечённый перец и красный лук, хрустящий романо, ореховый соус и арахис в мягкой булочке',
        image: '/assets/menu/Orekhovyy-tsyplenok.webp',
      },
      {
        title: 'Мраморная говядина',
        weight: '320 г',
        price: 796,
        description:
          'Нежная котлета из мраморной говядины с чеддером, томатами, маринованными огурцами и романо, с соусом барбекю и брусничным соусом в булочке',
      },
      {
        title: 'Рваная свинина',
        weight: '320 г',
        price: 796,
        description:
          'Нежная свинина с тягучей моцареллой, свежими томатами и романо, маринованными огурцами и красным луком под соусом барбекю в мягкой булочке',
      },
      {
        title: 'Рваная говядина',
        weight: '320 г',
        price: 796,
        description:
          'Томлёная говядина с чеддером, томатами и романо, с маринованными огурцами и красным луком под соусом барбекю и терияки в булочке',
      },
      {
        title: 'Бургер с брискетом',
        weight: '320 г',
        price: 696,
        description:
          'Мягкий говяжий брискет, моцарелла, томаты и романо, маринованные огурцы и красный лук с соусом барбекю в мягкой булочке',
        image: '/assets/menu/Burger-s-brisketom.webp',
      },
    ],
  },
  {
    name: 'Холодные закуски',
    items: [
      {
        title: 'Мясной сет',
        weight: '320 г',
        price: 1396,
        description:
          'Ассорти копчёностей и вяленого мяса: брискет, бастурма, коппа и сыровяленая колбаса с горчицей и хреном',
        image: '/assets/menu/Myasnoy-set.webp',
      },
      {
        title: 'Сырный сет',
        weight: '190 г',
        price: 836,
        description:
          'Подборка выдержанных и мягких сыров: дор блю, моцарелла, чеддер и пармезан. Подаётся с мёдом, орехами и виноградом',
        image: '/assets/menu/Syrnyy-set.webp',
      },
      {
        title: 'Ассорти сала',
        weight: '270 г',
        price: 516,
        description:
          'Нарезка ароматного сала с маринованными огурчиками, зелёным луком и зернистой горчицей',
        image: '/assets/menu/Assorti-sala.webp',
      },
      {
        title: 'Альтернативный ростбиф',
        weight: '140 г',
        price: 686,
        description:
          'Тонко нарезанный ростбиф из мраморной говядины с рукколой, каперсами и горчичным дрессингом',
        image: '/assets/menu/Rostbif.webp',
      },
      {
        title: 'Подкопчёная утиная грудка',
        weight: '160 г',
        price: 606,
        description:
          'Нежное утиное филе холодного копчения с вишнёвым конфитюром и микрозеленью',
        image: '/assets/menu/Podkopchenaya-utinaya-grudka.webp',
      },
      {
        title: 'Грузди со сметаной',
        weight: '150 г',
        price: 536,
        description:
          'Солёные грузди с домашней сметаной, красным луком и свежим укропом',
        image: '/assets/menu/Gruzdi-so-smetanoy.webp',
      },
      {
        title: 'Лосось слабосолёный',
        weight: '100 г',
        price: 816,
        description:
          'Филе лосося домашнего посола с лимоном, каперсами и свежим укропом',
        image: '/assets/menu/Losos-slaboy-soli.webp',
      },
      {
        title: 'Тартар из говядины',
        weight: '150 г',
        price: 766,
        description: 'С печёными перцами на подкопчёной мозговой косточке',
      },
      {
        title: 'Тартар из тунца с авокадо',
        weight: '150 г',
        price: 596,
        description:
          'Свежий тунец с кремовым авокадо, соевым дрессингом и кунжутом на хрустящем чипсе',
      },
    ],
  },
  {
    name: 'Горячие закуски',
    items: [
      {
        title: 'Чесночные гренки',
        weight: '230 г',
        price: 236,
        description:
          'Хрустящие ржаные гренки с чесночным маслом и ароматными травами, подаются с сырным соусом',
        image: '/assets/menu/Chesnochnye-grenki.webp',
      },
      {
        title: 'Крылья копчёные',
        weight: '280 г',
        price: 436,
        description:
          'Куриные крылья горячего копчения на ольховой щепе с пикантным соусом на выбор',
        image: '/assets/menu/Kopchenye-krylya.webp',
      },
      {
        title: 'Крылья BBQ',
        weight: '280 г',
        price: 436,
        description:
          'Крылья в карамельной глазури барбекю, обжаренные до хрустящей корочки',
        image: '/assets/menu/Krylya-BBQ.webp',
      },
      {
        title: 'Сырные палочки',
        weight: '230 г',
        price: 456,
        description:
          'Моцарелла в хрустящей панировке с ягодным соусом и свежей зеленью',
        image: '/assets/menu/Syrnye-palochki.webp',
      },
      {
        title: 'Жареный камамбер',
        weight: '190 г',
        price: 696,
        description: 'Соус из чёрной смородины',
      },
      {
        title: 'Стрипсы из говядины',
        weight: '180 г',
        price: 556,
        description: 'Соус Каролина Рипер',
        image: '/assets/menu/Stripsy-iz-govyadiny.webp',
      },
    ],
  },
  {
    name: 'Салаты',
    items: [
      {
        title: 'Цезарь с курицей',
        weight: '180 г',
        price: 516,
        description:
          'Обжаренная куриная грудка, романо и айсберг, томаты черри, пармезан и хрустящие крутоны под соусом Цезарь',
        image: '/assets/menu/Tsezar-s-kuritsey.webp',
      },
      {
        title: 'Цезарь с креветками',
        weight: '200 г',
        price: 586,
        description:
          'Креветки с миксом свежих листьев, томатами черри и пармезаном, дополненные крутонами и соусом Цезарь',
        image: '/assets/menu/Tsezar-s-krevetkami.webp',
      },
      {
        title: 'Из жареных баклажанов с томатами и кунжутным кремом',
        weight: '190 г',
        price: 586,
        description:
          'Золотистые баклажаны с томатами и красным луком, свежей кинзой и кунжутным кремом, дополненные кисло-сладким соусом и кунжутом',
        image: '/assets/menu/Salat-s-zharenymi-baklazhanami.webp',
      },
      {
        title: 'С утиной грудкой',
        weight: '210 г',
        price: 566,
        description:
          'Подкопчённое утиное филе с миксом свежих листьев, стручковой фасолью и томатами черри, с яблоком и морковью под горчично-апельсиновой заправкой и дольками апельсина',
        image: '/assets/menu/Salat-s-utkoy.webp',
      },
      {
        title: 'С олениной и вяленой клюквой',
        weight: '190 г',
        price: 716,
        description:
          'Ломтики оленины с миксом свежих листьев, печёной свёклой и шампиньонами, с вяленой клюквой и кедровыми орехами под соусом винегрет и бальзамическим кремом',
        featured: true,
      },
      {
        title: 'С тунцом, печёными цуккини и имбирной заправкой',
        weight: '210 г',
        price: 586,
        description:
          'Филе тунца с печёными цуккини, руколой и томатами черри, с красным луком и грейпфрутом, под имбирным дрессингом с лёгкими кунжутными нотками',
        image: '/assets/menu/Salat-s-tuntsom.webp',
      },
      {
        title: 'С креветками и авокадо',
        weight: '250 г',
        price: 716,
        description:
          'Нежные креветки и спелое авокадо с зелёным миксом и черри, с цитрусовой горчичной заправкой и лёгкой сладковатой ноткой мяты',
        image: '/assets/menu/Salat-s-avokado-i-krevetkami.webp',
      },
      {
        title: 'С лососем и сырным муссом',
        weight: '190 г',
        price: 716,
        description:
          'Лосось с миксом шпината, руколы и романо, авокадо и огурцом, с томатами черри и нежным сырным муссом, дополненный кунжутом и соусом унаги',
        image: '/assets/menu/Salat-s-lososem-i-syrnym-mussom.webp',
      },
      {
        title: 'Овощной с мягким сыром',
        weight: '190 г',
        price: 516,
        description:
          'Свежие огурцы, томаты и болгарский перец с красным луком с маслинами, миксом салата и мягкой фетой, с ароматным маслом и соусом песто',
      },
    ],
  },
  {
    name: 'Горячее',
    items: [
      {
        title: 'Голень барашка',
        weight: '450 г',
        price: 1416,
        description:
          'Томлёная голень ягнёнка с розмарином и чесноком, подаётся с овощным рагу',
        featured: true,
        image: '/assets/menu/Golen-barashka.webp',
      },
      {
        title: 'Томлёное ребро говядины',
        weight: '370 г',
        price: 1156,
        description:
          'Говяжье ребро длительного томления с демигласом и печёным картофелем',
      },
      {
        title: 'Рванина из говядины с картофельным пюре',
        weight: '330 г',
        price: 816,
        description:
          'Нежная томлёная говядина, разобранная вручную, с воздушным пюре и соусом из красного вина',
      },
      {
        title: 'Томлёная рулька',
        weight: '1070 г',
        price: 856,
        description:
          'Свиная рулька длительного томления с хрустящей корочкой, подаётся с горчицей и квашеной капустой',
        image: '/assets/menu/Tomlenaya-rulka.webp',
      },
      {
        title: 'Жарёха с картофелем и свининой',
        weight: '350 г',
        price: 596,
        description:
          'Обжаренная свинина с золотистым картофелем, луком и грибами на чугунной сковороде',
      },
      {
        title: 'Жарёха с картофелем и бараниной',
        weight: '350 г',
        price: 796,
        description:
          'Баранина с картофелем, сладким перцем и томатами, приготовленная на чугунной сковороде',
      },
      {
        title: 'Мидии',
        weight: '340 г',
        price: 886,
        description: 'В сырно-сливочном соусе',
        image: '/assets/menu/Midii-v-slivochnom-souse.webp',
      },
      {
        title: 'Befstroganov с грибами',
        weight: '340 г',
        price: 656,
        description:
          'Говядина в сливочном соусе с шампиньонами и маринованными огурчиками, подаётся с рисом',
        image: '/assets/menu/Befstroganov.webp',
      },
      {
        title: 'Brisket с пюре',
        weight: '300 г',
        price: 896,
        description:
          'Говяжья грудинка 14-часового копчения с воздушным картофельным пюре и соусом демиглас',
        image: '/assets/menu/Brisket.webp',
      },
      {
        title: 'Говяжьи щёчки',
        weight: '310 г',
        price: 796,
        description: 'В соусе «Портвейн» с картофельным пюре и шпинатом',
      },
      {
        title: 'Пельмени говяжьи',
        weight: '230 г',
        price: 496,
        description:
          'Домашние пельмени из рубленой говядины со сметаной и сливочным маслом',
        image: '/assets/menu/Pelmeni-s-govyadinoy.webp',
      },
      {
        title: 'Щучьи котлеты с картофельным пюре',
        weight: '300 г',
        price: 686,
        description:
          'Нежные котлеты из щуки с укропом и сливочным пюре, подаются с тартаром',
        image: '/assets/menu/Shchuchi-kotlety.webp',
      },
      {
        title: 'Котлеты из оленины',
        weight: '180 г',
        price: 836,
        description: 'С соусом из чёрной смородины',
        featured: true,
      },
      {
        title: 'Жарёха с олениной',
        weight: '350 г',
        price: 836,
        description:
          'Оленина с картофелем, брусникой и лесными грибами на чугунной сковороде',
      },
      {
        title: 'Жарёха с телячьей покромкой и опятами',
        weight: '350 г',
        price: 896,
        description:
          'Телячья покромка с опятами, картофелем и луком, томлённая на сковороде',
      },
      {
        title: 'Домашние котлеты с картофельным пюре',
        weight: '300 г',
        price: 896,
        description:
          'Сочные котлеты из смеси говядины и свинины с воздушным пюре и грибным соусом',
        image: '/assets/menu/Domashnie-kotlety.webp',
      },
    ],
  },
  {
    name: 'Супы',
    items: [
      {
        title: 'Рамен',
        weight: '350 г',
        price: 696,
        description: 'С рёберным мясом',
      },
      {
        title: 'Borshch',
        weight: '300 г',
        price: 556,
        description: 'С чесночными гренками и салом',
        image: '/assets/menu/Borshch.webp',
      },
      {
        title: 'Solyanka',
        weight: '300 г',
        price: 586,
        description:
          'Наваристая солянка с копчёностями, оливками и лимоном, подаётся со сметаной',
        image: '/assets/menu/Solyanka.webp',
      },
      {
        title: 'Норвежская уха',
        weight: '300 г',
        price: 546,
        description:
          'Сливочная уха с лососем, картофелем и укропом по-скандинавски',
        image: '/assets/menu/Norvezhskaya-ukha.webp',
      },
      {
        title: 'Том Ям',
        weight: '390 г',
        price: 696,
        description:
          'Тайский суп с креветками, кокосовым молоком, лемонграссом и грибами шиитаке',
        image: '/assets/menu/Tom-Yam.webp',
        spicy: true,
      },
      {
        title: 'Сырный суп',
        weight: '400 г',
        price: 536,
        description: 'С халапеньо и свиными рёбрышками',
        image: '/assets/menu/Syrnyy-sup.webp',
        spicy: true,
      },
    ],
  },
  {
    name: 'На гриле с дымком',
    items: [
      {
        title: 'Стейк Рибай',
        weight: '250 г',
        price: 2956,
        description:
          'Классический рибай мраморной говядины на открытом огне, подаётся с соусом на выбор',
        featured: true,
        image: '/assets/menu/Steyk-Ribay.webp',
      },
      {
        title: 'Стейк из говяжьей вырезки',
        weight: '220 г',
        price: 1816,
        description:
          'Нежнейшая вырезка на гриле, минимум жира и максимум вкуса, с соусом демиглас',
        image: '/assets/menu/Govyazhya-vyrezka.webp',
      },
      {
        title: 'Стейк из свинины',
        weight: '350 г',
        price: 856,
        description: 'С картофелем бейби',
        image: '/assets/menu/Steyk-iz-svininy.webp',
      },
      {
        title: 'Стейк из тунца',
        weight: '300 г',
        price: 996,
        description:
          'С творожным муссом на свекольном фрейзе с цветной капустой гриль',
      },
      {
        title: 'Стейк Стриплойн',
        weight: '250 г',
        price: 2756,
        description:
          'Стриплойн мраморной говядины с насыщенным мясным вкусом, обжаренный на открытом огне',
        image: '/assets/menu/Steyk-Striployn.webp',
      },
      {
        title: 'Буженина с бейби картофелем',
        weight: '250 г',
        price: 626,
        description:
          'Запечённая свинина с пряностями и молодым картофелем, подаётся с горчицей',
      },
      {
        title: 'Бифштекс с яйцом',
        weight: '320 г',
        price: 816,
        description:
          'Рубленый бифштекс из говядины на гриле с яйцом пашот и перечным соусом',
        image: '/assets/menu/Bifshteks.webp',
      },
      {
        title: 'Язык с грибным соусом',
        weight: '250 г',
        price: 886,
        description:
          'Томлёный говяжий язык с нежным соусом из белых грибов и картофельным пюре',
        image: '/assets/menu/Yazyk-s-gribnym-sousom.webp',
      },
      {
        title: 'Dorado на гриле',
        weight: '250 г',
        price: 1156,
        description:
          'Целая дорадо на углях с лимоном, оливковым маслом и свежими травами',
        image: '/assets/menu/Dorado.webp',
      },
    ],
  },
  {
    name: 'Колбаски',
    items: [
      {
        title: 'Колбаски из свинины',
        weight: '350 г',
        price: 616,
        description: 'С тушёной капустой',
      },
      {
        title: 'Колбаски из говядины',
        weight: '320 г',
        price: 796,
        description: 'С тушёной капустой',
      },
      {
        title: 'Колбаски из птицы',
        weight: '350 г',
        price: 616,
        description: 'С тушёной капустой',
      },
    ],
  },
  {
    name: 'Свиные рёбра',
    items: [
      {
        title: 'CHEETOS',
        weight: '450 г',
        price: 836,
        description: 'С бейби картофелем и коул-слоу',
        image: '/assets/menu/Rebra-BBQ.webp',
      },
      {
        title: 'BBQ',
        weight: '450 г',
        price: 836,
        description: 'С бейби картофелем и коул-слоу',
        featured: true,
        image: '/assets/menu/Rebra-BBQ.webp',
      },
      {
        title: 'В сосновой глазури с мёдом',
        weight: '450 г',
        price: 836,
        description: 'С бейби картофелем и коул-слоу',
      },
      {
        title: 'Губы Гудбай',
        weight: '450 г',
        price: 836,
        description: 'В жгучей перечной глазури, с бейби картофелем и коул-слоу',
        spicy: true,
      },
    ],
  },
  {
    name: 'Картофельные вафли',
    items: [
      {
        title: 'Со слабосолёным лососем',
        weight: '320 г',
        price: 696,
        description:
          'Хрустящая картофельная вафля с лососем, сливочным сыром и каперсами',
      },
      {
        title: 'С копчёной утиной грудкой',
        weight: '320 г',
        price: 566,
        description:
          'Картофельная вафля с копчёной уткой, вишнёвым соусом и рукколой',
      },
      {
        title: 'С овощным рататуем',
        weight: '320 г',
        price: 486,
        description:
          'Картофельная вафля с запечёнными овощами, песто и пармезаном',
      },
    ],
  },
  {
    name: 'Гарниры',
    items: [
      {
        title: 'Картофель фри',
        weight: '150 г',
        price: 236,
        description:
          'Золотистый картофель фри с морской солью и паприкой',
        featured: true,
        image: '/assets/menu/Kartofel-fri.webp',
      },
      {
        title: 'Мексиканский овощной гарнир',
        weight: '150 г',
        price: 236,
        description:
          'Кукуруза, фасоль, перец и томаты с пряностями чили и лаймом',
        image: '/assets/menu/Meksikanskiy-garnir.webp',
      },
      {
        title: 'Овощи на гриле',
        weight: '150 г',
        price: 236,
        description:
          'Цуккини, баклажан, перец и томаты на открытом огне с оливковым маслом',
        image: '/assets/menu/Ovoshchi-gril.webp',
      },
      {
        title: 'Картофельное пюре',
        weight: '150 г',
        price: 166,
        description:
          'Воздушное пюре на сливочном масле с мускатным орехом',
        image: '/assets/menu/Kartofelnoe-pyure.webp',
      },
      {
        title: 'Бейби картофель',
        weight: '150 г',
        price: 166,
        description:
          'Молодой картофель, запечённый с чесноком, розмарином и тимьяном',
        image: '/assets/menu/Kartofel-bebi.webp',
      },
    ],
  },
  {
    name: 'Соусы',
    items: [
      {
        title: 'Сырный соус',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-syrnyy.webp',
      },
      {
        title: 'Чесночный соус',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-chesnochnyy.webp',
      },
      {
        title: 'Соус BBQ',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-BBQ.webp',
      },
      {
        title: 'Тартар',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-tartar.webp',
      },
      {
        title: 'Перечный соус',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-perechnyy.webp',
      },
      {
        title: 'Кетчуп',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-ketchup.webp',
      },
      {
        title: 'Сметана',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-smetana.webp',
      },
      {
        title: 'Ореховый соус',
        weight: '50 г',
        price: 60,
        image: '/assets/menu/Sous-orekhovyy.webp',
      },
      {
        title: 'Терияки',
        weight: '50 г',
        price: 60,
      },
    ],
  },
]
