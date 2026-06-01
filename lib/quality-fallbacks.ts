/**
 * Safe image fallbacks for the quality gate. When a section declares an
 * image slot but Pexels returned nothing (rate limit, no key, no match),
 * we still need to hand the renderer a valid `SectionImage` so the slot
 * does not collapse / read as broken.
 *
 * We use SVG data URLs. They are zero-bytes-network, never 404, and the
 * gradient looks like a real editorial brand background. The renderer's
 * <Img> component composites these on top of its own gradient placeholder,
 * so even if a downstream consumer's loader is strict, the section never
 * renders empty.
 */

import type { SectionImage } from '@/components/sections/types'

export type Orientation = 'landscape' | 'portrait' | 'squarish'

const GRADIENTS = [
  { from: '#1c1b18', mid: '#3a342a', to: '#c0552c' },
  { from: '#0c0f1d', mid: '#1a1f33', to: '#d8b46a' },
  { from: '#161312', mid: '#2a221f', to: '#c98b58' },
  { from: '#1a2820', mid: '#0e1612', to: '#c7a04c' },
  { from: '#22262d', mid: '#4d6a8c', to: '#dde0e6' },
  { from: '#3c2a1f', mid: '#7f3b2d', to: '#e9dcc7' },
] as const

const DIMS: Record<Orientation, { w: number; h: number }> = {
  landscape: { w: 1600, h: 1000 },
  portrait: { w: 1000, h: 1400 },
  squarish: { w: 1200, h: 1200 },
}

function gradientFor(seed: number) {
  return GRADIENTS[Math.abs(seed) % GRADIENTS.length]
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

/**
 * Build an SVG data URL gradient. Used when no real photo can be found.
 * Always passes `<Image>` validation (data: scheme is allowed unoptimized).
 */
export function fallbackImageDataUrl(orientation: Orientation, seed: string): string {
  const { w, h } = DIMS[orientation]
  const g = gradientFor(hashSeed(seed))
  // Keep the SVG compact — large data URLs slow first paint.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${g.from}'/><stop offset='55%' stop-color='${g.mid}'/><stop offset='100%' stop-color='${g.to}'/></linearGradient></defs><rect width='${w}' height='${h}' fill='url(#g)'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function fallbackSectionImage(orientation: Orientation, seed: string): SectionImage {
  return {
    url: fallbackImageDataUrl(orientation, seed),
    alt: 'Editorial placeholder',
  }
}
