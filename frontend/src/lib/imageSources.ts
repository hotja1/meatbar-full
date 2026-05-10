export function toAvif(src: string): string {
  return src.replace(/\.webp$/i, '.avif')
}

export function toSmWebp(src: string): string {
  return src.replace(/\.webp$/i, '-sm.webp')
}

export function toSmAvif(src: string): string {
  return toAvif(toSmWebp(src))
}

export function isWebp(src: string | undefined | null): src is string {
  return Boolean(src && /\.webp$/i.test(src))
}
