import Save from 'lucide-react/dist/esm/icons/save.js'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { SiteContent } from '../../lib/types'
import { useToast } from '../components/Toast'

const EMPTY: SiteContent = {
  hero: { chapter: '', title: '', subtitle: '' },
  contacts: { phone: '', address: '', hours: '' },
  legal: '',
}

export function ContentEditor() {
  const [content, setContent] = useState<SiteContent>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.getContent().then((c) => {
      setContent({ ...EMPTY, ...c })
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.updateContent(content)
      toast('success', 'Контент сохранён')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <div className="breadcrumb">Контент</div>
          <h1>Главная страница</h1>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={14} /> {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>

      {loading ? (
        <div className="admin-card empty-state">Загружаем…</div>
      ) : (
        <div className="admin-grid-2">
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Hero</h2>
                <p>Главный экран сайта</p>
              </div>
            </div>
            <div className="field-row">
              <label>Подзаголовок (chapter)</label>
              <input className="input" value={content.hero.chapter} onChange={(e) => setContent({ ...content, hero: { ...content.hero, chapter: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Заголовок</label>
              <input className="input" value={content.hero.title} onChange={(e) => setContent({ ...content, hero: { ...content.hero, title: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Подзаголовок</label>
              <textarea className="textarea" value={content.hero.subtitle} onChange={(e) => setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Hero-картинка (URL)</label>
              <input className="input" value={content.hero.heroImage ?? ''} onChange={(e) => setContent({ ...content, hero: { ...content.hero, heroImage: e.target.value } })} placeholder="/assets/clean-chef-pour-wide.webp" />
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2>Контакты</h2>
                <p>Отображаются в подвале и в шапке</p>
              </div>
            </div>
            <div className="field-row">
              <label>Телефон</label>
              <input className="input" value={content.contacts.phone} onChange={(e) => setContent({ ...content, contacts: { ...content.contacts, phone: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Адрес</label>
              <input className="input" value={content.contacts.address} onChange={(e) => setContent({ ...content, contacts: { ...content.contacts, address: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Часы работы</label>
              <input className="input" value={content.contacts.hours} onChange={(e) => setContent({ ...content, contacts: { ...content.contacts, hours: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>Instagram</label>
              <input className="input" value={content.contacts.instagram ?? ''} onChange={(e) => setContent({ ...content, contacts: { ...content.contacts, instagram: e.target.value } })} />
            </div>
            <div className="field-row">
              <label>VK</label>
              <input className="input" value={content.contacts.vk ?? ''} onChange={(e) => setContent({ ...content, contacts: { ...content.contacts, vk: e.target.value } })} />
            </div>
          </section>

          <section className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <div className="admin-card-header">
              <div>
                <h2>Юридическая информация</h2>
                <p>Внизу сайта</p>
              </div>
            </div>
            <div className="field-row">
              <textarea className="textarea" value={content.legal} onChange={(e) => setContent({ ...content, legal: e.target.value })} rows={4} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
