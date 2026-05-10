import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
export const db = new Database(config.dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  weight TEXT,
  price INTEGER NOT NULL,
  description TEXT,
  image TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT 'window',
  seats INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'free',
  x REAL NOT NULL DEFAULT 50,
  y REAL NOT NULL DEFAULT 50,
  scene TEXT,
  notes TEXT,
  hall INTEGER,
  number INTEGER,
  width REAL,
  height REAL,
  shape TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  table_title TEXT NOT NULL,
  guests INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  name TEXT,
  total INTEGER NOT NULL,
  payment TEXT NOT NULL DEFAULT 'pending',
  delivery TEXT NOT NULL DEFAULT 'pickup',
  address TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  yookassa_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS phone_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL
);
`

db.exec(SCHEMA)

for (const statement of [
  'ALTER TABLE tables ADD COLUMN hall INTEGER',
  'ALTER TABLE tables ADD COLUMN number INTEGER',
  'ALTER TABLE tables ADD COLUMN width REAL',
  'ALTER TABLE tables ADD COLUMN height REAL',
  'ALTER TABLE tables ADD COLUMN shape TEXT',
]) {
  try {
    db.exec(statement)
  } catch (err) {
    if (!String(err).includes('duplicate column name')) throw err
  }
}

export function bootstrap() {
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM admins').get().c
  if (adminCount === 0) {
    const hash = bcrypt.hashSync(config.adminBootstrapPassword, 10)
    db.prepare(
      'INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)',
    ).run('admin', hash, 'owner')
    console.log('[db] bootstrapped admin user "admin" with bootstrap password')
  }

  const contentRow = db.prepare('SELECT data FROM site_content WHERE id = 1').get()
  if (!contentRow) {
    const data = JSON.stringify({
      hero: {
        chapter: 'Come on over · Нижневартовск',
        title: 'Гриль-культура внутри Мясо Бар.',
        subtitle:
          'Путь через дым, мясо, северные вкусы и зал, где столик выбирают так же внимательно, как стейк.',
      },
      contacts: {
        phone: '+7 (912) 907-47-47',
        address: 'Нижневартовск, ТРЦ ЮграМолл, 3 этаж, ул. Ленина, 15П',
        hours: 'Ежедневно с 11:00 до 24:00',
        instagram: 'https://www.instagram.com/meatbar_nv/',
        vk: 'https://vk.com/meatbar_nv',
      },
      legal:
        'Исполнитель: ООО «РЕСТАРТ», 628616, Нижневартовск, ул. Кузоваткина, 17, оф. 3, ИНН 8603254440, ОГРН 1258600009073.',
    })
    db.prepare('INSERT INTO site_content (id, data) VALUES (1, ?)').run(data)
  }

  const tableCount = db.prepare('SELECT COUNT(*) as c FROM tables').get().c
  if (tableCount === 0) {
    // Phase 9 layout (May 2026): bar столы 1–4 удалены, 28 удалён.
    // Перенумерация: бывший 15 → 12 (3 чел., у окна), бывший 12 → 17
    // (3 чел., у окна). 10 — банкет 8–10. 27/29 — банкет 8–10.
    // 30/31/32/34/35 — 4–5 чел., 33 — 4 чел., 26 — 6 чел. круглый.
    const seedTables = [
      // Hall 1 — окно (21 19 17 12 13 11 9 / 8 7) и середина (20 18 16 14 10 5 6).
      { id: 21, hall: 1, number: 21, title: 'Стол №21', zone: 'window', seats: 2, status: 'free', x: 62, y: 90, width: 58, height: 54, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 19, hall: 1, number: 19, title: 'Стол №19', zone: 'window', seats: 2, status: 'free', x: 166, y: 90, width: 58, height: 54, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 17, hall: 1, number: 17, title: 'Стол №17', zone: 'window', seats: 3, status: 'free', x: 274, y: 86, width: 58, height: 66, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 12, hall: 1, number: 12, title: 'Стол №12', zone: 'window', seats: 3, status: 'free', x: 386, y: 86, width: 58, height: 66, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 13, hall: 1, number: 13, title: 'Стол №13', zone: 'window', seats: 4, status: 'free', x: 488, y: 86, width: 58, height: 76, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 11, hall: 1, number: 11, title: 'Стол №11', zone: 'window', seats: 4, status: 'free', x: 560, y: 86, width: 58, height: 76, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 9,  hall: 1, number: 9,  title: 'Стол №9',  zone: 'window', seats: 4, status: 'free', x: 632, y: 86, width: 58, height: 76, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 8,  hall: 1, number: 8,  title: 'Стол №8',  zone: 'grill',  seats: 4, status: 'disabled', x: 736, y: 86, width: 58, height: 76, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 7,  hall: 1, number: 7,  title: 'Стол №7',  zone: 'grill',  seats: 4, status: 'disabled', x: 842, y: 86, width: 58, height: 76, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 20, hall: 1, number: 20, title: 'Стол №20', zone: 'grill',  seats: 4, status: 'free',  x: 88,  y: 240, width: 64, height: 60, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 18, hall: 1, number: 18, title: 'Стол №18', zone: 'grill',  seats: 4, status: 'free',  x: 166, y: 240, width: 64, height: 60, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 16, hall: 1, number: 16, title: 'Стол №16', zone: 'grill',  seats: 4, status: 'free',  x: 274, y: 240, width: 64, height: 60, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 14, hall: 1, number: 14, title: 'Стол №14', zone: 'banquet', seats: 4, status: 'held', x: 384, y: 240, width: 62, height: 62, shape: 'rect', scene: 'большой стол для компании' },
      { id: 15, hall: 1, number: 15, title: 'Стол №15', zone: 'window', seats: 3, status: 'free', x: 386, y: 162, width: 58, height: 66, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 10, hall: 1, number: 10, title: 'Стол №10', zone: 'banquet', seats: 8, status: 'free', x: 540, y: 232, width: 188, height: 78, shape: 'rect', scene: 'большой стол для компании' },
      { id: 5,  hall: 1, number: 5,  title: 'Стол №5',  zone: 'grill', seats: 4, status: 'disabled', x: 794, y: 240, width: 72, height: 64, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },
      { id: 6,  hall: 1, number: 6,  title: 'Стол №6',  zone: 'grill', seats: 4, status: 'disabled', x: 884, y: 240, width: 72, height: 64, shape: 'rect', scene: 'ближе к гриль-кухне и аромату дыма' },

      // Hall 2 — круглый 26 (6), окно 25/23 (2) и 24/22 (4), банкет 27/29 (8–10), мид 32/33/31/34/30/35 (4–5).
      { id: 26, hall: 2, number: 26, title: 'Стол №26', zone: 'lounge', seats: 6, status: 'free', x: 342, y: 86, width: 132, height: 132, shape: 'round', scene: 'диваны, лампы и спокойная зона' },
      { id: 25, hall: 2, number: 25, title: 'Стол №25', zone: 'window', seats: 2, status: 'free', x: 714, y: 96, width: 70, height: 58, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 23, hall: 2, number: 23, title: 'Стол №23', zone: 'window', seats: 2, status: 'free', x: 844, y: 96, width: 70, height: 58, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 24, hall: 2, number: 24, title: 'Стол №24', zone: 'window', seats: 4, status: 'reserved', x: 714, y: 190, width: 70, height: 72, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 22, hall: 2, number: 22, title: 'Стол №22', zone: 'window', seats: 4, status: 'free',     x: 844, y: 190, width: 70, height: 72, shape: 'rect', scene: 'у окна, мягкий вечерний свет' },
      { id: 27, hall: 2, number: 27, title: 'Стол №27', zone: 'lounge', seats: 8, status: 'free', x: 88, y: 196, width: 86, height: 168, shape: 'rect', scene: 'большой стол для компании, диваны и лампы' },
      { id: 32, hall: 2, number: 32, title: 'Стол №32', zone: 'lounge', seats: 4, status: 'held', x: 366, y: 320, width: 124, height: 62, shape: 'rect', scene: 'диваны, лампы и спокойная зона' },
      { id: 33, hall: 2, number: 33, title: 'Стол №33', zone: 'bar',    seats: 4, status: 'free', x: 614, y: 320, width: 124, height: 62, shape: 'rect', scene: 'возле бара, динамичный вечер' },
      { id: 31, hall: 2, number: 31, title: 'Стол №31', zone: 'lounge', seats: 4, status: 'free', x: 366, y: 420, width: 124, height: 62, shape: 'rect', scene: 'диваны, лампы и спокойная зона' },
      { id: 34, hall: 2, number: 34, title: 'Стол №34', zone: 'bar',    seats: 4, status: 'free', x: 614, y: 420, width: 124, height: 62, shape: 'rect', scene: 'возле бара, динамичный вечер' },
      { id: 29, hall: 2, number: 29, title: 'Стол №29', zone: 'lounge', seats: 8, status: 'free', x: 88, y: 410, width: 86, height: 162, shape: 'rect', scene: 'большой стол для компании, диваны и лампы' },
      { id: 30, hall: 2, number: 30, title: 'Стол №30', zone: 'lounge', seats: 4, status: 'free', x: 366, y: 510, width: 124, height: 62, shape: 'rect', scene: 'диваны, лампы и спокойная зона' },
      { id: 35, hall: 2, number: 35, title: 'Стол №35', zone: 'bar',    seats: 4, status: 'free', x: 614, y: 510, width: 124, height: 62, shape: 'rect', scene: 'возле бара, динамичный вечер' },
    ]
    const stmt = db.prepare(
      `INSERT INTO tables (id, title, zone, seats, status, x, y, scene, hall, number, width, height, shape)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const tx = db.transaction((rows) => {
      for (const r of rows) {
        stmt.run(r.id, r.title, r.zone, r.seats, r.status, r.x, r.y, r.scene, r.hall, r.number, r.width, r.height, r.shape)
      }
    })
    tx(seedTables)
  }
  ensureTableMigrationV1()
  ensureTableMigrationV2()
  cleanupLegacyLightModeSettings()

  const categoryCount = db.prepare('SELECT COUNT(*) as c FROM menu_categories').get().c
  if (categoryCount === 0) {
    seedMenu()
  }
}

function ensureTableMigrationV1() {
  const key = 'migration.tables.v1.table15_and_disable_5_8'
  const marker = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  if (marker?.value === 'done') return

  const has15 = db.prepare('SELECT id FROM tables WHERE number = 15 LIMIT 1').get()
  if (!has15) {
    db.prepare(
      `INSERT INTO tables (title, zone, seats, status, x, y, scene, hall, number, width, height, shape)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'Стол №15',
      'window',
      3,
      'free',
      386,
      162,
      'у окна, мягкий вечерний свет',
      1,
      15,
      58,
      66,
      'rect',
    )
  }

  db.prepare("UPDATE tables SET status = 'disabled' WHERE number IN (5, 6, 7, 8)").run()

  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, 'done', datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key)
}

function ensureTableMigrationV2() {
  const key = 'migration.tables.v2.booking_halls_refresh'
  const marker = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  if (marker?.value === 'done') return

  const tx = db.transaction(() => {
    const has4 = db.prepare('SELECT id FROM tables WHERE number = 4 LIMIT 1').get()
    if (!has4) {
      db.prepare(
        `INSERT INTO tables (title, zone, seats, status, x, y, scene, hall, number, width, height, shape)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        'Стол №4',
        'grill',
        2,
        'free',
        560,
        320,
        'ближе к открытому грилю',
        1,
        4,
        102,
        62,
        'rect',
      )
    }

    const updateByNumber = db.prepare(
      `UPDATE tables
       SET hall = ?,
           zone = ?,
           seats = ?,
           status = ?,
           x = ?,
           y = ?,
           width = ?,
           height = ?,
           shape = ?,
           scene = ?
       WHERE number = ?`,
    )

    const rows = [
      [1, 'grill', 2, 'free', 560, 320, 102, 62, 'rect', 'ближе к открытому грилю', 4],
      [1, 'grill', 2, 'free', 586, 472, 106, 66, 'rect', 'ближе к открытому грилю', 5],
      [1, 'window', 4, 'free', 946, 442, 214, 82, 'rect', 'у окна, мягкий свет', 6],
      [1, 'window', 4, 'free', 930, 258, 226, 84, 'rect', 'у окна, мягкий свет', 7],

      [2, 'banquet', 4, 'free', 612, 740, 224, 106, 'rect', 'просторная посадка для компании', 8],
      [2, 'window', 4, 'free', 1054, 818, 180, 96, 'rect', 'у окна, мягкий свет', 9],
      [2, 'banquet', 4, 'free', 612, 590, 224, 108, 'rect', 'просторная посадка для компании', 10],
      [2, 'window', 4, 'free', 1054, 693, 180, 96, 'rect', 'у окна, мягкий свет', 11],
      [2, 'window', 4, 'free', 1054, 564, 180, 94, 'rect', 'у окна, мягкий свет', 12],
      [2, 'window', 2, 'free', 1026, 426, 120, 90, 'round', 'у окна, мягкий свет', 13],
      [2, 'grill', 4, 'free', 642, 420, 176, 66, 'rect', 'ближе к открытому грилю', 14],
      [2, 'window', 2, 'free', 1026, 343, 120, 90, 'round', 'у окна, мягкий свет', 15],
      [2, 'grill', 4, 'free', 642, 307, 176, 64, 'rect', 'ближе к открытому грилю', 16],
      [2, 'window', 2, 'free', 1026, 262, 120, 90, 'round', 'у окна, мягкий свет', 17],
      [2, 'grill', 4, 'free', 642, 205, 176, 64, 'rect', 'ближе к открытому грилю', 18],
      [2, 'window', 2, 'free', 1026, 182, 120, 90, 'round', 'у окна, мягкий свет', 19],
      [2, 'grill', 4, 'free', 642, 104, 176, 64, 'rect', 'ближе к открытому грилю', 20],
      [2, 'window', 2, 'free', 1026, 104, 120, 90, 'round', 'у окна, мягкий свет', 21],

      [3, 'lounge', 4, 'free', 560, 646, 142, 76, 'rect', 'лаунж-зона, спокойный ритм', 22],
      [3, 'window', 2, 'free', 752, 802, 100, 92, 'round', 'у окна, мягкий свет', 23],
      [3, 'lounge', 4, 'reserved', 448, 760, 142, 76, 'rect', 'лаунж-зона, спокойный ритм', 24],
      [3, 'window', 2, 'free', 904, 582, 92, 84, 'round', 'у окна, мягкий свет', 25],
      [3, 'lounge', 6, 'free', 996, 364, 114, 102, 'round', 'лаунж-зона, спокойный ритм', 26],
      [3, 'lounge', 8, 'free', 958, 172, 194, 76, 'rect', 'лаунж-зона, спокойный ритм', 27],
      [3, 'lounge', 8, 'free', 730, 108, 194, 76, 'rect', 'лаунж-зона, спокойный ритм', 29],
      [3, 'lounge', 4, 'free', 574, 276, 152, 84, 'rect', 'лаунж-зона, спокойный ритм', 30],
      [3, 'lounge', 4, 'free', 706, 326, 152, 84, 'rect', 'лаунж-зона, спокойный ритм', 31],
      [3, 'bar', 4, 'held', 830, 390, 152, 86, 'rect', 'возле бара, динамичный вечер', 32],
      [3, 'bar', 4, 'free', 734, 530, 152, 86, 'rect', 'возле бара, динамичный вечер', 33],
      [3, 'bar', 4, 'free', 574, 448, 152, 84, 'rect', 'возле бара, динамичный вечер', 34],
      [3, 'lounge', 4, 'free', 424, 362, 152, 84, 'rect', 'лаунж-зона, спокойный ритм', 35],
    ]

    for (const row of rows) {
      updateByNumber.run(...row)
    }
  })

  tx()

  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, 'done', datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key)
}

function cleanupLegacyLightModeSettings() {
  const legacyKeys = [
    'floorplan_mode',
    'floorplan_light_mode',
    'booking_floor_mode',
    'booking_floor_light_mode',
    'ui_light_mode',
    'ui_day_night_auto',
  ]
  const del = db.prepare('DELETE FROM settings WHERE key = ?')
  const tx = db.transaction((keys) => {
    for (const key of keys) del.run(key)
  })
  tx(legacyKeys)
}

function seedMenu() {
  // Mirrors src/data/menu.ts (initial seed; admin can edit afterward).
  const seed = [
    {
      name: 'Бургеры',
      items: [
        { title: 'Ореховый цыплёнок', weight: '370 г', price: 696, description: 'Сочный куриный шницель, плавленый чеддер, запечённый перец и красный лук, хрустящий романо, ореховый соус и арахис в мягкой булочке' },
        { title: 'Мраморная говядина', weight: '320 г', price: 796, description: 'Котлета из мраморной говядины с чеддером, томатами, маринованными огурцами и романо, с соусом барбекю и брусничным соусом' },
        { title: 'Рваная свинина', weight: '320 г', price: 796, description: 'Рваная свинина с моцареллой, свежими томатами, романо, маринованными огурцами и красным луком под соусом барбекю' },
        { title: 'Рваная говядина', weight: '320 г', price: 796, description: 'Томлёная говядина с чеддером, томатами, романо, маринованными огурцами и красным луком под соусами барбекю и терияки' },
        { title: 'Бургер с брискетом', weight: '370 г', price: 696, description: 'Говяжий брискет, моцарелла, томаты, романо, маринованные огурцы и красный лук с соусом барбекю' },
      ],
    },
    {
      name: 'Холодные закуски',
      items: [
        { title: 'Мясной сет', weight: '320 г', price: 1396 },
        { title: 'Сырный сет', weight: '190 г', price: 836, description: 'Дор блю, моцарелла, чеддер и пармезан. Подаётся с мёдом, орехами и виноградом' },
        { title: 'Ассорти сала', weight: '270 г', price: 516, description: 'Ароматное сало с маринованными огурцами, зелёным луком и зернистой горчицей' },
        { title: 'Альтернативный ростбиф', weight: '140 г', price: 686 },
        { title: 'Подкопчёная утиная грудка', weight: '160 г', price: 606 },
        { title: 'Грузди со сметаной', weight: '150 г', price: 536 },
        { title: 'Лосось слабосолёный', weight: '100 г', price: 816 },
        { title: 'Тартар из говядины', weight: '150 г', price: 766, description: 'С печёными перцами на подкопчёной мозговой косточке' },
        { title: 'Тартар из тунца с авокадо', weight: '150 г', price: 596 },
      ],
    },
    {
      name: 'Горячие закуски',
      items: [
        { title: 'Чесночные гренки', weight: '230 г', price: 236 },
        { title: 'Крылья копчёные', weight: '280 г', price: 436 },
        { title: 'Крылья BBQ', weight: '280 г', price: 436 },
        { title: 'Сырные палочки', weight: '230 г', price: 456 },
        { title: 'Жареный камамбер', weight: '190 г', price: 686, description: 'Соус из чёрной смородины' },
        { title: 'Стрипсы из говядины', weight: '180 г', price: 556, description: 'Соус Каролина Рипер' },
      ],
    },
    {
      name: 'Салаты',
      items: [
        { title: 'Цезарь с курицей', weight: '180 г', price: 516, description: 'Куриная грудка, романо и айсберг, томаты черри, пармезан и хрустящие крутоны под соусом Цезарь' },
        { title: 'Цезарь с креветками', weight: '200 г', price: 586, description: 'Креветки с миксом свежих листьев, томатами черри, пармезаном, крутонами и соусом Цезарь', featured: true },
        { title: 'Из жареных баклажанов с томатами и кунжутным кремом', weight: '190 г', price: 586, description: 'Баклажаны с томатами, красным луком, свежей кинзой и кунжутным кремом' },
        { title: 'С утиной грудкой', weight: '210 г', price: 566, description: 'Подкопчённое утиное филе с миксом свежих листьев, фасолью, томатами черри и горчично-апельсиновой заправкой' },
        { title: 'С олениной и вяленой клюквой', weight: '190 г', price: 716, description: 'Оленина, свежие листья, печёная свёкла, шампиньоны, вяленая клюква, кедровые орехи и соус винегрет' },
        { title: 'С тунцом, печёными цуккини и имбирной заправкой', weight: '210 г', price: 586, featured: true },
        { title: 'С креветками и авокадо', weight: '250 г', price: 716 },
        { title: 'С лососем и сырным муссом', weight: '190 г', price: 716 },
        { title: 'Овощной с мягким сыром', weight: '190 г', price: 516 },
      ],
    },
    {
      name: 'Горячее',
      items: [
        { title: 'Голень барашка', weight: '450 г', price: 1416 },
        { title: 'Томлёное ребро говядины', weight: '370 г', price: 1156 },
        { title: 'Рванина из говядины с картофельным пюре', weight: '330 г', price: 816 },
        { title: 'Томлёная рулька', weight: '1070 г', price: 856 },
        { title: 'Жарёха с картофелем и свининой', weight: '350 г', price: 596 },
        { title: 'Жарёха с картофелем и бараниной', weight: '350 г', price: 796 },
        { title: 'Мидии', weight: '340 г', price: 886, description: 'В сырно-сливочном соусе' },
        { title: 'Befstroganov с грибами', weight: '340 г', price: 656 },
        { title: 'Brisket с пюре', weight: '300 г', price: 896, featured: true },
        { title: 'Говяжьи щёчки', weight: '310 г', price: 796, description: 'В соусе «Портвейн» с картофельным пюре и шпинатом' },
        { title: 'Пельмени говяжьи', weight: '230 г', price: 496 },
        { title: 'Щучьи котлеты с картофельным пюре', weight: '300 г', price: 686 },
        { title: 'Котлеты из оленины', weight: '180 г', price: 836, description: 'С соусом из чёрной смородины', featured: true },
        { title: 'Жарёха с олениной', weight: '350 г', price: 836 },
        { title: 'Жарёха с телячьей покромкой и опятами', weight: '350 г', price: 896 },
        { title: 'Домашние котлеты с картофельным пюре', weight: '300 г', price: 596 },
      ],
    },
    {
      name: 'Супы',
      items: [
        { title: 'Рамен', weight: '350 г', price: 696, description: 'С рёберным мясом' },
        { title: 'Borshch', weight: '300 г', price: 556, description: 'С чесночными гренками и салом' },
        { title: 'Solyanka', weight: '300 г', price: 586 },
        { title: 'Норвежская уха', weight: '300 г', price: 546 },
        { title: 'Том Ям', weight: '390 г', price: 696 },
        { title: 'Сырный суп', weight: '400 г', price: 536, description: 'С халапеньо и свиными рёбрышками' },
      ],
    },
    {
      name: 'На гриле с дымком',
      items: [
        { title: 'Рибай', weight: '220 г', price: 1816 },
        { title: 'Стейк из говяжьей вырезки', weight: '220 г', price: 1816 },
        { title: 'Стейк из свинины', weight: '350 г', price: 886, description: 'С картофелем бейби', featured: true },
        { title: 'Стейк из тунца', weight: '300 г', price: 996, description: 'С творожным муссом на свекольном фрише с цветной капустой гриль' },
        { title: 'Стриплойн', weight: '250 г', price: 2756 },
        { title: 'Колбаски из свинины', weight: '350 г', price: 616, description: 'С тушёной капустой' },
        { title: 'Колбаски из говядины', weight: '320 г', price: 796 },
        { title: 'Колбаски из птицы', weight: '350 г', price: 616 },
      ],
    },
    {
      name: 'Свиные рёбра',
      items: [
        { title: 'Cheetos', weight: '450 г', price: 836, description: 'С бейби картофелем и коул-слоу' },
        { title: 'BBQ', weight: '450 г', price: 836, featured: true },
        { title: 'В сосновой глазури с мёдом', weight: '450 г', price: 836 },
        { title: 'Губы Гудбай', weight: '450 г', price: 836, description: 'В жгучей перечной глазури' },
      ],
    },
    {
      name: 'Основное с гриля',
      items: [
        { title: 'Буженина с бейби картофелем', weight: '250 г', price: 626 },
        { title: 'Бифштекс с яйцом', weight: '320 г', price: 816 },
        { title: 'Язык с грибным соусом', weight: '250 г', price: 886 },
        { title: 'Dorado на гриле', weight: '250 г', price: 1156 },
      ],
    },
    {
      name: 'Картофельные вафли',
      items: [
        { title: 'Со слабосолёным лососем', weight: '320 г', price: 696 },
        { title: 'С копчёной утиной грудкой', weight: '320 г', price: 566 },
        { title: 'С овощным рататуем', weight: '320 г', price: 486 },
      ],
    },
    {
      name: 'Гарниры',
      items: [
        { title: 'Картофель фри', weight: '150 г', price: 236 },
        { title: 'Мексиканский овощной гарнир', weight: '150 г', price: 236 },
        { title: 'Овощи на гриле', weight: '150 г', price: 236 },
        { title: 'Картофельное пюре', price: 166 },
        { title: 'Бейби картофель', price: 166 },
      ],
    },
  ]

  const insertCat = db.prepare(
    'INSERT INTO menu_categories (name, position) VALUES (?, ?)',
  )
  const insertItem = db.prepare(
    'INSERT INTO menu_items (category_id, title, weight, price, description, image, available, featured, position) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
  )

  // Default photo mapping by exact item title — only items that actually
  // ship a webp in /public/assets/menu/ are listed here. Items without
  // a photo are seeded with image=null.
  const imageByTitle = {
    'Бургер с брискетом': '/assets/menu/Brisket.webp',
    'Сырный сет': '/assets/menu/Syrnyy-set.webp',
    'Ассорти сала': '/assets/menu/Assorti-sala.webp',
    'Альтернативный ростбиф': '/assets/menu/Rostbif.webp',
    'Лосось слабосолёный': '/assets/menu/Losos-slaboy-soli.webp',
    'Чесночные гренки': '/assets/menu/Chesnochnye-grenki.webp',
    'Крылья копчёные': '/assets/menu/Krylya-BBQ.webp',
    'Крылья BBQ': '/assets/menu/Krylya-BBQ.webp',
    'Сырные палочки': '/assets/menu/Syrnye-palochki.webp',
    'Цезарь с креветками': '/assets/menu/Salat-s-avokado-i-krevetkami.webp',
    'С утиной грудкой': '/assets/menu/Salat-s-utkoy.webp',
    'С креветками и авокадо': '/assets/menu/Salat-s-avokado-i-krevetkami.webp',
    'С лососем и сырным муссом': '/assets/menu/Salat-s-lososem-i-syrnym-mussom.webp',
    'Голень барашка': '/assets/menu/Golen-barashka.webp',
    'Томлёная рулька': '/assets/menu/Tomlenaya-rulka.webp',
    'Мидии': '/assets/menu/Midii-v-slivochnom-souse.webp',
    'Befstroganov с грибами': '/assets/menu/Befstroganov.webp',
    'Brisket с пюре': '/assets/menu/Brisket.webp',
    'Пельмени говяжьи': '/assets/menu/Pelmeni-s-govyadinoy.webp',
    'Borshch': '/assets/menu/Borshch.webp',
    'Solyanka': '/assets/menu/Solyanka.webp',
    'Том Ям': '/assets/menu/Tom-Yam.webp',
    'Стейк Рибай': '/assets/menu/Steyk-Ribay.webp',
    'Стейк из говяжьей вырезки': '/assets/menu/Govyazhya-vyrezka.webp',
    'Стейк из свинины': '/assets/menu/Steyk-iz-svininy.webp',
    'Стейк Стриплойн': '/assets/menu/Steyk-Striployn.webp',
    'Язык с грибным соусом': '/assets/menu/Yazyk-s-gribnym-sousom.webp',
    'Dorado на гриле': '/assets/menu/Dorado.webp',
    'Колбаски из свинины': '/assets/menu/Tushenaya-kapusta.webp',
    'Колбаски из говядины': '/assets/menu/Tushenaya-kapusta.webp',
    'Колбаски из птицы': '/assets/menu/Tushenaya-kapusta.webp',
    CHEETOS: '/assets/menu/Rebra-BBQ.webp',
    BBQ: '/assets/menu/Rebra-BBQ.webp',
    'В сосновой глазури с мёдом': '/assets/menu/Rebra-BBQ.webp',
    'Губы Гудбай': '/assets/menu/Rebra-BBQ.webp',
    'Картофель фри': '/assets/menu/Kartofel-fri.webp',
    'Мексиканский овощной гарнир': '/assets/menu/Ovoshchi-gril.webp',
    'Овощи на гриле': '/assets/menu/Ovoshchi-gril.webp',
    'Картофельное пюре': '/assets/menu/Kartofelnoe-pyure.webp',
    'Бейби картофель': '/assets/menu/Kartofel-bebi.webp',
  }

  const tx = db.transaction(() => {
    seed.forEach((cat, ci) => {
      const result = insertCat.run(cat.name, ci)
      const categoryId = Number(result.lastInsertRowid)
      cat.items.forEach((item, ii) => {
        insertItem.run(
          categoryId,
          item.title,
          item.weight ?? null,
          item.price,
          item.description ?? null,
          imageByTitle[item.title] ?? null,
          item.featured ? 1 : 0,
          ii,
        )
      })
    })
  })
  tx()
}
