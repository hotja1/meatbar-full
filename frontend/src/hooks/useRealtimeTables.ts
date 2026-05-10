import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { RestaurantTable } from '../lib/types'

let socket: Socket | null = null

function ensureSocket(): Socket {
  if (!socket) {
    socket = io('/', { autoConnect: true, transports: ['websocket', 'polling'] })
  }
  return socket
}

export function useRealtimeTables(setTables: (updater: (tables: RestaurantTable[]) => RestaurantTable[]) => void) {
  useEffect(() => {
    const s = ensureSocket()
    const onUpdate = (table: Partial<RestaurantTable> & { id: number }) => {
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, ...table } : t)))
    }
    const onCreated = (table: RestaurantTable) => {
      setTables((prev) => (prev.some((t) => t.id === table.id) ? prev : [...prev, table]))
    }
    const onDeleted = (payload: { id: number }) => {
      setTables((prev) => prev.filter((t) => t.id !== payload.id))
    }
    s.on('tables:updated', onUpdate)
    s.on('tables:created', onCreated)
    s.on('tables:deleted', onDeleted)
    return () => {
      s.off('tables:updated', onUpdate)
      s.off('tables:created', onCreated)
      s.off('tables:deleted', onDeleted)
    }
  }, [setTables])
}
