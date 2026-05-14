function normalizeSiteUrl(raw) {
  const fallback = 'https://мясо-бар.рф'
  try {
    const parsed = new URL(raw || fallback)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return fallback
  }
}

function sanitizeHost(rawHost) {
  const host = String(rawHost || '').trim().replace(/[^a-zA-Z0-9.:-]/g, '')
  return host || 'xn----8sbc6bkpc5i.xn--p1ai'
}

function publicSiteUrl(req, configuredSiteUrl) {
  if (configuredSiteUrl) return normalizeSiteUrl(configuredSiteUrl)
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim()
  const protocol = forwardedProto || req.protocol || 'https'
  const host = sanitizeHost(req.headers['x-forwarded-host'] || req.get('host'))
  return normalizeSiteUrl(`${protocol}://${host}`)
}

export function buildRobotsTxt({ siteUrl, cleanParams }) {
  const host = new URL(siteUrl).host
  const safeCleanParams =
    cleanParams ||
    'utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&utm_referrer&yclid&ysclid&fbclid'
  return [
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
    `Clean-param: ${safeCleanParams} /`,
    '',
    `Host: ${host}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
}

export function buildSitemapXml({ siteUrl }) {
  const now = new Date().toISOString()
  return [
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
}

export function seoPayload(req, config) {
  const siteUrl = publicSiteUrl(req, config.siteUrl)
  return {
    siteUrl,
    cleanParams: config.cleanParams,
  }
}
