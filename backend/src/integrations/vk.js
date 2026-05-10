import axios from 'axios'
import { config } from '../config.js'

const VK_API = 'https://api.vk.com/method/messages.send'
const VK_VERSION = '5.199'

export async function sendVkMessage(text) {
  if (!config.vk.enabled) {
    console.log('[vk] disabled, message skipped:', String(text).slice(0, 80))
    return { ok: false, skipped: true }
  }

  try {
    const randomId = Math.floor(Math.random() * 1_000_000_000)
    const response = await axios.post(
      VK_API,
      null,
      {
        params: {
          access_token: config.vk.token,
          v: VK_VERSION,
          peer_id: config.vk.peerId,
          random_id: randomId,
          message: text,
        },
        timeout: 8000,
      },
    )

    if (response.data?.error) {
      console.error('[vk] send error:', response.data.error)
      return { ok: false, error: response.data.error.error_msg ?? 'vk-send-failed' }
    }

    return { ok: true, data: response.data }
  } catch (error) {
    console.error('[vk] send error:', error?.response?.data || error?.message)
    return { ok: false, error: error?.message ?? 'unknown' }
  }
}
