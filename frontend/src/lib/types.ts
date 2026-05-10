export type TableStatus = 'free' | 'reserved' | 'held' | 'disabled'

export type RestaurantTable = {
  id: number
  title: string
  zone: 'window' | 'grill' | 'bar' | 'lounge' | 'banquet'
  seats: number
  status: TableStatus
  x: number
  y: number
  scene: string
  notes?: string
  /** Hall number (1 = main, 2 = bar/lounge). Optional for backwards compat. */
  hall?: 1 | 2
  /** Display number on the floorplan, e.g. 14. Defaults to id. */
  number?: number
  /** Geometry for the realistic map. */
  width?: number
  height?: number
  shape?: 'rect' | 'round'
}

export type Booking = {
  id?: number
  table: string
  tableId?: number
  guests: number
  date: string
  time: string
  name: string
  phone: string
  comment?: string
  status?: 'pending' | 'confirmed' | 'cancelled' | 'arrived'
  createdAt?: string
}

export type CartItem = {
  itemId?: number
  title: string
  price: number
  quantity: number
}

export type Order = {
  id?: number
  items: CartItem[]
  phone: string
  name?: string
  total: number
  payment: 'pending' | 'paid' | 'cash' | 'online-api-ready'
  delivery?: 'pickup' | 'delivery'
  address?: string
  status?: 'new' | 'confirmed' | 'cooking' | 'ready' | 'done' | 'cancelled'
  createdAt?: string
}

export type MenuItem = {
  id?: number
  title: string
  weight?: string
  price: number
  description?: string
  image?: string
  available?: boolean
  featured?: boolean
}

export type MenuCategory = {
  id?: number
  name: string
  order?: number
  items: MenuItem[]
}

export type SiteContent = {
  hero: {
    chapter: string
    title: string
    subtitle: string
    heroImage?: string
  }
  contacts: {
    phone: string
    address: string
    hours: string
    instagram?: string
    vk?: string
  }
  legal: string
}

export type AdminUser = {
  id: number
  username: string
  role: 'owner' | 'manager' | 'host' | 'kitchen'
}

export type AuthResponse = {
  token: string
  user: AdminUser
}
