type SectionSeo = {
  title: string
  description: string
}

const DYNAMIC_SCHEMA_ID = 'dynamic-website-schema'
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const ADMIN_ROBOTS = 'noindex,nofollow,noarchive'

const DEFAULT_SEO: SectionSeo = {
  title: 'Мясо Бар — гриль-бар и мясной ресторан в Нижневартовске',
  description:
    'Мясо Бар, Нижневартовск — гриль-бар и мясной ресторан: стейки, ребра, брискет, северная кухня. Бронирование столика и заказ онлайн.',
}

const SECTION_SEO: Record<string, SectionSeo> = {
  '#menu': {
    title: 'Меню Мясо Бар — стейки и гриль в Нижневартовске',
    description:
      'Актуальное меню Мясо Бар: стейки, ребра, брискет, салаты и горячие блюда в Нижневартовске.',
  },
  '#booking': {
    title: 'Бронь столика — Мясо Бар, Нижневартовск',
    description:
      'Выберите столик на интерактивной схеме зала и отправьте бронь в Мясо Бар, Нижневартовск.',
  },
  '#order': {
    title: 'Заказ и самовывоз — Мясо Бар, Нижневартовск',
    description:
      'Оформите заказ блюд из Мясо Бар в Нижневартовске: самовывоз, горячие блюда, стейки и гриль.',
  },
  '#contacts': {
    title: 'Контакты Мясо Бар — Нижневартовск',
    description:
      'Контакты и адрес Мясо Бар: ТРЦ ЮграМолл, 3 этаж, Нижневартовск. Ежедневно 11:00–24:00.',
  },
  '#gallery': DEFAULT_SEO,
  '#journey': DEFAULT_SEO,
  '#our-room': DEFAULT_SEO,
  '#bar': DEFAULT_SEO,
  '#jobs': DEFAULT_SEO,
}

function setMeta(selector: string, value: string) {
  const node = document.querySelector(selector)
  if (node && node instanceof HTMLMetaElement) {
    node.content = value
  }
}

function upsertMetaByName(name: string, content: string) {
  let node = document.querySelector(`meta[name="${name}"]`)
  if (!(node instanceof HTMLMetaElement)) {
    node = document.createElement('meta')
    node.setAttribute('name', name)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function isAdminPath() {
  return window.location.pathname.startsWith('/admin')
}

function setCanonicalAndOgUrl() {
  const origin = window.location.origin
  const path = window.location.pathname === '/' ? '/' : window.location.pathname
  const canonical = `${origin}${path}`
  let link = document.querySelector('link[rel="canonical"]')
  if (!(link instanceof HTMLLinkElement)) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', canonical)
  setMeta('meta[property="og:url"]', canonical)
}

function removeDynamicSchema() {
  const prev = document.getElementById(DYNAMIC_SCHEMA_ID)
  if (prev?.parentNode) prev.parentNode.removeChild(prev)
}

function createOrReplaceDynamicSchema() {
  const origin = window.location.origin
  const breadcrumbs = [
    { name: 'Home', url: `${origin}/` },
    { name: 'Menu', url: `${origin}/#menu` },
    { name: 'Booking', url: `${origin}/#booking` },
    { name: 'Order', url: `${origin}/#order` },
    { name: 'Contacts', url: `${origin}/#contacts` },
  ]
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: 'Мясо Бар',
        inLanguage: 'ru-RU',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${origin}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Restaurant',
        '@id': `${origin}/#restaurant`,
        url: `${origin}/`,
        name: 'Мясо Бар',
        alternateName: 'Meat Bar',
        telephone: '+7-912-907-47-47',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ул. Ленина, 15П',
          addressLocality: 'Нижневартовск',
          addressRegion: 'Ханты-Мансийский АО — Югра',
          postalCode: '628616',
          addressCountry: 'RU',
        },
        servesCuisine: ['Steakhouse', 'Grill', 'Russian', 'European'],
        areaServed: {
          '@type': 'City',
          name: 'Нижневартовск',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 60.9397,
          longitude: 76.5696,
        },
        hasMap: 'https://2gis.ru/nizhnevartovsk/firm/70000001086984807',
        sameAs: ['https://www.instagram.com/meatbar_nv/', 'https://vk.com/meatbar_nv'],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${origin}/#breadcrumbs`,
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  }

  removeDynamicSchema()

  const script = document.createElement('script')
  script.id = DYNAMIC_SCHEMA_ID
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  document.head.appendChild(script)
}

function applySectionSeo() {
  const section = SECTION_SEO[window.location.hash] ?? DEFAULT_SEO
  document.title = section.title
  setMeta('meta[name="description"]', section.description)
  setMeta('meta[property="og:title"]', section.title)
  setMeta('meta[property="og:description"]', section.description)
  setMeta('meta[name="twitter:title"]', section.title)
  setMeta('meta[name="twitter:description"]', section.description)
}

function applyVerificationMeta() {
  const yandexVerification = String(import.meta.env.VITE_YANDEX_VERIFICATION ?? '').trim()
  const googleVerification = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? '').trim()
  if (yandexVerification) {
    upsertMetaByName('yandex-verification', yandexVerification)
  }
  if (googleVerification) {
    upsertMetaByName('google-site-verification', googleVerification)
  }
}

function applyRobotsMeta() {
  upsertMetaByName('robots', isAdminPath() ? ADMIN_ROBOTS : DEFAULT_ROBOTS)
}

export function installSeoEnhancements() {
  setCanonicalAndOgUrl()
  applyRobotsMeta()
  applyVerificationMeta()

  if (!isAdminPath()) {
    createOrReplaceDynamicSchema()
    applySectionSeo()
  } else {
    removeDynamicSchema()
  }

  const onHashChange = () => {
    applyRobotsMeta()
    if (!isAdminPath()) {
      applySectionSeo()
    }
  }
  window.addEventListener('hashchange', onHashChange)

  return () => {
    window.removeEventListener('hashchange', onHashChange)
  }
}
