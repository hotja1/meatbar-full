import KeyRound from 'lucide-react/dist/esm/icons/key-round.js'
import Save from 'lucide-react/dist/esm/icons/save.js'
import { useEffect, useState } from 'react'
import { API_BASE, api, getToken } from '../../lib/api'
import type { AdminUser } from '../../lib/types'
import { useToast } from '../components/Toast'

type IntegrationStatus = {
  ok: boolean
  integrations: { yookassa: boolean; smsru: boolean; telegram: boolean; vk: boolean }
}

export function SettingsView({ user }: { user: AdminUser }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [password, setPassword] = useState('')
  const toast = useToast()

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings({}))
    fetch(`${API_BASE}/health`).then((r) => r.json()).then(setStatus).catch(() => null)
  }, [])

  const save = async () => {
    try {
      await api.updateSettings(settings)
      toast('success', 'Настройки сохранены')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const changePassword = async () => {
    if (!password || password.length < 6) {
      toast('error', 'Минимум 6 символов')
      return
    }
    try {
      const token = getToken()
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Не удалось сменить пароль')
      toast('success', 'Пароль обновлён')
      setPassword('')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Аккаунт и интеграции</div>
          <h1>Настройки</h1>
        </div>
        <button className="btn btn-primary" onClick={save}><Save size={14} /> Сохранить настройки</button>
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Аккаунт</h2>
              <p>Вы вошли как <strong>{user.username}</strong> ({user.role})</p>
            </div>
          </div>
          <div className="field-row">
            <label><KeyRound size={12} style={{ verticalAlign: 'middle' }} /> Новый пароль</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="минимум 6 символов" />
          </div>
          <button className="btn btn-primary" onClick={changePassword}>Сменить пароль</button>
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Интеграции</h2>
              <p>Конфигурация в файле <code>server/.env</code></p>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--admin-line)', borderRadius: 'var(--admin-radius-sm)' }}>
              <span>ЮKassa (онлайн-оплата)</span>
              <span className={`status-pill ${status?.integrations.yookassa ? 'confirmed' : 'cancelled'}`}>
                {status?.integrations.yookassa ? 'подключена' : 'не настроена'}
              </span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--admin-line)', borderRadius: 'var(--admin-radius-sm)' }}>
              <span>SMS.ru (верификация номера)</span>
              <span className={`status-pill ${status?.integrations.smsru ? 'confirmed' : 'cancelled'}`}>
                {status?.integrations.smsru ? 'включена' : 'выключена'}
              </span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--admin-line)', borderRadius: 'var(--admin-radius-sm)' }}>
              <span>Telegram-бот (уведомления для персонала)</span>
              <span className={`status-pill ${status?.integrations.telegram ? 'confirmed' : 'cancelled'}`}>
                {status?.integrations.telegram ? 'работает' : 'не настроен'}
              </span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--admin-line)', borderRadius: 'var(--admin-radius-sm)' }}>
              <span>ВКонтакте (уведомления персоналу)</span>
              <span className={`status-pill ${status?.integrations.vk ? 'confirmed' : 'cancelled'}`}>
                {status?.integrations.vk ? 'работает' : 'не настроен'}
              </span>
            </li>
          </ul>
          <p style={{ color: 'var(--admin-muted)', fontSize: '0.84rem', marginTop: 12 }}>
            Подсказки по получению ключей — в файле <code>README.md</code>.
          </p>
        </section>

        <section className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div className="admin-card-header">
            <div>
              <h2>Внутренние настройки</h2>
              <p>Произвольные key/value, доступны фронтенду через API.</p>
            </div>
            <button className="btn btn-ghost" onClick={() => setSettings({ ...settings, [`key_${Object.keys(settings).length + 1}`]: '' })}>
              + Добавить ключ
            </button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(settings).length === 0 ? (
              <div className="empty-state"><h3>Пусто</h3><p>Здесь можно хранить произвольные параметры.</p></div>
            ) : (
              Object.entries(settings).map(([key, value]) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 8 }}>
                  <input className="input" value={key} disabled />
                  <input className="input" value={value} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                  <button className="btn btn-danger" onClick={() => {
                    const next = { ...settings }
                    delete next[key]
                    setSettings(next)
                  }}>×</button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
