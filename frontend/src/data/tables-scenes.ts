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
  12: 't9-11-13',
  13: 't12-was15',
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
  4: { kicker: 'Зал 1 · 2 места', headline: 'Стол №4', description: 'Камерная посадка у прохода между залами для спокойного ужина вдвоем.' },
  5: { kicker: 'Зал 1 · 2 места', headline: 'Стол №5', description: 'Уютный стол в центре первого зала с мягкой атмосферой и приватностью.' },
  6: { kicker: 'Зал 1 · 4 места', headline: 'Стол №6', description: 'Диванная посадка у окна: мягкий свет и комфорт для компании из четырех.' },
  7: { kicker: 'Зал 1 · 4 места', headline: 'Стол №7', description: 'Светлая зона у окна с диванами для семейного или дружеского вечера.' },
  8: { kicker: 'Зал 2 · 4 места', headline: 'Стол №8', description: 'Просторная посадка открытого гриля с более спокойным уровнем шума.' },
  9: { kicker: 'Зал 2 · 4 места', headline: 'Стол №9', description: 'Стол у окна в глубине второго зала: тихая зона для долгого ужина.' },
  10: { kicker: 'Зал 2 · 4 места', headline: 'Стол №10', description: 'Крупная посадка в более тихой части второго зала для компании.' },
  11: { kicker: 'Зал 2 · 4 места', headline: 'Стол №11', description: 'Оконная линия со спокойным фоном и комфортной дистанцией.' },
  12: { kicker: 'Зал 2 · 4 места', headline: 'Стол №12', description: 'Диванная посадка у зеленой стены: спокойно, камерно и удобно для ужина на четверых.' },
  13: { kicker: 'Зал 2 · 2 места', headline: 'Стол №13', description: 'Круглый стол у оконной линии для пары гостей: мягкий свет, вид и более тихая посадка.' },
  14: { kicker: 'Зал 2 · 4 места', headline: 'Стол №14', description: 'Средняя линия открытого гриля с обзором и живой атмосферой кухни.' },
  15: { kicker: 'Зал 2 · 2 места', headline: 'Стол №15', description: 'Круглая посадка у окна для пары: баланс приватности и атмосферы.' },
  16: { kicker: 'Зал 2 · 4 места', headline: 'Стол №16', description: 'Удобная посадка на линии гриля с быстрым сервисом и обзором зала.' },
  17: { kicker: 'Зал 2 · 2 места', headline: 'Стол №17', description: 'Оконная зона на двоих в комфортном темпе второго зала.' },
  18: { kicker: 'Зал 2 · 4 места', headline: 'Стол №18', description: 'Центральный стол второго зала для ужина в ритме открытого гриля.' },
  19: { kicker: 'Зал 2 · 2 места', headline: 'Стол №19', description: 'Компактный стол у окна для спокойного вечернего общения.' },
  20: { kicker: 'Зал 2 · 4 места', headline: 'Стол №20', description: 'Верхняя линия гриль-зоны с удобной посадкой для компании из четырех.' },
  21: { kicker: 'Зал 2 · 2 места', headline: 'Стол №21', description: 'Круглый стол в оконной линии, комфортный формат для пары гостей.' },
  22: { kicker: 'Зал 3 · 4 места', headline: 'Стол №22', description: 'Лаунж-зал с более активной атмосферой: мягкая посадка рядом с баром.' },
  23: { kicker: 'Зал 3 · 2 места', headline: 'Стол №23', description: 'Круглый стол у окна в лаунже: камерно, но в живом ритме третьего зала.' },
  24: { kicker: 'Зал 3 · 4 места', headline: 'Стол №24', description: 'Диванная лаунж-посадка ближе к барной зоне для активного вечера.' },
  25: { kicker: 'Зал 3 · 2 места', headline: 'Стол №25', description: 'Компактная круглая посадка в шумном лаунж-зале для быстрого ужина.' },
  26: { kicker: 'Зал 3 · 6 мест', headline: 'Стол №26', description: 'Центральный круглый стол лаунжа для большой компании и яркой атмосферы.' },
  27: { kicker: 'Зал 3 · 8-10 мест', headline: 'Стол №27', description: 'Большой лаунж-стол в самом энергичном зале для праздников и встреч.' },
  29: { kicker: 'Зал 3 · 8-10 мест', headline: 'Стол №29', description: 'Широкая диванная посадка лаунжа для длинных вечеров большой компанией.' },
  30: { kicker: 'Зал 3 · 4 места', headline: 'Стол №30', description: 'Лаунж-стол в активной зоне с хорошим обзором бара и гостевого зала.' },
  31: { kicker: 'Зал 3 · 4 места', headline: 'Стол №31', description: 'Комфортная посадка в центре лаунжа для встреч в более шумной атмосфере.' },
  32: { kicker: 'Зал 3 · 4 места', headline: 'Стол №32', description: 'Барная зона лаунжа с активным звуковым фоном и динамичным ритмом.' },
  33: { kicker: 'Зал 3 · 4 места', headline: 'Стол №33', description: 'Круговая посадка рядом с баром для гостей, кто любит движение и музыку.' },
  34: { kicker: 'Зал 3 · 4 места', headline: 'Стол №34', description: 'Мягкая посадка в лаунже с быстрым доступом к барной линии и сервису.' },
  35: { kicker: 'Зал 3 · 4 места', headline: 'Стол №35', description: 'Диванный стол в активной части лаунжа для ужина в энергичном формате.' },
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
    description: 'Посадка настроена под новый зал и сценарий комфортного бронирования.',
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
