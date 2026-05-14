import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const publicDir = path.join(root, 'public')
const envPath = path.join(root, '.env')

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  const out = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const dotEnv = readDotEnv(envPath)
const envValue = (key, fallback = '') => process.env[key] ?? dotEnv[key] ?? fallback

const defaultSiteUrl = 'https://мясо-бар.рф'

function normalizeSiteUrl(raw) {
  try {
    const parsed = new URL(raw || defaultSiteUrl)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return defaultSiteUrl
  }
}

const siteUrl = normalizeSiteUrl(envValue('SITE_URL', defaultSiteUrl))
const host = new URL(siteUrl).host
const now = new Date().toISOString()
const cleanParams = envValue(
  'CLEAN_PARAMS',
  'utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&utm_referrer&yclid&ysclid&fbclid',
)
const yandexVerificationCode = String(envValue('YANDEX_VERIFICATION_CODE', '')).trim()
const googleSiteVerification = String(envValue('GOOGLE_SITE_VERIFICATION', '')).trim()

const robotsTxt = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  'Disallow: /socket.io/',
  'Disallow: /admin',
  '',
  'User-agent: Yandex',
  'Allow: /',
  'Disallow: /api/',
  'Disallow: /socket.io/',
  'Disallow: /admin',
  `Clean-param: ${cleanParams} /`,
  '',
  `Host: ${host}`,
  `Sitemap: ${siteUrl}/sitemap.xml`,
  '',
].join('\n')

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  '  <url>',
  `    <loc>${siteUrl}/</loc>`,
  `    <lastmod>${now}</lastmod>`,
  '    <changefreq>daily</changefreq>',
  '    <priority>1.0</priority>',
  '  </url>',
  '  <url>',
  `    <loc>${siteUrl}/menu</loc>`,
  `    <lastmod>${now}</lastmod>`,
  '    <changefreq>weekly</changefreq>',
  '    <priority>0.9</priority>',
  '  </url>',
  '  <url>',
  `    <loc>${siteUrl}/bar</loc>`,
  `    <lastmod>${now}</lastmod>`,
  '    <changefreq>weekly</changefreq>',
  '    <priority>0.8</priority>',
  '  </url>',
  '</urlset>',
  '',
].join('\n')

fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8')
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8')

if (/^[a-zA-Z0-9_-]{8,}$/.test(yandexVerificationCode)) {
  const yandexFileName = `yandex_${yandexVerificationCode}.html`
  const yandexHtml = [
    '<html>',
    '  <head>',
    '    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
    '  </head>',
    `  <body>Verification: ${yandexVerificationCode}</body>`,
    '</html>',
    '',
  ].join('\n')
  fs.writeFileSync(path.join(publicDir, yandexFileName), yandexHtml, 'utf8')
  console.log(`[seo] generated ${yandexFileName}`)
}

if (/^[a-zA-Z0-9_-]{8,}$/.test(googleSiteVerification)) {
  const googleFileName = `google${googleSiteVerification}.html`
  const googleBody = `google-site-verification: google${googleSiteVerification}.html\n`
  fs.writeFileSync(path.join(publicDir, googleFileName), googleBody, 'utf8')
  console.log(`[seo] generated ${googleFileName}`)
}

console.log(`[seo] robots.txt and sitemap.xml generated for ${siteUrl}`)
