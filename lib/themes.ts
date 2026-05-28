export interface ThemeTokens {
  mode: 'dark' | 'light'
  bg: string
  bgAccent: string
  bgDeep: string
  surface: string
  surfaceEdge: string
  ink: string
  ink2: string
  mute: string
  accent: string
  onAccent: string
  fontDisplay: string
  fontBody: string
}

export const THEME_PRESETS: Record<string, ThemeTokens> = {
  'editorial-cream': {
    mode: 'light',
    bg: '#f4ede0',
    bgAccent: '#1f1a13',
    bgDeep: '#1f1a13',
    surface: '#ebe2cf',
    surfaceEdge: 'rgba(31,26,19,0.12)',
    ink: '#1f1a13',
    ink2: '#5a5142',
    mute: 'rgba(31,26,19,0.16)',
    accent: '#c0552c',
    onAccent: '#fbf6ec',
    fontDisplay: 'Fraunces',
    fontBody: 'Inter',
  },
  'midnight-luxury': {
    mode: 'dark',
    bg: '#0c0f1d',
    bgAccent: '#1a1f33',
    bgDeep: '#06080f',
    surface: 'rgba(255,255,255,0.04)',
    surfaceEdge: 'rgba(255,255,255,0.10)',
    ink: '#f0e6d2',
    ink2: 'rgba(240,230,210,0.68)',
    mute: 'rgba(240,230,210,0.16)',
    accent: '#d8b46a',
    onAccent: '#0c0f1d',
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
  },
  'warm-sand': {
    mode: 'light',
    bg: '#e9dcc7',
    bgAccent: '#7f3b2d',
    bgDeep: '#3c2a1f',
    surface: '#dccfb8',
    surfaceEdge: 'rgba(60,42,31,0.16)',
    ink: '#3c2a1f',
    ink2: '#7a6450',
    mute: 'rgba(60,42,31,0.18)',
    accent: '#a85a32',
    onAccent: '#fbf6ec',
    fontDisplay: 'Instrument Serif',
    fontBody: 'Inter',
  },
  'fintech-minimal': {
    mode: 'light',
    bg: '#fafaf7',
    bgAccent: '#0a0c0f',
    bgDeep: '#0a0c0f',
    surface: '#ffffff',
    surfaceEdge: 'rgba(10,12,15,0.10)',
    ink: '#0a0c0f',
    ink2: '#535660',
    mute: 'rgba(10,12,15,0.10)',
    accent: '#2347ff',
    onAccent: '#ffffff',
    fontDisplay: 'Inter',
    fontBody: 'Inter',
  },
  'brutalist-concrete': {
    mode: 'light',
    bg: '#d6d2c8',
    bgAccent: '#1c1b18',
    bgDeep: '#1c1b18',
    surface: '#c8c4ba',
    surfaceEdge: 'rgba(28,27,24,0.22)',
    ink: '#1c1b18',
    ink2: '#4a4844',
    mute: 'rgba(28,27,24,0.22)',
    accent: '#e53528',
    onAccent: '#ffffff',
    fontDisplay: 'DM Serif Display',
    fontBody: 'Inter',
  },
  'editorial-noir': {
    mode: 'dark',
    bg: '#161312',
    bgAccent: '#2a221f',
    bgDeep: '#0d0b0a',
    surface: 'rgba(255,240,220,0.05)',
    surfaceEdge: 'rgba(255,240,220,0.12)',
    ink: '#f4ead8',
    ink2: 'rgba(244,234,216,0.65)',
    mute: 'rgba(244,234,216,0.18)',
    accent: '#c98b58',
    onAccent: '#161312',
    fontDisplay: 'Fraunces',
    fontBody: 'Inter',
  },
  'metallic-mono': {
    mode: 'light',
    bg: '#e7e9ec',
    bgAccent: '#22262d',
    bgDeep: '#22262d',
    surface: '#dde0e6',
    surfaceEdge: 'rgba(34,38,45,0.14)',
    ink: '#22262d',
    ink2: '#5b6172',
    mute: 'rgba(34,38,45,0.14)',
    accent: '#4d6a8c',
    onAccent: '#ffffff',
    fontDisplay: 'Inter',
    fontBody: 'Inter',
  },
  'forest-luxe': {
    mode: 'dark',
    bg: '#1a2820',
    bgAccent: '#0e1612',
    bgDeep: '#0a110d',
    surface: 'rgba(238,230,210,0.05)',
    surfaceEdge: 'rgba(238,230,210,0.12)',
    ink: '#ede5cb',
    ink2: 'rgba(237,229,203,0.66)',
    mute: 'rgba(237,229,203,0.18)',
    accent: '#c7a04c',
    onAccent: '#1a2820',
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
  },
}

export const DEFAULT_THEME_KEY = 'editorial-cream'
export const DEFAULT_THEME = THEME_PRESETS[DEFAULT_THEME_KEY]
export const THEME_KEYS = Object.keys(THEME_PRESETS)

export function resolveTheme(input?: Partial<ThemeTokens> & { preset?: string }): ThemeTokens {
  if (!input) return DEFAULT_THEME
  const base =
    input.preset && THEME_PRESETS[input.preset] ? THEME_PRESETS[input.preset] : DEFAULT_THEME
  const merged: ThemeTokens = { ...base, ...stripPreset(input) }

  // Contrast guard: if a custom override broke ink/bg or onAccent/accent
  // readability, fall back to the preset's safe defaults for those tokens
  // while keeping the rest of the override (e.g. fonts).
  // Imported lazily to avoid a hard dependency cycle in tooling contexts.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { findContrastIssues } = require('./contrast') as typeof import('./contrast')
  const issues = findContrastIssues(merged)
  if (issues.length === 0) return merged

  console.warn(
    `[fiecom/theme] contrast issues — reverting affected tokens to "${input.preset ?? DEFAULT_THEME_KEY}" defaults:`,
    issues.map((i) => `${i.pair} ${i.ratio} (needs ${i.required})`).join(', '),
  )

  // Token-level fallback: for each failing pair, restore the offending
  // tokens from the preset base. We're conservative and only revert the
  // foreground side (ink, ink2, onAccent) since those are the contrast
  // problem in 95%+ of real overrides.
  const fixed: ThemeTokens = { ...merged }
  for (const issue of issues) {
    if (issue.pair === 'ink/bg' || issue.pair === 'ink/bgAccent') fixed.ink = base.ink
    if (issue.pair === 'ink2/bg') fixed.ink2 = base.ink2
    if (issue.pair === 'onAccent/accent') {
      fixed.onAccent = base.onAccent
      // If the accent itself is the problem (very common with custom
      // pastel accents), revert it too.
      if (findContrastIssues(fixed).some((i) => i.pair === 'onAccent/accent')) {
        fixed.accent = base.accent
      }
    }
  }
  return fixed
}

function stripPreset(o: Partial<ThemeTokens> & { preset?: string }): Partial<ThemeTokens> {
  const { preset: _p, ...rest } = o
  return rest
}
