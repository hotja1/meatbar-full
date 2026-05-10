import type {
  AuthResponse,
  Booking,
  MenuCategory,
  Order,
  RestaurantTable,
  SiteContent,
} from './types'

const DEFAULT_API_BASE =
  (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/api'

export const API_BASE = DEFAULT_API_BASE

const TOKEN_KEY = 'meatbar-admin-token'
const OFFLINE_BOOKING_QUEUE_KEY = 'meatbar:offline-bookings'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
}

type FetchOptions = RequestInit & { auth?: boolean }

type BookingDraft = Omit<Booking, 'id' | 'status' | 'createdAt'>

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readOfflineBookingQueue(): BookingDraft[] {
  if (!canUseStorage()) return []
  try {
    const raw = window.localStorage.getItem(OFFLINE_BOOKING_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((b) => b && typeof b === 'object') as BookingDraft[]
  } catch {
    return []
  }
}

function writeOfflineBookingQueue(items: BookingDraft[]) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(OFFLINE_BOOKING_QUEUE_KEY, JSON.stringify(items))
  } catch {
    /* noop */
  }
}

function enqueueOfflineBooking(booking: BookingDraft) {
  const items = readOfflineBookingQueue()
  items.push(booking)
  writeOfflineBookingQueue(items)
}

export async function flushQueuedBookings() {
  const queue = readOfflineBookingQueue()
  if (!queue.length) return

  const rest: BookingDraft[] = []
  for (const booking of queue) {
    try {
      await request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      })
    } catch {
      // Keep unsent items in the queue; we'll retry on next online event.
      rest.push(booking)
    }
  }
  writeOfflineBookingQueue(rest)
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (options.auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : await response.text()

  if (!response.ok) {
    const message =
      (isJson && data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) ||
      `Request failed: ${response.status}`
    throw new Error(message)
  }
  // Some hosts (e.g. SPA fallback on static deploys) return HTML for missing
  // API routes with a 200. Treat non-JSON responses as failures so the UI
  // falls back to its bundled fixtures rather than blowing up later.
  if (!isJson) {
    throw new Error('API endpoint returned non-JSON response')
  }
  return data as T
}

export const api = {
  // Public
  getMenu: () => request<MenuCategory[]>('/menu'),
  getTables: () => request<RestaurantTable[]>('/tables'),
  getContent: () => request<SiteContent>('/content'),
  createBooking: async (booking: BookingDraft) => {
    try {
      return await request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      })
    } catch (error) {
      // Offline-first fallback: keep user action, retry automatically later.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        enqueueOfflineBooking(booking)
        return {
          ...booking,
          id: -Date.now(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        } satisfies Booking
      }
      throw error
    }
  },
  createOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  // Auth
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<AuthResponse['user']>('/auth/me', { auth: true }),
  // Admin: Bookings
  listBookings: () => request<Booking[]>('/admin/bookings', { auth: true }),
  updateBooking: (id: number, patch: Partial<Booking>) =>
    request<Booking>(`/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      auth: true,
    }),
  deleteBooking: (id: number) =>
    request<void>(`/admin/bookings/${id}`, { method: 'DELETE', auth: true }),
  // Admin: Orders
  listOrders: () => request<Order[]>('/admin/orders', { auth: true }),
  updateOrder: (id: number, patch: Partial<Order>) =>
    request<Order>(`/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      auth: true,
    }),
  // Admin: Menu CRUD
  createCategory: (name: string, order?: number) =>
    request<MenuCategory>('/admin/menu/categories', {
      method: 'POST',
      body: JSON.stringify({ name, order }),
      auth: true,
    }),
  updateCategory: (id: number, patch: Partial<MenuCategory>) =>
    request<MenuCategory>(`/admin/menu/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      auth: true,
    }),
  deleteCategory: (id: number) =>
    request<void>(`/admin/menu/categories/${id}`, { method: 'DELETE', auth: true }),
  createMenuItem: (categoryId: number, item: Partial<import('./types').MenuItem>) =>
    request<import('./types').MenuItem>(`/admin/menu/categories/${categoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
      auth: true,
    }),
  updateMenuItem: (id: number, patch: Partial<import('./types').MenuItem>) =>
    request<import('./types').MenuItem>(`/admin/menu/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      auth: true,
    }),
  deleteMenuItem: (id: number) =>
    request<void>(`/admin/menu/items/${id}`, { method: 'DELETE', auth: true }),
  // Admin: Tables CRUD
  createTable: (table: Omit<RestaurantTable, 'id'>) =>
    request<RestaurantTable>('/admin/tables', {
      method: 'POST',
      body: JSON.stringify(table),
      auth: true,
    }),
  updateTable: (id: number, patch: Partial<RestaurantTable>) =>
    request<RestaurantTable>(`/admin/tables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      auth: true,
    }),
  deleteTable: (id: number) =>
    request<void>(`/admin/tables/${id}`, { method: 'DELETE', auth: true }),
  // Admin: Content
  updateContent: (content: SiteContent) =>
    request<SiteContent>('/admin/content', {
      method: 'PUT',
      body: JSON.stringify(content),
      auth: true,
    }),
  // Admin: Settings
  getSettings: () => request<Record<string, string>>('/admin/settings', { auth: true }),
  updateSettings: (settings: Record<string, string>) =>
    request<Record<string, string>>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
      auth: true,
    }),
}
