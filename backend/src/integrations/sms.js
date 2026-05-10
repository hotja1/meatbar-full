import axios from 'axios'
import { config } from '../config.js'
import { db } from '../db.js'

export function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function sendSmsCode(phone) {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  db.prepare(
    `INSERT INTO phone_codes (phone, code, attempts, expires_at)
     VALUES (?, ?, 0, ?)
     ON CONFLICT(phone) DO UPDATE SET code = excluded.code, attempts = 0, expires_at = excluded.expires_at`,
  ).run(phone, code, expiresAt)

  if (!config.smsru.enabled) {
    console.log(`[sms] disabled, dev code for ${phone}: ${code}`)
    return { ok: true, devCode: code, sent: false }
  }
  try {
    const response = await axios.get('https://sms.ru/sms/send', {
      params: {
        api_id: config.smsru.apiId,
        to: phone,
        msg: `Мясо Бар: код подтверждения ${code}`,
        json: 1,
      },
      timeout: 8000,
    })
    return { ok: true, sent: true, data: response.data }
  } catch (error) {
    console.error('[sms] send error:', error?.message)
    return { ok: false, error: error?.message ?? 'unknown' }
  }
}

export function verifySmsCode(phone, code) {
  const row = db.prepare('SELECT * FROM phone_codes WHERE phone = ?').get(phone)
  if (!row) return { ok: false, error: 'no-code' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: 'expired' }
  if (row.attempts >= 5) return { ok: false, error: 'too-many-attempts' }
  if (row.code !== String(code)) {
    db.prepare('UPDATE phone_codes SET attempts = attempts + 1 WHERE phone = ?').run(phone)
    return { ok: false, error: 'wrong-code' }
  }
  db.prepare('DELETE FROM phone_codes WHERE phone = ?').run(phone)
  return { ok: true }
}
