/**
 * Minimal WCAG contrast utilities. Used to validate generated themes
 * so we never render light-on-light or dark-on-dark, and to detect
 * when a hero image needs a stronger overlay for legibility.
 */

/** Parse "#rrggbb", "#rgb", or "rgba(r,g,b,a)" to {r,g,b,a}. */
function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const s = input.trim()
  if (s.startsWith('#')) {
    const hex = s.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return Number.isFinite(r) ? { r, g, b, a: 1 } : null
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return Number.isFinite(r) ? { r, g, b, a: 1 } : null
    }
    return null
  }
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i)
  if (m) {
    return {
      r: +m[1],
      g: +m[2],
      b: +m[3],
      a: m[4] ? +m[4] : 1,
    }
  }
  return null
}

/** Composite a color (with alpha) onto an opaque background to get the
 *  effective rendered color. Used for tokens like ink-2 / mute which are
 *  typically defined as `rgba(...)` over the theme bg. */
function composite(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number },
): { r: number; g: number; b: number } {
  const a = fg.a
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
  }
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
}

/** WCAG contrast ratio between two colors. `bg` must be opaque; `fg`
 *  may be rgba and will be composited onto bg before measuring. */
export function contrastRatio(fg: string, bg: string): number {
  const f = parseColor(fg)
  const b = parseColor(bg)
  if (!f || !b) return 1
  const fOpaque = composite(f, b)
  const L1 = relLuminance(fOpaque)
  const L2 = relLuminance(b)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function isLight(color: string): boolean {
  const c = parseColor(color)
  if (!c) return false
  return relLuminance(c) > 0.5
}

export const WCAG_AA_TEXT = 4.5
export const WCAG_AA_LARGE = 3.0

export interface ContrastIssue {
  pair: string
  ratio: number
  required: number
}

/** Validate the readability of the core token pairs. Returns the list
 *  of pairs that fail; an empty list means the theme is readable. */
export function findContrastIssues(theme: {
  bg: string
  ink: string
  ink2?: string
  accent: string
  onAccent: string
  bgAccent: string
}): ContrastIssue[] {
  const issues: ContrastIssue[] = []
  const check = (pair: string, fg: string, bg: string, required: number) => {
    const r = contrastRatio(fg, bg)
    if (r < required) issues.push({ pair, ratio: round(r), required })
  }
  check('ink/bg', theme.ink, theme.bg, WCAG_AA_TEXT)
  if (theme.ink2) check('ink2/bg', theme.ink2, theme.bg, WCAG_AA_LARGE)
  check('onAccent/accent', theme.onAccent, theme.accent, WCAG_AA_TEXT)
  check('ink/bgAccent', theme.ink, theme.bgAccent, WCAG_AA_LARGE)
  return issues
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
