import axios from 'axios'
import { config } from '../config.js'

export async function sendTelegramMessage(text, options = {}) {
  if (!config.telegram.enabled) {
    console.log('[telegram] disabled, message skipped:', text.slice(0, 80))
    return { ok: false, skipped: true }
  }
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
      {
        chat_id: config.telegram.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      },
      { timeout: 8000 },
    )
    return { ok: true, data: response.data }
  } catch (error) {
    console.error('[telegram] send error:', error?.response?.data || error?.message)
    return { ok: false, error: error?.message ?? 'unknown' }
  }
}

export function formatBookingMessage(booking) {
  return [
    '<b>🍖 Новая бронь</b>',
    `Имя: <b>${escapeHtml(booking.name)}</b>`,
    `Телефон: <code>${escapeHtml(booking.phone)}</code>`,
    `Стол: ${escapeHtml(booking.table_title)}`,
    `Гостей: ${booking.guests}`,
    `Дата/время: ${escapeHtml(booking.date)} в ${escapeHtml(booking.time)}`,
    booking.comment ? `Комментарий: ${escapeHtml(booking.comment)}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function formatOrderMessage(order, items) {
  const lines = items.map((line) => `• ${escapeHtml(line.title)} × ${line.quantity}`).join('\n')
  return [
    '<b>🛒 Новый заказ</b>',
    `Телефон: <code>${escapeHtml(order.phone)}</code>`,
    order.name ? `Имя: ${escapeHtml(order.name)}` : null,
    `Доставка: ${order.delivery === 'delivery' ? 'курьер' : 'самовывоз'}`,
    order.address ? `Адрес: ${escapeHtml(order.address)}` : null,
    `Сумма: <b>${order.total} ₽</b>`,
    '',
    lines,
  ]
    .filter(Boolean)
    .join('\n')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
