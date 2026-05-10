import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js'
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list.js'
import Cog from 'lucide-react/dist/esm/icons/cog.js'
import Flame from 'lucide-react/dist/esm/icons/flame.js'
import GanttChart from 'lucide-react/dist/esm/icons/gantt-chart.js'
import ImageIcon from 'lucide-react/dist/esm/icons/image.js'
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid.js'
import LogOut from 'lucide-react/dist/esm/icons/log-out.js'
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag.js'
import Soup from 'lucide-react/dist/esm/icons/soup.js'
import Users from 'lucide-react/dist/esm/icons/users.js'
import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { api, getToken, setToken } from '../lib/api'
import type { AdminUser } from '../lib/types'
import './admin.css'
import { AdminLogin } from './AdminLogin'
import { Toast, ToastProvider } from './components/Toast'
import { BookingsView } from './views/BookingsView'
import { ContentEditor } from './views/ContentEditor'
import { Dashboard } from './views/Dashboard'
import { MenuEditor } from './views/MenuEditor'
import { OrdersView } from './views/OrdersView'
import { SettingsView } from './views/SettingsView'
import { TablesEditor } from './views/TablesEditor'
import { TableMonitor } from './views/TableMonitor'

const NAV = [
  { to: '/admin', label: 'Сводка', icon: GanttChart, end: true },
  { to: '/admin/floor', label: 'Карта зала', icon: LayoutGrid },
  { to: '/admin/bookings', label: 'Брони', icon: CalendarDays },
  { to: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { to: '/admin/menu', label: 'Меню', icon: Soup },
  { to: '/admin/tables', label: 'Столы', icon: ClipboardList },
  { to: '/admin/content', label: 'Контент', icon: ImageIcon },
  { to: '/admin/settings', label: 'Настройки', icon: Cog },
]

export function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <Flame size={26} color="var(--admin-ember)" />
          <p style={{ marginTop: 12 }}>Открываем админку…</p>
        </div>
      </div>
    )
  }

  if (!user) return <AdminLogin onAuth={setUser} />

  return (
    <ToastProvider>
      <div className="admin-shell">
        <Sidebar user={user} onLogout={() => { setToken(null); setUser(null) }} />
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="floor" element={<TableMonitor />} />
            <Route path="bookings" element={<BookingsView />} />
            <Route path="orders" element={<OrdersView />} />
            <Route path="menu" element={<MenuEditor />} />
            <Route path="tables" element={<TablesEditor />} />
            <Route path="content" element={<ContentEditor />} />
            <Route path="settings" element={<SettingsView user={user} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
        <Toast />
      </div>
    </ToastProvider>
  )
}

function Sidebar({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const location = useLocation()
  // Force re-render highlight on nav
  void location.pathname
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src="/assets/meatbar-logo-clean.webp" alt="" />
        <div>
          <strong>Мясо Бар</strong>
          <small>Admin · v1.0</small>
        </div>
      </div>
      <nav className="admin-nav">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="admin-nav-spacer" />
      <div className="admin-user-card">
        <span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span>
        <div>
          <div>{user.username}</div>
          <small>{roleLabel(user.role)}</small>
        </div>
      </div>
      <button className="admin-logout" onClick={onLogout}>
        <LogOut size={14} /> Выйти
      </button>
      <Link
        to="/"
        style={{
          marginTop: 6,
          textAlign: 'center',
          color: 'var(--admin-muted)',
          fontSize: '0.78rem',
          padding: '6px',
        }}
      >
        <Users size={12} style={{ verticalAlign: 'middle' }} /> На сайт
      </Link>
    </aside>
  )
}

function roleLabel(role: string) {
  switch (role) {
    case 'owner': return 'Владелец'
    case 'manager': return 'Менеджер'
    case 'host': return 'Хостес'
    case 'kitchen': return 'Кухня'
    default: return role
  }
}
