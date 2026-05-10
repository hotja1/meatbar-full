import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const assetsDir = path.resolve(root, 'public', 'assets')

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

let made = 0

function walk(dir, out = []) {
  if (!exists(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.resolve(dir, entry.name)
    if (entry.isDirectory()) {
      walk(p, out)
      continue
    }
    if (/\.webp$/i.test(entry.name)) out.push(p)
  }
  return out
}

for (const src of walk(assetsDir)) {
  const out = src.replace(/\.webp$/i, '.avif')
  if (exists(out)) continue

  // AVIF via libaom-av1 in still-picture mode.
  // Keep quality high to preserve the premium photo look.
  runFfmpeg([
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-i', src,
    '-frames:v', '1',
    '-c:v', 'libaom-av1',
    '-still-picture', '1',
    '-crf', '28',
    '-cpu-used', '6',
    '-pix_fmt', 'yuv420p',
    out,
  ])
  made += 1
}

console.log(`[avif] generated ${made} files (skipped existing/missing)`)
