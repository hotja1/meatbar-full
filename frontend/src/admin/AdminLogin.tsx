import Flame from 'lucide-react/dist/esm/icons/flame.js'
import KeyRound from 'lucide-react/dist/esm/icons/key-round.js'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.js'
import User from 'lucide-react/dist/esm/icons/user.js'
import { useState, type FormEvent } from 'react'
import { api, setToken } from '../lib/api'
import type { AdminUser } from '../lib/types'

export function AdminLogin({ onAuth }: { onAuth: (user: AdminUser) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await api.login(username, password)
      setToken(result.token)
      onAuth(result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <img src="/assets/meatbar-logo-clean.webp" alt="Мясо Бар" />
        <h1>
          <Flame size={20} style={{ verticalAlign: 'middle', color: 'var(--admin-ember)' }} />{' '}
          Admin · Мясо Бар
        </h1>
        <p>Войдите, чтобы управлять заказами, бронями, меню и залом.</p>
        <div className="field-row">
          <label>
            <User size={12} style={{ verticalAlign: 'middle' }} /> Логин
          </label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field-row">
          <label>
            <KeyRound size={12} style={{ verticalAlign: 'middle' }} /> Пароль
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <div className="login-error">{error}</div> : null}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          disabled={loading}
        >
          <ShieldCheck size={16} /> {loading ? 'Входим…' : 'Войти'}
        </button>
        <div className="login-hint">
          Стартовые: <code>admin</code> / <code>meatbar2026</code>. После первого входа смените
          пароль в разделе «Настройки».
        </div>
      </form>
    </div>
  )
}
