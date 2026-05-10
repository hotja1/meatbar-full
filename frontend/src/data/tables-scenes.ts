export type TableSceneMedia = {
  slug: string
  imageWebp: string
  imageWebpSm: string
  imageAvif: string
  imageAvifSm: string
}

const ASSETS = '/assets/tables'

function media(slug: string): TableSceneMedia {
  if (slug === 'hall-1-layout-png') {
    const src = `${ASSETS}/hall-1-layout.png`
    return { slug, imageWebp: src, imageWebpSm: src, imageAvif: src, imageAvifSm: src }
  }

  if (slug === 'hall-2-lounge-layout-png') {
    const src = `${ASSETS}/hall-2-lounge-layout.png`
    return { slug, imageWebp: src, imageWebpSm: src, imageAvif: src, imageAvifSm: src }
  }

  return {
    slug,
    imageWebp: `${ASSETS}/${slug}.webp`,
    imageWebpSm: `${ASSETS}/${slug}-sm.webp`,
    imageAvif: `${ASSETS}/${slug}.avif`,
    imageAvifSm: `${ASSETS}/${slug}-sm.avif`,
  }
}

const SLUG_BY_NUMBER: Record<number, string> = {
  5: 't5-6',
  6: 't5-6',
  7: 't7-8',
  8: 't7-8',
  9: 't9-11-13',
  10: 't10',
  11: 't9-11-13',
  12: 't12-was15',
  13: 't9-11-13',
  14: 't14-16',
  15: 't17-19-21',
  16: 't14-16',
  17: 't17-19-21',
  18: 't18-20',
  19: 't17-19-21',
  20: 't18-20',
  21: 't17-19-21',
  22: 't22-24',
  23: 't23-25',
  24: 't22-24',
  25: 't23-25',
  26: 't26',
  27: 't27-29',
  29: 't27-29',
  30: 't31-34-30-35',
  31: 't31-34-30-35',
  32: 't32-33',
  33: 't32-33',
  34: 't31-34-30-35',
  35: 't31-34-30-35',
}

export type TableSceneCopy = {
  kicker: string
  headline: string
  description: string
}

const copyByNumber: Record<number, TableSceneCopy> = {
  10: { kicker: 'Банкет · 8-10 мест', headline: 'Стол №10', description: 'Большой стол для компании и долгого вечера.' },
  15: { kicker: 'У окна · 3 места', headline: 'Стол №15', description: 'Тихое место у окна на 3 гостей.' },
  26: { kicker: 'Лаунж · 6 мест', headline: 'Стол №26', description: 'Круглый стол в центре второго зала.' },
  27: { kicker: 'Банкет · 8-10 мест', headline: 'Стол №27', description: 'Большой диванный стол для праздника.' },
  29: { kicker: 'Банкет · 8-10 мест', headline: 'Стол №29', description: 'Просторная посадка для большой компании.' },
}

function defaultCopy(number: number): TableSceneCopy {
  const hall = number <= 21 ? 1 : 2
  const zone =
    number === 10 || number === 27 || number === 29
      ? 'Банкет'
      : [9, 11, 12, 13, 15, 17, 19, 21, 23, 25].includes(number)
        ? 'У окна'
        : hall === 1
          ? 'Открытый гриль'
          : 'Лаунж / бар'

  return {
    kicker: `${zone} · Зал ${hall}`,
    headline: `Стол №${number}`,
    description: 'Фото и описание места обновлены под новый макет.',
  }
}

export function getTableScene(number: number): TableSceneMedia | null {
  const slug = SLUG_BY_NUMBER[number]
  return slug ? media(slug) : null
}

export function getTableSceneCopy(number: number): TableSceneCopy | null {
  return copyByNumber[number] ?? defaultCopy(number)
}

export const SCENE_TABLE_NUMBERS: ReadonlyArray<number> = Object.keys(SLUG_BY_NUMBER)
  .map((n) => Number(n))
  .sort((a, b) => a - b)
