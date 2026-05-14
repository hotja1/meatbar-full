import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { HomePage } from './pages/HomePage'
import { CartProvider } from './lib/CartContext'
import { installGlobalButtonFire } from './lib/buttonFire'
import './components/fire.css'

const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })))
const MenuPage = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })))
const BarPage = lazy(() => import('./pages/BarPage').then((m) => ({ default: m.BarPage })))
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })))
const BusinessLunchPage = lazy(() => import('./pages/BusinessLunchPage').then((m) => ({ default: m.BusinessLunchPage })))

function PageFallback() {
  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '100vh',
      background: '#120d0a',
      color: '#f6eee1',
      fontFamily: 'inherit',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', letterSpacing: '0.18em', color: '#9d8e7c', textTransform: 'uppercase' }}>
          Мясо Бар
        </div>
        <div style={{ marginTop: 8 }}>загрузка…</div>
      </div>
    </div>
  )
}

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
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/menu"
            element={
              <Suspense fallback={<PageFallback />}>
                <MenuPage />
              </Suspense>
            }
          />
          <Route
            path="/bar"
            element={
              <Suspense fallback={<PageFallback />}>
                <BarPage />
              </Suspense>
            }
          />
          <Route
            path="/business-lunch"
            element={
              <Suspense fallback={<PageFallback />}>
                <BusinessLunchPage />
              </Suspense>
            }
          />
          <Route
            path="/booking"
            element={
              <Suspense fallback={<PageFallback />}>
                <BookingPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<AdminFallback />}>
                <AdminApp />
              </Suspense>
            }
          />
        </Routes>
      </CartProvider>
      <SpeedInsights />
    </BrowserRouter>
  )
}
