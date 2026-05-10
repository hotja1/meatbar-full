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
  4: 'grill',
  5: 'grill',
  6: 'window',
  7: 'window',
  8: 'banquet',
  9: 'window',
  10: 'banquet',
  11: 'window',
  12: 'window',
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
  lounge: 'Лаунж-зона, спокойный ритм',
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
  4: { x: 574, y: 326, w: 88, h: 62, points: [[574, 326], [657, 333], [662, 382], [582, 388]] },
  5: { x: 590, y: 420, w: 95, h: 70, points: [[590, 420], [675, 427], [685, 485], [595, 490]] },
  6: { x: 970, y: 438, w: 246, h: 59, points: [[970, 438], [1210, 448], [1216, 496], [980, 495]] },
  7: { x: 885, y: 275, w: 200, h: 65, points: [[885, 275], [1085, 282], [1085, 333], [910, 340]] },
}

const hall2Layout: Record<number, Geo> = {
  20: { x: 668, y: 96, w: 107, h: 64, points: [[668, 96], [775, 100], [772, 160], [668, 158]] },
  18: { x: 650, y: 252, w: 125, h: 55, points: [[650, 252], [775, 256], [772, 305], [650, 302]] },
  16: { x: 650, y: 353, w: 125, h: 57, points: [[650, 353], [775, 358], [772, 410], [652, 406]] },
  14: { x: 665, y: 462, w: 108, h: 58, points: [[665, 462], [773, 466], [770, 520], [665, 518]] },
  10: { x: 650, y: 615, w: 140, h: 61, points: [[650, 615], [790, 620], [786, 676], [655, 673]] },
  8: { x: 635, y: 780, w: 170, h: 65, points: [[635, 780], [805, 788], [800, 845], [640, 842]] },
  21: { x: 1084, y: 84, w: 100, h: 62, shape: 'round' },
  19: { x: 1081, y: 191, w: 100, h: 62, shape: 'round' },
  17: { x: 1078, y: 291, w: 105, h: 64, shape: 'round' },
  15: { x: 1075, y: 394, w: 105, h: 64, shape: 'round' },
  13: { x: 1073, y: 494, w: 108, h: 68, shape: 'round' },
  12: { x: 1138, y: 596, w: 148, h: 40, points: [[1138, 596], [1286, 596], [1282, 635], [1142, 636]] },
  11: { x: 1100, y: 722, w: 162, h: 45, points: [[1100, 722], [1262, 724], [1258, 766], [1105, 767]] },
  9: { x: 1090, y: 898, w: 160, h: 48, points: [[1090, 900], [1250, 898], [1246, 944], [1095, 946]] },
}

const hall3Layout: Record<number, Geo> = {
  29: { x: 735, y: 135, w: 135, h: 57, points: [[760, 135], [870, 160], [850, 192], [735, 167]] },
  27: { x: 1030, y: 210, w: 130, h: 60, points: [[1050, 210], [1160, 235], [1140, 270], [1030, 245]] },
  30: { x: 565, y: 315, w: 120, h: 52, points: [[585, 315], [685, 337], [665, 367], [565, 345]] },
  31: { x: 715, y: 386, w: 120, h: 59, points: [[735, 386], [835, 410], [815, 445], [715, 420]] },
  35: { x: 390, y: 425, w: 155, h: 65, points: [[410, 425], [545, 455], [520, 490], [390, 460]] },
  34: { x: 580, y: 525, w: 140, h: 60, points: [[600, 525], [720, 552], [695, 585], [580, 558]] },
  32: { x: 835, y: 465, w: 135, h: 60, points: [[855, 465], [970, 490], [950, 525], [835, 500]] },
  33: { x: 760, y: 590, w: 135, h: 60, points: [[780, 590], [895, 617], [875, 650], [760, 624]] },
  26: { x: 1034, y: 405, w: 108, h: 78, shape: 'round' },
  25: { x: 883, y: 712, w: 106, h: 86, shape: 'round' },
  23: { x: 724, y: 826, w: 106, h: 86, shape: 'round' },
  22: { x: 580, y: 650, w: 88, h: 50, points: [[595, 650], [665, 670], [647, 700], [580, 680]] },
  24: { x: 405, y: 770, w: 120, h: 60, points: [[425, 770], [525, 800], [505, 830], [405, 805]] },
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
  if (table.hall === 1 || table.hall === 2) {
    const quietTables = new Set([8, 9, 10, 11, 13])
    return quietTables.has(table.number) ? 'quiet' : 'moderate'
  }
  return 'quiet'
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
