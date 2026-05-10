import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const assetsRoot = path.resolve(root, 'public', 'assets')

const targets = [
  path.resolve(assetsRoot, 'menu'),
  path.resolve(assetsRoot, 'bar'),
]

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

function runFfmpeg(args) {
  const r = spawnSync('ffmpeg.exe', args, { stdio: 'inherit' })
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed with code ${r.status}`)
  }
}

function listWebp(dir) {
  if (!exists(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => /\.webp$/i.test(name))
    .filter((name) => !/-sm\.webp$/i.test(name))
    .map((name) => path.resolve(dir, name))
}

let made = 0
for (const dir of targets) {
  const files = listWebp(dir)
  for (const src of files) {
    const out = src.replace(/\.webp$/i, '-sm.webp')
    if (exists(out)) continue

    // 480w is enough for mobile cards; keeps decode + download light.
    runFfmpeg([
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', src,
      '-vf', 'scale=480:-2',
      '-frames:v', '1',
      '-c:v', 'libwebp',
      // Keep quality high; the win is the smaller target resolution.
      '-q:v', '82',
      '-preset', 'picture',
      out,
    ])
    made += 1
  }
}

console.log(`[webp-sm] generated ${made} files (skipped existing/missing)`)

