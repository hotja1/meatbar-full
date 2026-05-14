import type { MapTable } from '../components/TableMap'

const seatsByNumber: Record<number, number> = {
  4: 2,
  5: 2,
  6: 4,
  7: 4,
  8: 4,
  9: 4,
  10: 4,
  11: 4,
  12: 4,
  13: 2,
  14: 4,
  15: 2,
  16: 4,
  17: 2,
  18: 4,
  19: 2,
  20: 4,
  21: 2,
  22: 4,
  23: 2,
  24: 4,
  25: 2,
  26: 6,
  27: 8,
  29: 8,
  30: 4,
  31: 4,
  32: 4,
  33: 4,
  34: 4,
  35: 4,
}

const seatsMaxByNumber: Record<number, number> = {
  27: 10,
  29: 10,
}

const zoneByNumber: Record<number, MapTable['zone']> = {
  4: 'lounge',
  5: 'lounge',
  6: 'window',
  7: 'window',
  8: 'banquet',
  9: 'grill',
  10: 'banquet',
  11: 'grill',
  12: 'grill',
  13: 'window',
  14: 'grill',
  15: 'window',
  16: 'grill',
  17: 'window',
  18: 'grill',
  19: 'window',
  20: 'grill',
  21: 'window',
  22: 'lounge',
  23: 'window',
  24: 'lounge',
  25: 'window',
  26: 'lounge',
  27: 'lounge',
  29: 'lounge',
  30: 'lounge',
  31: 'lounge',
  32: 'bar',
  33: 'bar',
  34: 'bar',
  35: 'lounge',
}

const sceneByZone: Record<MapTable['zone'], string> = {
  window: 'У окна, мягкий свет',
  grill: 'Ближе к открытому грилю',
  bar: 'Возле бара, динамичный вечер',
  lounge: 'Уютная зона, спокойный ритм',
  banquet: 'Просторная посадка для компании',
}

type Geo = {
  x: number
  y: number
  w?: number
  h?: number
  shape?: 'rect' | 'round'
  points?: ReadonlyArray<readonly [number, number]>
  status?: MapTable['status']
}

const hall1Layout: Record<number, Geo> = {
  4: { x: 570, y: 318, w: 90, h: 57, points: [[570, 325], [651, 318], [660, 369], [580, 375]], status: 'reserved' },
  5: { x: 591, y: 449, w: 95, h: 64, points: [[591, 457], [676, 449], [686, 506], [601, 513]] },
  6: { x: 961, y: 410, w: 195, h: 67, points: [[961, 425], [1124, 410], [1156, 463], [982, 477]], status: 'held' },
  7: { x: 876, y: 248, w: 180, h: 61, points: [[876, 261], [1033, 248], [1056, 294], [893, 309]] },
}

const hall2Layout: Record<number, Geo> = {
  8: { x: 635, y: 747, w: 130, h: 54, points: [[635, 749], [762, 747], [765, 801], [637, 800]] },
  9: { x: 1162, y: 858, w: 141, h: 54, points: [[1162, 859], [1293, 858], [1303, 910], [1170, 912]] },
  10: { x: 641, y: 609, w: 120, h: 47, points: [[641, 609], [760, 609], [761, 656], [642, 656]], status: 'reserved' },
  11: { x: 1147, y: 720, w: 139, h: 49, points: [[1147, 721], [1275, 720], [1286, 768], [1158, 769]], status: 'held' },
  12: { x: 1132, y: 598, w: 125, h: 46, points: [[1132, 598], [1246, 598], [1257, 644], [1138, 642]] },
  13: { x: 1108, y: 387, w: 76, h: 66, shape: 'round' },
  14: { x: 676, y: 436, w: 86, h: 49, points: [[676, 439], [759, 436], [762, 482], [677, 485]] },
  15: { x: 1099, y: 309, w: 76, h: 62, shape: 'round' },
  16: { x: 680, y: 293, w: 78, h: 49, points: [[680, 295], [755, 293], [758, 339], [682, 342]] },
  17: { x: 1091, y: 238, w: 70, h: 54, shape: 'round' },
  18: { x: 671, y: 229, w: 90, h: 45, points: [[671, 230], [756, 229], [761, 274], [673, 274]] },
  19: { x: 1085, y: 169, w: 70, h: 52, shape: 'round' },
  20: { x: 673, y: 97, w: 90, h: 42, points: [[673, 98], [761, 97], [763, 139], [674, 139]] },
  21: { x: 1076, y: 106, w: 70, h: 50, shape: 'round' },
}

const hall3Layout: Record<number, Geo> = {
  22: { x: 576, y: 619, w: 104, h: 70, points: [[624, 619], [680, 645], [631, 689], [576, 663]] },
  23: { x: 754, y: 824, w: 78, h: 68, shape: 'round' },
  24: { x: 477, y: 733, w: 90, h: 75, points: [[519, 733], [567, 762], [523, 808], [477, 772]] },
  25: { x: 872, y: 738, w: 70, h: 66, shape: 'round' },
  26: { x: 1026, y: 386, w: 94, h: 72, shape: 'round', status: 'reserved' },
  27: { x: 991, y: 184, w: 138, h: 79, points: [[1025, 184], [1129, 235], [1102, 263], [991, 214]] },
  29: { x: 760, y: 116, w: 141, h: 79, points: [[791, 116], [901, 162], [870, 195], [760, 143]] },
  30: { x: 618, y: 287, w: 93, h: 65, points: [[662, 287], [711, 307], [659, 352], [618, 332]] },
  31: { x: 744, y: 341, w: 93, h: 68, points: [[795, 341], [837, 359], [785, 409], [744, 387]] },
  32: { x: 865, y: 403, w: 94, h: 68, points: [[908, 403], [959, 425], [912, 471], [865, 450]] },
  33: { x: 778, y: 508, w: 99, h: 74, points: [[830, 508], [877, 536], [826, 582], [778, 559]] },
  34: { x: 615, y: 451, w: 100, h: 71, points: [[667, 451], [715, 476], [659, 522], [615, 498]] },
  35: { x: 454, y: 365, w: 106, h: 76, points: [[512, 365], [560, 390], [501, 441], [454, 420]] },
}

function buildTable(num: number, hall: 1 | 2 | 3, geo: Geo): MapTable {
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
    points: geo.points,
    scene: sceneByZone[zone],
  }
}

export const realisticTables: MapTable[] = [
  ...Object.entries(hall1Layout).map(([n, g]) => buildTable(Number(n), 1, g)),
  ...Object.entries(hall2Layout).map(([n, g]) => buildTable(Number(n), 2, g)),
  ...Object.entries(hall3Layout).map(([n, g]) => buildTable(Number(n), 3, g)),
]

export const TOP_TABLES: ReadonlySet<number> = new Set([10, 27, 29, 32, 33, 34, 35])

export type TableNoise = 'quiet' | 'moderate' | 'lively'

export function getTableNoise(table: MapTable): TableNoise {
  if (table.hall === 3) return 'lively'
  if (table.hall === 1) return 'quiet'
  if (table.hall === 2) {
    const quietTables = new Set([8, 9, 10, 11, 13])
    return quietTables.has(table.number) ? 'quiet' : 'moderate'
  }
  return 'quiet'
}

export function formatSeats(seats: number, seatsMax?: number): string {
  const min = seats
  const max = seatsMax && seatsMax > seats ? seatsMax : seats
  const value = min === max ? `${min}` : `${min}-${max}`
  return `до ${value} человек`
}
