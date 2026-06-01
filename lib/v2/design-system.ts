/**
 * Stage 2 — Build a complete design system from the brief.
 *
 * The system is the SOURCE OF TRUTH for every visual choice — colors,
 * typography, spacing, radius, motion, imagery, and what families of
 * components are eligible. Components later in the pipeline read from
 * this system; they do NOT make their own visual decisions.
 *
 * Deterministic. No AI call here — the brief already captured the AI
 * judgment, and the system is just a structured mapping from the brief.
 */

import type {
  Brief,
  ColorSystem,
  DesignSystem,
  ImageSystem,
  MotionSystem,
  RadiusSystem,
  SpacingSystem,
  TypographySystem,
} from './types'
import type { ComponentId } from '../registry'

// ── Per-archetype palettes ─────────────────────────────────────────
// Each archetype has 1-2 palette options. The brief's visualAmbition
// picks between them when there's a choice. Custom RGB values keep
// palettes visually distinct across archetypes; the renderer reads
// these directly as CSS custom properties.

interface Palette extends ColorSystem {
  label: string
}

const PALETTES: Record<string, Palette[]> = {
  saas: [
    {
      label: 'modern-light',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#2347ff',
      onAccent: '#ffffff',
    },
  ],
  'ai-startup': [
    {
      label: 'electric-light',
      mode: 'light',
      bg: '#f7f7fa',
      ink: '#0b0b13',
      ink2: '#4a4a55',
      bgAccent: '#0b0b13',
      bgDeep: '#06060c',
      surface: '#ffffff',
      surfaceEdge: 'rgba(11,11,19,0.12)',
      mute: 'rgba(11,11,19,0.10)',
      accent: '#6e3bff',
      onAccent: '#ffffff',
    },
  ],
  fintech: [
    {
      label: 'fintech-blue',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#1d4ed8',
      onAccent: '#ffffff',
    },
  ],
  hospitality: [
    {
      label: 'warm-sand',
      mode: 'light',
      bg: '#e9dcc7',
      ink: '#3c2a1f',
      ink2: '#7a6450',
      bgAccent: '#7f3b2d',
      bgDeep: '#3c2a1f',
      surface: '#dccfb8',
      surfaceEdge: 'rgba(60,42,31,0.18)',
      mute: 'rgba(60,42,31,0.18)',
      accent: '#a85a32',
      onAccent: '#fbf6ec',
    },
    {
      label: 'midnight-luxury',
      mode: 'dark',
      bg: '#0c0f1d',
      ink: '#f0e6d2',
      ink2: 'rgba(240,230,210,0.68)',
      bgAccent: '#1a1f33',
      bgDeep: '#06080f',
      surface: 'rgba(255,255,255,0.04)',
      surfaceEdge: 'rgba(255,255,255,0.10)',
      mute: 'rgba(240,230,210,0.16)',
      accent: '#d8b46a',
      onAccent: '#0c0f1d',
    },
  ],
  restaurant: [
    {
      label: 'warm-clay',
      mode: 'light',
      bg: '#efe7d9',
      ink: '#2d1d12',
      ink2: '#7a5b41',
      bgAccent: '#5c2a18',
      bgDeep: '#2d1d12',
      surface: '#e3d6c1',
      surfaceEdge: 'rgba(45,29,18,0.20)',
      mute: 'rgba(45,29,18,0.20)',
      accent: '#b85a2a',
      onAccent: '#fbf6ec',
    },
  ],
  fashion: [
    {
      label: 'noir-ivory',
      mode: 'dark',
      bg: '#0d0c0b',
      ink: '#f4ead8',
      ink2: 'rgba(244,234,216,0.65)',
      bgAccent: '#1c1a18',
      bgDeep: '#06050a',
      surface: 'rgba(244,234,216,0.06)',
      surfaceEdge: 'rgba(244,234,216,0.14)',
      mute: 'rgba(244,234,216,0.18)',
      accent: '#c98b58',
      onAccent: '#0d0c0b',
    },
    {
      label: 'cream-noir',
      mode: 'light',
      bg: '#f4ede0',
      ink: '#1f1a13',
      ink2: '#5a5142',
      bgAccent: '#1f1a13',
      bgDeep: '#0d0c0b',
      surface: '#ebe2cf',
      surfaceEdge: 'rgba(31,26,19,0.14)',
      mute: 'rgba(31,26,19,0.16)',
      accent: '#1f1a13',
      onAccent: '#f4ede0',
    },
  ],
  'creative-studio': [
    {
      label: 'studio-noir',
      mode: 'dark',
      bg: '#161312',
      ink: '#f4ead8',
      ink2: 'rgba(244,234,216,0.65)',
      bgAccent: '#2a221f',
      bgDeep: '#0d0b0a',
      surface: 'rgba(255,240,220,0.05)',
      surfaceEdge: 'rgba(255,240,220,0.12)',
      mute: 'rgba(244,234,216,0.18)',
      accent: '#c98b58',
      onAccent: '#161312',
    },
  ],
  architecture: [
    {
      label: 'metallic-mono',
      mode: 'light',
      bg: '#e7e9ec',
      ink: '#22262d',
      ink2: '#5b6172',
      bgAccent: '#22262d',
      bgDeep: '#22262d',
      surface: '#dde0e6',
      surfaceEdge: 'rgba(34,38,45,0.14)',
      mute: 'rgba(34,38,45,0.14)',
      accent: '#4d6a8c',
      onAccent: '#ffffff',
    },
  ],
  ecommerce: [
    {
      label: 'cream-noir',
      mode: 'light',
      bg: '#f4ede0',
      ink: '#1f1a13',
      ink2: '#5a5142',
      bgAccent: '#1f1a13',
      bgDeep: '#1f1a13',
      surface: '#ebe2cf',
      surfaceEdge: 'rgba(31,26,19,0.12)',
      mute: 'rgba(31,26,19,0.16)',
      accent: '#c0552c',
      onAccent: '#fbf6ec',
    },
  ],
  wellness: [
    {
      label: 'forest-luxe',
      mode: 'dark',
      bg: '#1a2820',
      ink: '#ede5cb',
      ink2: 'rgba(237,229,203,0.66)',
      bgAccent: '#0e1612',
      bgDeep: '#0a110d',
      surface: 'rgba(238,230,210,0.05)',
      surfaceEdge: 'rgba(238,230,210,0.12)',
      mute: 'rgba(237,229,203,0.18)',
      accent: '#c7a04c',
      onAccent: '#1a2820',
    },
  ],
  portfolio: [
    {
      label: 'editorial-noir',
      mode: 'dark',
      bg: '#161312',
      ink: '#f4ead8',
      ink2: 'rgba(244,234,216,0.65)',
      bgAccent: '#2a221f',
      bgDeep: '#0d0b0a',
      surface: 'rgba(255,240,220,0.05)',
      surfaceEdge: 'rgba(255,240,220,0.12)',
      mute: 'rgba(244,234,216,0.18)',
      accent: '#c98b58',
      onAccent: '#161312',
    },
  ],
  health: [
    {
      label: 'calm-cream',
      mode: 'light',
      bg: '#f7f3ec',
      ink: '#1f1d1a',
      ink2: '#5a544c',
      bgAccent: '#1f1d1a',
      bgDeep: '#1f1d1a',
      surface: '#ede7da',
      surfaceEdge: 'rgba(31,29,26,0.12)',
      mute: 'rgba(31,29,26,0.14)',
      accent: '#3e7a5f',
      onAccent: '#ffffff',
    },
  ],
  education: [
    {
      label: 'cream-blue',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#0f5f9a',
      onAccent: '#ffffff',
    },
  ],
  event: [
    {
      label: 'cream-bright',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#e95c2a',
      onAccent: '#ffffff',
    },
  ],
  'product-launch': [
    {
      label: 'modern-light',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#0f7a3c',
      onAccent: '#ffffff',
    },
  ],
  b2b: [
    {
      label: 'classic-light',
      mode: 'light',
      bg: '#fafaf7',
      ink: '#0a0c0f',
      ink2: '#535660',
      bgAccent: '#0a0c0f',
      bgDeep: '#0a0c0f',
      surface: '#ffffff',
      surfaceEdge: 'rgba(10,12,15,0.10)',
      mute: 'rgba(10,12,15,0.10)',
      accent: '#1f2937',
      onAccent: '#ffffff',
    },
  ],
}

function pickPalette(brief: Brief): Palette {
  const options = PALETTES[brief.archetype] ?? PALETTES.b2b
  if (options.length === 1) return options[0]
  // visualAmbition picks between options when multiple exist.
  if (brief.archetype === 'fashion') {
    return brief.visualAmbition === 'editorial' ? options[0] : options[1]
  }
  if (brief.archetype === 'hospitality') {
    return brief.visualAmbition === 'cinematic' ? options[1] : options[0]
  }
  return options[0]
}

// ── Typography per archetype/voice ─────────────────────────────────

function buildTypography(brief: Brief): TypographySystem {
  type Voice = TypographySystem['voice']
  const voiceByArchetype: Record<string, Voice> = {
    saas: 'direct-claim',
    'ai-startup': 'direct-claim',
    fintech: 'technical-precise',
    hospitality: 'sensory-evocative',
    restaurant: 'warm-conversational',
    fashion: 'editorial-poetic',
    'creative-studio': 'editorial-poetic',
    architecture: 'technical-precise',
    ecommerce: 'sensory-evocative',
    portfolio: 'editorial-poetic',
    wellness: 'warm-conversational',
    health: 'warm-conversational',
    education: 'direct-claim',
    event: 'direct-claim',
    'product-launch': 'direct-claim',
    b2b: 'direct-claim',
  }
  const voice = voiceByArchetype[brief.archetype] ?? 'direct-claim'

  // Map voice → families. Display vs body.
  switch (voice) {
    case 'editorial-poetic':
      return {
        display: { family: 'Fraunces', weight: 500, scale: 1.0, tracking: '-0.02em' },
        body:    { family: 'Inter',    weight: 400, scale: 1.0 },
        eyebrow: { family: 'Inter',    tracking: '0.14em' },
        voice,
      }
    case 'sensory-evocative':
      return {
        display: { family: 'Playfair Display', weight: 500, scale: 1.0, tracking: '-0.02em' },
        body:    { family: 'Inter',            weight: 400, scale: 1.0 },
        eyebrow: { family: 'Inter',            tracking: '0.14em' },
        voice,
      }
    case 'warm-conversational':
      return {
        display: { family: 'Instrument Serif', weight: 400, scale: 1.0, tracking: '-0.01em' },
        body:    { family: 'Inter',            weight: 400, scale: 1.0 },
        eyebrow: { family: 'Inter',            tracking: '0.14em' },
        voice,
      }
    case 'technical-precise':
      return {
        display: { family: 'Inter', weight: 600, scale: 0.95, tracking: '-0.03em' },
        body:    { family: 'Inter', weight: 400, scale: 1.0 },
        eyebrow: { family: 'Inter', tracking: '0.14em' },
        voice,
      }
    case 'direct-claim':
    default:
      return {
        display: { family: 'Inter', weight: 600, scale: 1.0, tracking: '-0.025em' },
        body:    { family: 'Inter', weight: 400, scale: 1.0 },
        eyebrow: { family: 'Inter', tracking: '0.14em' },
        voice,
      }
  }
}

// ── Spacing / radius / motion / image ──────────────────────────────

function buildSpacing(brief: Brief): SpacingSystem {
  if (brief.visualAmbition === 'cinematic' || brief.visualAmbition === 'editorial') {
    return { sectionY: 'generous', contentGap: 'generous', maxWidth: 'wide' }
  }
  if (brief.visualAmbition === 'polished') {
    return { sectionY: 'balanced', contentGap: 'balanced', maxWidth: 'comfortable' }
  }
  return { sectionY: 'balanced', contentGap: 'balanced', maxWidth: 'comfortable' }
}

function buildRadius(brief: Brief): RadiusSystem {
  // Architecture / brutalist gets sharper corners.
  if (brief.archetype === 'architecture') return { pill: 999, card: 4, tile: 0 }
  if (brief.archetype === 'creative-studio' && brief.visualAmbition === 'editorial') return { pill: 999, card: 6, tile: 2 }
  if (brief.visualAmbition === 'restrained') return { pill: 999, card: 12, tile: 12 }
  return { pill: 999, card: 16, tile: 16 }
}

function buildMotion(brief: Brief): MotionSystem {
  switch (brief.visualAmbition) {
    case 'restrained':
      return { level: 'still', maxImageScale: 1.0, parallaxAllowed: false, scrollPinningAllowed: false, cinematicBudget: 0 }
    case 'polished':
      return { level: 'subtle', maxImageScale: 1.02, parallaxAllowed: false, scrollPinningAllowed: false, cinematicBudget: 1 }
    case 'editorial':
      return { level: 'moderate', maxImageScale: 1.03, parallaxAllowed: true, scrollPinningAllowed: true, cinematicBudget: 4 }
    case 'cinematic':
      return { level: 'rich', maxImageScale: 1.03, parallaxAllowed: true, scrollPinningAllowed: true, cinematicBudget: 5 }
  }
}

function buildImage(brief: Brief): ImageSystem {
  const vocab: Record<string, string> = {
    saas: 'minimal modern dashboard product detail',
    'ai-startup': 'clean software product detail abstract',
    fintech: 'minimal finance app interface chart abstract',
    hospitality: 'boutique hotel interior landscape texture detail',
    restaurant: 'warm restaurant dining wood oven seasonal food close-up',
    fashion: 'editorial fashion atelier fabric texture portrait',
    'creative-studio': 'editorial design studio architecture portrait',
    architecture: 'architectural interior concrete steel daylight detail',
    ecommerce: 'premium product photography texture material',
    portfolio: 'portfolio editorial work portrait detail',
    wellness: 'calm wellness spa botanical natural light',
    health: 'calm wellness clinic natural light',
    education: 'modern learning workshop classroom student detail',
    event: 'conference stage audience workshop modern venue',
    'product-launch': 'product detail clean modern interface',
    b2b: 'modern office workspace professional clean',
  }
  const avoid: Record<string, string[]> = {
    saas: ['business handshake', 'cliche office', 'stock people', 'staged meeting'],
    'ai-startup': ['robot illustration', 'AI brain illustration', 'cliche office'],
    fintech: ['stock money', 'cliche bank'],
    hospitality: ['business', 'office', 'corporate'],
    restaurant: ['fast food', 'staged photo', 'corporate'],
    fashion: ['stock model', 'tiktok influencer', 'business', 'office'],
    'creative-studio': ['stock people', 'business cliche', 'corporate'],
    architecture: ['decor stock', 'cliche modern home'],
    ecommerce: ['stock retail', 'mall', 'crowd'],
    portfolio: ['stock', 'business'],
    wellness: ['gym', 'clinical', 'stock fitness'],
    health: ['clinical', 'cold medical'],
    education: ['stock classroom', 'cliche student'],
    event: ['stock crowd', 'cliche'],
    'product-launch': ['stock people', 'office'],
    b2b: ['stock handshake', 'cliche'],
  }

  const treatmentByAmbition: Record<string, ImageSystem['heroTreatment']> = {
    restrained: 'framed',
    polished: 'framed',
    cinematic: 'full-bleed',
    editorial: 'split',
  }
  // Override per archetype where the convention is stronger.
  let heroTreatment = treatmentByAmbition[brief.visualAmbition]
  if (brief.archetype === 'hospitality' && brief.visualAmbition === 'cinematic') heroTreatment = 'full-bleed'
  if (brief.archetype === 'fashion') heroTreatment = 'full-bleed'
  if (brief.archetype === 'restaurant') heroTreatment = 'split'

  const density: ImageSystem['density'] =
    brief.visualAmbition === 'cinematic' || brief.visualAmbition === 'editorial' ? 'heavy'
    : brief.visualAmbition === 'polished' ? 'light'
    : 'none'

  return {
    vocabulary: vocab[brief.archetype] ?? 'premium brand detail',
    avoid: avoid[brief.archetype] ?? ['stock', 'cliche'],
    heroTreatment,
    density,
  }
}

// ── Family / cinematic preferences ─────────────────────────────────

function buildFamilies(brief: Brief): { preferredFamilies: string[]; forbiddenComponents: ComponentId[]; preferredCinematic: ComponentId[] } {
  const ambition = brief.visualAmbition

  // Forbidden cinematic for restrained/polished. Architecture/Fashion etc.
  // get to keep their family-specific cinematic.
  if (ambition === 'restrained') {
    return {
      preferredFamilies: ['baseline'],
      preferredCinematic: [],
      forbiddenComponents: ['HeroCinematic', 'HeroEditorial', 'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero', 'MessageReveal', 'ImageGallery', 'HorizontalShowcase', 'AsymmetricGrid', 'StickyNarrative', 'MarqueeBand', 'EditorialQuote', 'TruusShowreel', 'TruusHorizontalWords', 'ZentryStory'],
    }
  }
  if (ambition === 'polished') {
    return {
      preferredFamilies: ['baseline'],
      preferredCinematic: ['EditorialQuote'],
      forbiddenComponents: ['HeroCinematic', 'HeroEditorial', 'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero', 'ImageGallery', 'HorizontalShowcase', 'StickyNarrative', 'MarqueeBand', 'TruusShowreel'],
    }
  }

  // editorial / cinematic
  if (brief.archetype === 'fashion' || brief.archetype === 'creative-studio' || brief.archetype === 'portfolio') {
    return {
      preferredFamilies: ['baseline', 'editorial', 'showcase'],
      preferredCinematic: ['HeroEditorial', 'MessageReveal', 'EditorialQuote', 'AsymmetricGrid', 'StickyNarrative', 'HorizontalShowcase', 'ImageGallery'],
      forbiddenComponents: ['SpyltHero', 'SpyltFlavor', 'SpyltMessage', 'FlowHero', 'FlowEvent', 'MarqueeBand'],
    }
  }
  if (brief.archetype === 'hospitality') {
    return {
      preferredFamilies: ['baseline', 'luxury', 'showcase'],
      preferredCinematic: ['HeroCinematic', 'MessageReveal', 'ImageGallery', 'HorizontalShowcase', 'AsymmetricGrid', 'EditorialQuote', 'StickyNarrative'],
      forbiddenComponents: ['SpyltHero', 'SpyltFlavor', 'SpyltMessage', 'FlowHero', 'FlowEvent', 'MarqueeBand'],
    }
  }
  if (brief.archetype === 'restaurant') {
    return {
      preferredFamilies: ['baseline', 'editorial'],
      preferredCinematic: ['EditorialQuote', 'AsymmetricGrid', 'MessageReveal', 'ImageGallery'],
      forbiddenComponents: ['HeroCinematic', 'ZentryHero', 'SpyltHero', 'FlowHero', 'TruusVimeoHero', 'TruusShowreel', 'TruusDoubleMarquee', 'MarqueeBand'],
    }
  }
  if (brief.archetype === 'architecture') {
    return {
      preferredFamilies: ['baseline', 'editorial', 'showcase'],
      preferredCinematic: ['AsymmetricGrid', 'StickyNarrative', 'EditorialQuote', 'HorizontalShowcase', 'ImageGallery', 'MessageReveal'],
      forbiddenComponents: ['SpyltHero', 'SpyltFlavor', 'FlowHero', 'TruusDoubleMarquee', 'MarqueeBand'],
    }
  }
  // default editorial set
  return {
    preferredFamilies: ['baseline', 'editorial'],
    preferredCinematic: ['EditorialQuote', 'MessageReveal'],
    forbiddenComponents: ['SpyltHero', 'FlowHero', 'TruusVimeoHero', 'MarqueeBand'],
  }
}

// ── Public entry ───────────────────────────────────────────────────

export function buildDesignSystem(brief: Brief): DesignSystem {
  const palette = pickPalette(brief)
  const typography = buildTypography(brief)
  const spacing = buildSpacing(brief)
  const radius = buildRadius(brief)
  const motion = buildMotion(brief)
  const image = buildImage(brief)
  const families = buildFamilies(brief)
  const layoutDensity = brief.contentDepth === 'rich' ? 'tight' :
                       brief.contentDepth === 'minimal' ? 'generous' : 'balanced'
  const contrast = { minBodyRatio: 4.5, minLargeRatio: 3.0 }

  return {
    colors: stripLabel(palette),
    typography,
    spacing,
    radius,
    motion,
    image,
    layoutDensity,
    contrast,
    preferredFamilies: families.preferredFamilies,
    forbiddenComponents: families.forbiddenComponents,
    preferredCinematic: families.preferredCinematic,
  }
}

function stripLabel(p: Palette): ColorSystem {
  const { label: _label, ...rest } = p
  return rest
}

export function describeDesignSystem(ds: DesignSystem): string {
  return [
    `palette=${ds.colors.mode}(${ds.colors.bg}/${ds.colors.ink}/${ds.colors.accent})`,
    `typo=${ds.typography.display.family}/${ds.typography.body.family} voice=${ds.typography.voice}`,
    `motion=${ds.motion.level} budget=${ds.motion.cinematicBudget}`,
    `image=${ds.image.heroTreatment} density=${ds.image.density}`,
    `families=${ds.preferredFamilies.join('+')}`,
  ].join('  ')
}
