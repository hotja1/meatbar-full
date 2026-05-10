import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { installGlobalButtonFire } from './lib/buttonFire'
import './components/fire.css'

const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })))

function AdminFallback() {
  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '100vh',
      background: '#0a0807',
      color: '#f6eee1',
      fontFamily: 'inherit',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', letterSpacing: '0.18em', color: '#9d8e7c', textTransform: 'uppercase' }}>
          Meat Bar · admin
        </div>
        <div style={{ marginTop: 8 }}>загрузка панели…</div>
      </div>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    return installGlobalButtonFire()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
