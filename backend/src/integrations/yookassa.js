import axios from 'axios'
import crypto from 'node:crypto'
import { config } from '../config.js'

export async function createYooKassaPayment({ amount, description, orderId }) {
  if (!config.yookassa.enabled) {
    return {
      ok: false,
      reason: 'yookassa-disabled',
      message:
        'ЮKassa не настроена: задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в server/.env.',
    }
  }
  const auth = Buffer.from(
    `${config.yookassa.shopId}:${config.yookassa.secretKey}`,
  ).toString('base64')
  const idempotenceKey = crypto.randomUUID()
  try {
    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      {
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: config.yookassa.returnUrl,
        },
        description,
        metadata: { orderId: String(orderId) },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Idempotence-Key': idempotenceKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    )
    return { ok: true, data: response.data }
  } catch (error) {
    console.error('[yookassa] create error:', error?.response?.data || error?.message)
    return { ok: false, error: error?.message ?? 'unknown' }
  }
}
