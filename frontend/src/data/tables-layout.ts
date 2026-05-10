import type { MapTable } from '../components/TableMap'

const seatsByNumber: Record<number, number> = {
  5: 4, 6: 4, 7: 4, 8: 4,
  9: 4, 10: 8, 11: 4, 12: 3, 13: 4, 14: 4, 15: 3, 16: 4, 17: 3, 18: 4, 19: 2, 20: 4, 21: 2,
  22: 4, 23: 2, 24: 4, 25: 2, 26: 6, 27: 8, 29: 8, 30: 4, 31: 4, 32: 4, 33: 4, 34: 4, 35: 4,
}

const seatsMaxByNumber: Record<number, number> = {
  10: 10, 27: 10, 29: 10, 30: 5, 31: 5, 32: 5, 34: 5, 35: 5,
}

const zoneByNumber: Record<number, MapTable['zone']> = {
  5: 'grill', 6: 'grill', 7: 'grill', 8: 'grill',
  9: 'window', 10: 'banquet', 11: 'window', 12: 'window', 13: 'window', 14: 'banquet',
  15: 'window', 16: 'grill', 17: 'window', 18: 'grill', 19: 'window', 20: 'grill', 21: 'window',
  22: 'lounge', 23: 'window', 24: 'lounge', 25: 'window', 26: 'lounge', 27: 'lounge', 29: 'lounge',
  30: 'lounge', 31: 'lounge', 32: 'bar', 33: 'bar', 34: 'bar', 35: 'lounge',
}

const sceneByZone: Record<MapTable['zone'], string> = {
  window: 'У окна, мягкий свет',
  grill: 'Ближе к открытому грилю',
  bar: 'Возле бара, динамичный вечер',
  lounge: 'Лаунж-зона, спокойный ритм',
  banquet: 'Большой стол для компании',
}

type Geo = {
  x: number
  y: number
  w?: number
  h?: number
  shape?: 'rect' | 'round'
  status?: MapTable['status']
}

// Координаты в реальном размере рендера схемы: 1448x1086.
const hall1Layout: Record<number, Geo> = {
  // Временно выключенные столы (не показываем в public map).
  5: { x: 120, y: 190, w: 72, h: 62, status: 'disabled' },
  6: { x: 200, y: 190, w: 72, h: 62, status: 'disabled' },
  7: { x: 200, y: 260, w: 72, h: 62, status: 'disabled' },
  8: { x: 120, y: 260, w: 72, h: 62, status: 'disabled' },

  21: { x: 1000, y: 132, w: 94, h: 76, shape: 'round' },
  19: { x: 1000, y: 204, w: 94, h: 76, shape: 'round' },
  17: { x: 1000, y: 276, w: 94, h: 76, shape: 'round' },
  15: { x: 1000, y: 356, w: 94, h: 76, shape: 'round' },
  12: { x: 1000, y: 442, w: 94, h: 76, shape: 'round' },

  20: { x: 590, y: 112, w: 152, h: 60 },
  18: { x: 590, y: 188, w: 152, h: 60 },
  16: { x: 590, y: 274, w: 152, h: 60 },
  14: { x: 590, y: 364, w: 152, h: 60 },
  10: { x: 580, y: 515, w: 178, h: 196 },

  13: { x: 1040, y: 545, w: 168, h: 78 },
  11: { x: 1040, y: 642, w: 168, h: 78 },
  9: { x: 1040, y: 740, w: 168, h: 78 },
}

const hall2Layout: Record<number, Geo> = {
  29: { x: 730, y: 108, w: 194, h: 76 },
  27: { x: 958, y: 172, w: 194, h: 76 },

  30: { x: 574, y: 276, w: 152, h: 84 },
  31: { x: 706, y: 326, w: 152, h: 84 },
  35: { x: 424, y: 362, w: 152, h: 84 },
  34: { x: 574, y: 448, w: 152, h: 84 },
  32: { x: 830, y: 390, w: 152, h: 86 },
  33: { x: 734, y: 530, w: 152, h: 86 },

  26: { x: 996, y: 364, w: 114, h: 102, shape: 'round' },
  25: { x: 904, y: 582, w: 92, h: 84, shape: 'round' },
  23: { x: 752, y: 802, w: 100, h: 92, shape: 'round' },
  22: { x: 560, y: 646, w: 142, h: 76 },
  24: { x: 448, y: 760, w: 142, h: 76 },
}

function buildTable(num: number, hall: 1 | 2, geo: Geo): MapTable {
  const zone = zoneByNumber[num] ?? 'lounge'
  return {
    id: num,
    number: num,
    hall,
    zone,
    seats: seatsByNumber[num] ?? 4,
    seatsMax: seatsMaxByNumber[num],
    status: geo.status ?? 'free',
    x: geo.x,
    y: geo.y,
    width: geo.w ?? 70,
    height: geo.h ?? 60,
    shape: geo.shape ?? 'rect',
    scene: sceneByZone[zone],
  }
}

export const realisticTables: MapTable[] = [
  ...Object.entries(hall1Layout).map(([n, g]) => buildTable(Number(n), 1, g)),
  ...Object.entries(hall2Layout).map(([n, g]) => buildTable(Number(n), 2, g)),
]

export const TOP_TABLES: ReadonlySet<number> = new Set([10, 15, 27, 29, 32, 33, 34, 35])

export type TableNoise = 'тихо' | 'умеренно' | 'живо'

export function getTableNoise(table: MapTable): TableNoise {
  const cx = table.x + table.width / 2
  const cy = table.y + table.height / 2
  const center = table.hall === 1 ? { x: 670, y: 330 } : { x: 760, y: 430 }
  const d = Math.hypot(cx - center.x, cy - center.y)
  if (d < 220) return 'живо'
  if (d < 450) return 'умеренно'
  return 'тихо'
}

export function formatSeats(seats: number, seatsMax?: number): string {
  const min = seats
  const max = seatsMax && seatsMax > seats ? seatsMax : seats
  const value = min === max ? `${min}` : `${min}-${max}`
  const last = max % 10
  const lastTwo = max % 100
  let unit = 'мест'
  if (last === 1 && lastTwo !== 11) unit = 'место'
  else if ([2, 3, 4].includes(last) && ![12, 13, 14].includes(lastTwo)) unit = 'места'
  return `${value} ${unit}`
}
