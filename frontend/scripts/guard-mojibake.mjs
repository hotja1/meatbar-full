import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const TARGETS = [
  path.join(ROOT, 'src'),
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'public', 'manifest.webmanifest'),
  path.join(ROOT, 'public', 'robots.txt'),
  path.join(ROOT, 'public', 'sitemap.xml'),
]

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json', '.html', '.xml', '.txt', '.webmanifest'])
const ALLOWED_RU = new Set('АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя')
const BAD_SEQ = [
  /[РС][\u0080-\u00FF]/g,
  /\u0432[\u20AC\u201A\u201E\u2020\u2021\u02C6\u2030\u2039\u2122]/g,
  /\uFFFD/g,
]

function walk(entry, out = []) {
  if (!fs.existsSync(entry)) return out
  const stat = fs.statSync(entry)
  if (stat.isFile()) {
    out.push(entry)
    return out
  }
  for (const name of fs.readdirSync(entry)) {
    walk(path.join(entry, name), out)
  }
  return out
}

function hasSuspiciousCyrillic(text) {
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (!code) continue
    if (code >= 0x0400 && code <= 0x045F && !ALLOWED_RU.has(ch)) {
      return true
    }
  }
  return false
}

const files = TARGETS.flatMap((t) => walk(t)).filter((file) => {
  const ext = path.extname(file).toLowerCase()
  return EXT.has(ext)
})

const issues = []
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const badSeq = BAD_SEQ.some((rx) => {
    rx.lastIndex = 0
    return rx.test(text)
  })
  if (badSeq || hasSuspiciousCyrillic(text)) {
    issues.push(path.relative(ROOT, file))
  }
}

if (issues.length) {
  console.error('[guard:mojibake] Found suspicious encoding artifacts:')
  for (const f of issues) console.error(` - ${f}`)
  process.exit(1)
}

console.log('[guard:mojibake] OK')
