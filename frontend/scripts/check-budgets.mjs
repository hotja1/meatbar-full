import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const distAssets = path.resolve('dist', 'assets')
const jsGzipLimitKb = Number(process.env.JS_GZIP_LIMIT_KB ?? 103)
const cssGzipLimitKb = Number(process.env.CSS_GZIP_LIMIT_KB ?? 14.6)

function toKb(bytes) {
  return bytes / 1024
}

async function findLargestBySuffix(suffix) {
  const files = await readdir(distAssets)
  const matched = files.filter((file) => file.endsWith(suffix))
  let maxFile = null
  let maxSize = -1
  for (const file of matched) {
    const full = path.join(distAssets, file)
    const fileStat = await stat(full)
    if (fileStat.size > maxSize) {
      maxSize = fileStat.size
      maxFile = file
    }
  }
  return { file: maxFile, size: Math.max(0, maxSize) }
}

async function main() {
  const js = await findLargestBySuffix('.js.gz')
  const css = await findLargestBySuffix('.css.gz')
  const jsKb = toKb(js.size)
  const cssKb = toKb(css.size)

  const lines = [
    `[budgets] largest js.gz: ${js.file ?? 'n/a'} (${jsKb.toFixed(2)} KB)`,
    `[budgets] largest css.gz: ${css.file ?? 'n/a'} (${cssKb.toFixed(2)} KB)`,
    `[budgets] limits: js <= ${jsGzipLimitKb.toFixed(2)} KB, css <= ${cssGzipLimitKb.toFixed(2)} KB`,
  ]
  for (const line of lines) console.log(line)

  const jsOk = jsKb <= jsGzipLimitKb
  const cssOk = cssKb <= cssGzipLimitKb
  if (!jsOk || !cssOk) {
    if (!jsOk) {
      console.error(
        `[budgets] fail: js.gz ${jsKb.toFixed(2)} KB exceeds ${jsGzipLimitKb.toFixed(2)} KB`,
      )
    }
    if (!cssOk) {
      console.error(
        `[budgets] fail: css.gz ${cssKb.toFixed(2)} KB exceeds ${cssGzipLimitKb.toFixed(2)} KB`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log('[budgets] OK')
}

main().catch((error) => {
  console.error('[budgets] failed:', error?.message ?? error)
  process.exitCode = 1
})
