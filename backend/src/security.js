import rateLimit from 'express-rate-limit'

const TEN_MINUTES = 10 * 60 * 1000

function limiter(options) {
  return rateLimit({
    windowMs: TEN_MINUTES,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много запросов. Попробуйте позже.' },
    ...options,
  })
}

export const loginLimiter = limiter({ max: 5 })
export const bookingLimiter = limiter({ max: 10 })
export const orderLimiter = limiter({ max: 20 })
export const smsLimiter = limiter({ max: 20 })

function normalizeOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

export function buildAllowedOrigins(config) {
  const fromEnv = normalizeOrigins(process.env.CORS_ORIGINS)
  const safeDefaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
  ]
  const merged = new Set([config.clientOrigin, ...safeDefaults, ...fromEnv].filter(Boolean))
  return [...merged]
}

export function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true
  return allowedOrigins.includes(origin)
}
