import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

export const config = {
  port: Number(process.env.PORT ?? 4000),
  siteUrl: process.env.SITE_URL ?? '',
  cleanParams:
    process.env.CLEAN_PARAMS ??
    'utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&utm_referrer&yclid&ysclid&fbclid',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD ?? 'meatbar2026',
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH ?? './data/meatbar.sqlite'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  yookassa: {
    shopId: process.env.YOOKASSA_SHOP_ID ?? '',
    secretKey: process.env.YOOKASSA_SECRET_KEY ?? '',
    returnUrl: process.env.YOOKASSA_RETURN_URL ?? 'http://localhost:5173/order/success',
    enabled: Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY),
  },
  smsru: {
    apiId: process.env.SMSRU_API_ID ?? '',
    enabled: process.env.SMS_ENABLED === 'true' && Boolean(process.env.SMSRU_API_ID),
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    chatId: process.env.TELEGRAM_CHAT_ID ?? '',
    enabled:
      process.env.TELEGRAM_ENABLED === 'true' &&
      Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  },
  vk: {
    token: process.env.VK_BOT_TOKEN ?? '',
    groupId: process.env.VK_GROUP_ID ?? '',
    peerId: process.env.VK_PEER_ID ?? '',
    enabled:
      process.env.VK_ENABLED === 'true' &&
      Boolean(process.env.VK_BOT_TOKEN && process.env.VK_PEER_ID),
  },
}
