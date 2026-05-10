export type TableSceneMedia = {
  slug: string
  imageWebp: string
  imageWebpSm: string
  imageAvif: string
  imageAvifSm: string
}

const ASSETS = '/assets/tables'

function media(slug: string): TableSceneMedia {
  return {
    slug,
    imageWebp: `${ASSETS}/${slug}.webp`,
    imageWebpSm: `${ASSETS}/${slug}-sm.webp`,
    imageAvif: `${ASSETS}/${slug}.avif`,
    imageAvifSm: `${ASSETS}/${slug}-sm.avif`,
  }
}

const SLUG_BY_NUMBER: Record<number, string> = {
  4: 't4',
  5: 't5',
  6: 't6',
  7: 't7',
  8: 't8',
  9: 't9-11-13',
  10: 't10-new',
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
  4: {
    kicker: 'Зал 1 · 2 места',
    headline: 'Стол №4',
    description: 'Тихий стол в первом зале: удобно для пары и спокойного ужина.',
  },
  5: {
    kicker: 'Зал 1 · 2 места',
    headline: 'Стол №5',
    description: 'Камерная посадка с живой атмосферой зала и комфортной дистанцией.',
  },
  6: {
    kicker: 'Зал 1 · 4 места',
    headline: 'Стол №6',
    description: 'Мягкая зона у окна: приватно, уютно, удобно для компании из четырёх.',
  },
  7: {
    kicker: 'Зал 1 · 4 места',
    headline: 'Стол №7',
    description: 'Светлая диванная посадка у окна для семейного или дружеского вечера.',
  },
  8: {
    kicker: 'Зал 2 · 4 места',
    headline: 'Стол №8',
    description: 'Просторный стол в открытом гриле: тепло, ритм кухни и комфортная посадка.',
  },
  10: {
    kicker: 'Зал 2 · 4 места',
    headline: 'Стол №10',
    description: 'Центральная посадка в зоне гриля: для ужина в фокусе атмосферы зала.',
  },
  27: {
    kicker: 'Зал 3 · 8-10 мест',
    headline: 'Стол №27',
    description: 'Большой диванный стол в лаунже для праздников и больших встреч.',
  },
  29: {
    kicker: 'Зал 3 · 8-10 мест',
    headline: 'Стол №29',
    description: 'Просторная лаунж-посадка с приватной атмосферой и мягким светом.',
  },
}

function defaultCopy(number: number): TableSceneCopy {
  const hall = number <= 7 ? 1 : number <= 21 ? 2 : 3
  const zone =
    number === 27 || number === 29
      ? 'Лаунж'
      : [6, 7, 9, 11, 12, 13, 15, 17, 19, 21, 23, 25].includes(number)
        ? 'У окна'
        : hall === 2
          ? 'Открытый гриль'
          : hall === 3
            ? 'Лаунж / бар'
            : 'Первый зал'

  return {
    kicker: `${zone} · Зал ${hall}`,
    headline: `Стол №${number}`,
    description: 'Фото и описание столика обновлены под новый визуальный макет.',
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
