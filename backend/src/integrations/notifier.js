import { sendTelegramMessage } from './telegram.js'
import { sendVkMessage } from './vk.js'

export async function notifyStaff(message) {
  const [telegram, vk] = await Promise.allSettled([
    sendTelegramMessage(message),
    sendVkMessage(stripHtml(message)),
  ])

  return { telegram, vk }
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
}
