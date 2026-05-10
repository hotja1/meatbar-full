import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2.js'
import XCircle from 'lucide-react/dist/esm/icons/x-circle.js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ToastEntry = { id: number; kind: 'success' | 'error'; message: string }
type ToastCtx = { push: (kind: 'success' | 'error', message: string) => void }

const Ctx = createContext<ToastCtx | null>(null)

let store: ToastEntry[] = []
const listeners = new Set<(items: ToastEntry[]) => void>()

function emit() {
  for (const l of listeners) l(store)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const push: ToastCtx['push'] = useCallback((kind, message) => {
    const id = Date.now() + Math.random()
    store = [...store, { id, kind, message }]
    emit()
    setTimeout(() => {
      store = store.filter((t) => t.id !== id)
      emit()
    }, 3500)
  }, [])
  return <Ctx.Provider value={{ push }}>{children}</Ctx.Provider>
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx.push
}

export function Toast() {
  const [items, setItems] = useState(store)
  useEffect(() => {
    listeners.add(setItems)
    return () => { listeners.delete(setItems) }
  }, [])
  if (!items.length) return null
  return (
    <>
      {items.map((toast, idx) => (
        <div key={toast.id} className={`admin-toast ${toast.kind}`} style={{ bottom: 24 + idx * 56 }}>
          {toast.kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      ))}
    </>
  )
}
