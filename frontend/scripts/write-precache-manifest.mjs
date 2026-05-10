import fs from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(process.cwd(), 'dist')
const assetsDir = path.resolve(distDir, 'assets')
const outFile = path.resolve(distDir, 'precache-manifest.json')

function listAssets() {
  if (!fs.existsSync(assetsDir)) return []
  const entries = fs.readdirSync(assetsDir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    // Precache only resources that the SW can serve safely.
    .filter((name) => /\.(?:js|css|svg|webmanifest)$/i.test(name))
    .map((name) => `/assets/${name}`)
  files.sort()
  return files
}

const manifest = listAssets()
fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
console.log(`[precache] wrote ${manifest.length} entries to dist/precache-manifest.json`)

