import zlib from 'node:zlib'

/*
 * Task E23 — Brotli для JSON-ответов.
 *
 * Express `compression()` middleware умеет только gzip/deflate.
 * Мы добавляем тонкий слой до него: если клиент поддерживает `br`
 * и ответ — JSON больше MIN_SIZE, оборачиваем `res.json()` так,
 * чтобы тело прошло через `zlib.brotliCompressSync` с quality=4
 * (достаточно быстро на прод-CPU, но ~10-15 % легче gzip).
 *
 * Почему sync, а не поток:
 * - JSON-ответы короткие (меню ≈ 50 KB, tables ≈ 8 KB, content ≈ 2 KB);
 * - MICRO_CACHE уже держит сам payload, так что на cache-hit
 *   compressing делается один раз и кладётся в cacheKey `<key>:br`.
 *
 * Без этого — регрессия: каждая выдача вызывала бы Brotli-сжатие.
 * С кэшем сжатое тело готово за один цикл.
 */

const MIN_SIZE = 1024
const BROTLI_PARAMS = {
  [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
  [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
}
const brotliCache = new Map()

export function clearBrotliCache(...keys) {
  if (!keys.length) {
    brotliCache.clear()
    return
  }
  for (const key of keys) brotliCache.delete(`${key}:br`)
}

function acceptsBrotli(req) {
  const ae = String(req.headers['accept-encoding'] || '').toLowerCase()
  if (!ae) return false
  if (req.headers['x-no-compression']) return false
  return ae.split(',').some((token) => token.trim().startsWith('br'))
}

/**
 * Отправляет JSON с Brotli, если клиент поддерживает. Иначе отдаёт
 * обычный res.json() (compression middleware сам применит gzip).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {unknown} payload
 * @param {string} etag weak-ETag, уже посчитан выше по пайплайну
 * @param {string} cacheKey ключ микрокэша (меню/tables/content)
 */
export function sendJsonWithBrotli(req, res, payload, etag, cacheKey) {
  if (!acceptsBrotli(req)) {
    res.json(payload)
    return
  }
  const key = `${cacheKey}:br:${etag}`
  let buf = brotliCache.get(key)
  if (!buf) {
    const raw = Buffer.from(JSON.stringify(payload), 'utf8')
    if (raw.length < MIN_SIZE) {
      res.json(payload)
      return
    }
    try {
      buf = zlib.brotliCompressSync(raw, { params: BROTLI_PARAMS })
      brotliCache.set(key, buf)
      /* LRU-ish: при росте >24 ключей выкидываем самый старый */
      if (brotliCache.size > 24) {
        const firstKey = brotliCache.keys().next().value
        if (firstKey) brotliCache.delete(firstKey)
      }
    } catch {
      /* если Brotli по какой-то причине упал — fallback на обычный JSON */
      res.json(payload)
      return
    }
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Encoding', 'br')
  res.setHeader('Vary', 'Accept-Encoding')
  res.setHeader('Content-Length', buf.length)
  res.end(buf)
}
