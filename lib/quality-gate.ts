/**
 * Hard quality gate. Runs AFTER orchestrate-assets (every image slot has
 * been attempted) and BEFORE savePreview / render. Two responsibilities:
 *
 *   1. Detect every quality failure (contrast, missing images, overflow-
 *      prone text, repeated components, broken chrome, missing required
 *      content).
 *   2. Repair what is safely repairable so the preview and published
 *      routes render the same stable output.
 *
 * The gate returns `{ config, issues, pass }`. `pass` is true when no
 * `fail`-level issue remains after the repair pass. The verification
 * script (scripts/verify-quality.ts) treats `pass: false` as a hard fail.
 */

import { contrastRatio, WCAG_AA_LARGE, WCAG_AA_TEXT } from './contrast'
import { SECTION_META, type ComponentId } from './registry'
import { THEME_PRESETS, DEFAULT_THEME_KEY } from './themes'
import { fallbackSectionImage, type Orientation } from './quality-fallbacks'
import type { ResolvedConfig, ResolvedPage, ResolvedSection } from './orchestrate-assets'
import type { SectionImage } from '@/components/sections/types'

export type QualityCategory =
  | 'contrast'
  | 'image'
  | 'chrome'
  | 'repetition'
  | 'overflow'
  | 'scale'
  | 'content'
  | 'render'

export interface QualityIssue {
  level: 'fail' | 'warn' | 'fixed'
  category: QualityCategory
  page?: string
  section?: string
  message: string
}

export interface QualityResult {
  config: ResolvedConfig
  issues: QualityIssue[]
  pass: boolean
}

const NAVBAR_IDS: ReadonlySet<ComponentId> = new Set<ComponentId>(['BaselineNavbar'])
const FOOTER_IDS: ReadonlySet<ComponentId> = new Set<ComponentId>([
  'BaselineFooter',
  'FlowFooter',
  'SpyltFooter',
  'TruusFooter',
  'ZentryFooter',
])

const HERO_IDS: ReadonlySet<ComponentId> = new Set<ComponentId>([
  'BaselineHero', 'HeroCinematic', 'HeroEditorial',
  'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero',
  'BaselinePageHeader',
])

const STRING_LIMITS = {
  headline: 120,
  eyebrow: 60,
  body: 320,
  quote: 300,
  caption: 140,
}

const MAX_TRANSFORM_SCALE = 1.03

/** Family map — used for diversity scoring. Mirrors composition-guard. */
const COMPONENT_FAMILY: Record<string, string> = {
  BaselineNavbar: 'chrome', BaselineFooter: 'chrome',
  ZentryFooter: 'chrome', FlowFooter: 'chrome', SpyltFooter: 'chrome', TruusFooter: 'chrome',
  BaselineHero: 'hero', HeroCinematic: 'hero', HeroEditorial: 'hero',
  ZentryHero: 'hero', FlowHero: 'hero', SpyltHero: 'hero', TruusVimeoHero: 'hero',
  BaselinePageHeader: 'page-header', PageHeader: 'page-header',
  BaselineFeatures: 'features', BaselineLogoBar: 'social',
  BaselineTestimonials: 'social', BaselineCTA: 'closing',
  BaselineAboutNarrative: 'narrative', BaselineContact: 'closing',
  MessageReveal: 'editorial', TruusHorizontalWords: 'editorial',
  ZentryStory: 'editorial', EditorialQuote: 'editorial',
  StickyNarrative: 'editorial',
  ImageGallery: 'showcase', HorizontalShowcase: 'showcase',
  TruusShowreel: 'showcase', ZentryFeatures: 'showcase',
  AsymmetricGrid: 'showcase',
  SpyltFlavor: 'playful', SpyltMessage: 'playful',
  SpyltBottomBanner: 'playful', SpyltNutrition: 'playful',
  SpyltBenefit: 'playful',
  FlowEvent: 'experience', FlowWhoWeAre: 'experience',
  FlowOnDemand: 'experience', FlowTutors: 'experience',
  FlowWhatWeDo: 'experience', FlowPartyTools: 'experience',
  ZentryAbout: 'luxury', ZentryContact: 'luxury',
  TruusMotionCards: 'luxury',
  SpyltTestimonials: 'social', TruusDoubleMarquee: 'social',
  MarqueeBand: 'punctuation',
  PricingTiers: 'commerce', FAQAccordion: 'utility',
  ContactBlock: 'closing', ContactForm: 'utility',
  NewsletterSignup: 'utility', LogoCloud: 'social',
  FeatureList: 'features', MetricRow: 'utility',
  DataTable: 'utility', LinkList: 'utility',
  BlogIndex: 'utility', JobsList: 'utility',
  ChangelogList: 'utility', TwoColumnText: 'narrative',
}

const MAX_SAME_FAMILY_PER_PAGE = 2
const MAX_SAME_COMPONENT_PER_PAGE = 1

export function applyQualityGate(config: ResolvedConfig): QualityResult {
  const issues: QualityIssue[] = []

  const themeFixed = sanitizeTheme(config.theme, issues)
  const pages = (config.pages ?? []).map((page) => sanitizePage(page, themeFixed, issues))

  const out: ResolvedConfig = {
    ...config,
    theme: themeFixed,
    pages,
  }

  const pass = !issues.some((i) => i.level === 'fail')
  return { config: out, issues, pass }
}

// ── Theme sanitization ──────────────────────────────────────────────

function sanitizeTheme(
  theme: Record<string, string> | undefined,
  issues: QualityIssue[],
): Record<string, string> {
  const preset = theme?.preset && THEME_PRESETS[theme.preset]
    ? theme.preset
    : DEFAULT_THEME_KEY
  const base = THEME_PRESETS[preset]
  const merged: Record<string, string> = { ...base, ...(theme ?? {}), preset }

  // Only the pairs that actually render directly together. ink/bgAccent
  // and ink2/bg overlaps are handled at render time by readableOn, so we
  // don't flag them here.
  // CTA buttons are typically 15-18px medium weight — large-text threshold
  // is the right WCAG bar for onAccent/accent.
  const checks: Array<[string, string, string, number]> = [
    ['ink/bg', merged.ink, merged.bg, WCAG_AA_TEXT],
    ['onAccent/accent', merged.onAccent, merged.accent, WCAG_AA_LARGE],
  ]
  for (const [pair, fg, bg, required] of checks) {
    const ratio = contrastRatio(fg, bg)
    if (ratio < required) {
      issues.push({
        level: 'fixed',
        category: 'contrast',
        message: `theme ${pair} ratio ${ratio.toFixed(2)} < ${required} — reverted to preset "${preset}"`,
      })
      if (pair === 'ink/bg') merged.ink = base.ink
      if (pair === 'onAccent/accent') {
        merged.onAccent = base.onAccent
        merged.accent = base.accent
      }
    }
  }

  // Re-check; if still failing, fall back wholesale to default preset.
  const stillBad = checks.some(([_p, fg, bg, req]) => {
    const f = fg === 'ink/bg' ? merged.ink : fg
    const b = bg === 'ink/bg' ? merged.bg : bg
    void f; void b
    return false
  })
  // Simple direct re-check after overrides:
  const inkOnBg = contrastRatio(merged.ink, merged.bg)
  const onAccentOnAccent = contrastRatio(merged.onAccent, merged.accent)
  if (inkOnBg < WCAG_AA_TEXT || onAccentOnAccent < WCAG_AA_LARGE) {
    issues.push({
      level: 'fixed',
      category: 'contrast',
      message: `theme contrast unresolvable — forced fallback to "${DEFAULT_THEME_KEY}"`,
    })
    return { ...THEME_PRESETS[DEFAULT_THEME_KEY], preset: DEFAULT_THEME_KEY }
  }
  void stillBad
  return merged
}

// ── Page sanitization ───────────────────────────────────────────────

function sanitizePage(
  page: ResolvedPage,
  _theme: Record<string, string>,
  issues: QualityIssue[],
): ResolvedPage {
  const slug = page.slug || 'home'
  let sections = (page.sections ?? []).filter((s) => s && s.id in SECTION_META)

  // Drop unknown/render-error sections (already filtered above), but log
  // anything that was dropped vs. the original count.
  if (sections.length !== (page.sections ?? []).length) {
    issues.push({
      level: 'fixed',
      category: 'render',
      page: slug,
      message: `dropped ${(page.sections ?? []).length - sections.length} unrenderable sections`,
    })
  }

  sections = enforceChrome(sections, slug, issues)
  sections = capRepetition(sections, slug, issues)
  sections = sections.map((s) => sanitizeSection(s, slug, issues))

  return { ...page, slug, sections }
}

function enforceChrome(
  sections: ResolvedSection[],
  slug: string,
  issues: QualityIssue[],
): ResolvedSection[] {
  const out = [...sections]
  const firstId = out[0]?.id as ComponentId | undefined
  const lastId = out[out.length - 1]?.id as ComponentId | undefined

  if (!firstId || !NAVBAR_IDS.has(firstId)) {
    out.unshift({ id: 'BaselineNavbar', content: { brand: '', links: [] } } as ResolvedSection)
    issues.push({
      level: 'fixed',
      category: 'chrome',
      page: slug,
      message: 'missing navbar — inserted BaselineNavbar',
    })
  }
  if (!lastId || !FOOTER_IDS.has(lastId)) {
    out.push({ id: 'BaselineFooter', content: { brand: '' } } as ResolvedSection)
    issues.push({
      level: 'fixed',
      category: 'chrome',
      page: slug,
      message: 'missing footer — inserted BaselineFooter',
    })
  }

  // Ensure exactly one hero (or page-header) appears after the navbar.
  const body = out.slice(1, -1)
  const heroCount = body.filter((s) => HERO_IDS.has(s.id as ComponentId)).length
  if (slug === 'home' && heroCount === 0) {
    out.splice(1, 0, { id: 'BaselineHero', content: { headline: 'Welcome' } } as ResolvedSection)
    issues.push({
      level: 'fixed',
      category: 'chrome',
      page: slug,
      message: 'missing hero — inserted BaselineHero',
    })
  }
  return out
}

function capRepetition(
  sections: ResolvedSection[],
  slug: string,
  issues: QualityIssue[],
): ResolvedSection[] {
  // Chrome (first navbar / last footer) is exempt from caps.
  if (sections.length <= 2) return sections
  const head = sections[0]
  const tail = sections[sections.length - 1]
  const body = sections.slice(1, -1)

  const componentCount = new Map<string, number>()
  const familyCount = new Map<string, number>()
  const kept: ResolvedSection[] = []

  for (const s of body) {
    const id = s.id as string
    const family = COMPONENT_FAMILY[id] ?? 'misc'
    const cc = componentCount.get(id) ?? 0
    const fc = familyCount.get(family) ?? 0
    if (cc >= MAX_SAME_COMPONENT_PER_PAGE) {
      issues.push({
        level: 'fixed',
        category: 'repetition',
        page: slug,
        section: id,
        message: `dropped duplicate component (${cc + 1} >= cap ${MAX_SAME_COMPONENT_PER_PAGE})`,
      })
      continue
    }
    if (family !== 'punctuation' && family !== 'misc' && fc >= MAX_SAME_FAMILY_PER_PAGE) {
      issues.push({
        level: 'fixed',
        category: 'repetition',
        page: slug,
        section: id,
        message: `dropped over-used family "${family}" (${fc + 1} >= cap ${MAX_SAME_FAMILY_PER_PAGE})`,
      })
      continue
    }
    componentCount.set(id, cc + 1)
    familyCount.set(family, fc + 1)
    kept.push(s)
  }
  return [head, ...kept, tail]
}

// ── Section sanitization ────────────────────────────────────────────

function sanitizeSection(
  s: ResolvedSection,
  slug: string,
  issues: QualityIssue[],
): ResolvedSection {
  const id = s.id as ComponentId
  const meta = SECTION_META[id]
  const content = clipTextFields(s.content ?? {}, slug, id, issues)
  const images = ensureImageSlots(id, meta, s.images, slug, issues)
  stripScaleAndZoom(content, slug, id, issues)
  ensureMinimumContent(id, content, slug, issues)
  return { id, content, images }
}

function clipTextFields(
  input: Record<string, unknown>,
  slug: string,
  id: ComponentId,
  issues: QualityIssue[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    out[k] = clipValue(k, v, slug, id, issues)
  }
  return out
}

function clipValue(
  key: string,
  v: unknown,
  slug: string,
  id: ComponentId,
  issues: QualityIssue[],
): unknown {
  if (typeof v === 'string') return clipString(key, v, slug, id, issues)
  if (Array.isArray(v)) return v.map((x) => clipValue(key, x, slug, id, issues))
  if (v && typeof v === 'object') {
    const inner: Record<string, unknown> = {}
    for (const [ik, iv] of Object.entries(v as Record<string, unknown>)) {
      inner[ik] = clipValue(ik, iv, slug, id, issues)
    }
    return inner
  }
  return v
}

function clipString(
  key: string,
  s: string,
  slug: string,
  id: ComponentId,
  issues: QualityIssue[],
): string {
  const k = key.toLowerCase()
  let limit: number | null = null
  if (k.includes('headline') || k === 'firstline' || k === 'secondline' || k === 'title' || k === 'subhead' || k === 'accent' || k === 'tagline' || k === 'giant') limit = STRING_LIMITS.headline
  else if (k === 'eyebrow' || k === 'label' || k === 'period' || k === 'meta' || k === 'category' || k === 'value' || k === 'price') limit = STRING_LIMITS.eyebrow
  else if (k === 'quote') limit = STRING_LIMITS.quote
  else if (k === 'body' || k === 'description' || k === 'excerpt' || k === 'a' || k === 'q' || k === 'statement' || k === 'formbody' || k === 'message') limit = STRING_LIMITS.body
  else if (k === 'caption') limit = STRING_LIMITS.caption

  if (limit && s.length > limit) {
    issues.push({
      level: 'fixed',
      category: 'overflow',
      page: slug,
      section: id,
      message: `clipped "${key}" from ${s.length} to ${limit} chars`,
    })
    return s.slice(0, limit - 1).trimEnd() + '…'
  }
  return s
}

function ensureImageSlots(
  id: ComponentId,
  meta: typeof SECTION_META[ComponentId] | undefined,
  images: ResolvedSection['images'] | undefined,
  slug: string,
  issues: QualityIssue[],
): ResolvedSection['images'] {
  if (!meta) return images
  const orientation = (meta.orientation ?? 'landscape') as Orientation
  const out: NonNullable<ResolvedSection['images']> = { ...(images ?? {}) }

  if (meta.primary && (!out.primary || !isUsableImage(out.primary))) {
    out.primary = fallbackSectionImage(orientation, `${id}-primary-${slug}`)
    issues.push({
      level: 'fixed',
      category: 'image',
      page: slug,
      section: id,
      message: 'missing primary image — used safe fallback',
    })
  }
  if (meta.secondary && (!out.secondary || !isUsableImage(out.secondary))) {
    out.secondary = fallbackSectionImage(orientation, `${id}-secondary-${slug}`)
    issues.push({
      level: 'fixed',
      category: 'image',
      page: slug,
      section: id,
      message: 'missing secondary image — used safe fallback',
    })
  }
  if (meta.gallery) {
    const expected = meta.gallery
    const have = Array.isArray(out.gallery) ? out.gallery.filter(isUsableImage) : []
    if (have.length < expected) {
      const padded = [...have]
      for (let i = have.length; i < expected; i++) {
        padded.push(fallbackSectionImage(orientation, `${id}-gallery-${slug}-${i}`))
      }
      out.gallery = padded
      issues.push({
        level: 'fixed',
        category: 'image',
        page: slug,
        section: id,
        message: `padded gallery from ${have.length} to ${expected} images with fallbacks`,
      })
    } else {
      out.gallery = have.slice(0, expected)
    }
  }

  return Object.keys(out).length ? out : undefined
}

function isUsableImage(img: SectionImage | undefined): img is SectionImage {
  if (!img) return false
  const u = (img.url ?? '').trim()
  if (!u) return false
  // Reject obviously broken URLs. data:, https:, http:, /, file: are OK.
  if (u.startsWith('javascript:')) return false
  return true
}

function stripScaleAndZoom(
  content: Record<string, unknown>,
  slug: string,
  id: ComponentId,
  issues: QualityIssue[],
): void {
  // Composer should never emit raw style overrides — strip if seen.
  if (typeof content.style === 'object' && content.style) {
    const style = content.style as Record<string, unknown>
    if (style.transform && typeof style.transform === 'string') {
      const m = style.transform.match(/scale\(([\d.]+)\)/)
      if (m && parseFloat(m[1]) > MAX_TRANSFORM_SCALE) {
        delete style.transform
        issues.push({
          level: 'fixed',
          category: 'scale',
          page: slug,
          section: id,
          message: `stripped runaway transform scale ${m[1]} > ${MAX_TRANSFORM_SCALE}`,
        })
      }
    }
    if (style.zoom && Number(style.zoom) > MAX_TRANSFORM_SCALE) {
      delete style.zoom
      issues.push({
        level: 'fixed',
        category: 'scale',
        page: slug,
        section: id,
        message: `stripped runaway zoom ${style.zoom} > ${MAX_TRANSFORM_SCALE}`,
      })
    }
  }
  // fontSize overrides above 96px count as overflow risk.
  if (typeof content.style === 'object' && content.style) {
    const style = content.style as Record<string, unknown>
    const fs = typeof style.fontSize === 'string' ? parseFloat(style.fontSize) : 0
    if (fs > 96) {
      style.fontSize = '96px'
      issues.push({
        level: 'fixed',
        category: 'overflow',
        page: slug,
        section: id,
        message: `clamped fontSize ${fs}px to 96px`,
      })
    }
  }
}

function ensureMinimumContent(
  id: ComponentId,
  content: Record<string, unknown>,
  slug: string,
  issues: QualityIssue[],
): void {
  // Surface broken-content failures as `fail` so the gate fails the
  // section instead of rendering an empty card grid.
  if (id === 'BaselineFeatures') {
    const items = Array.isArray(content.features)
      ? content.features
      : Array.isArray(content.items)
        ? content.items
        : []
    if (items.length < 1) {
      issues.push({
        level: 'fail',
        category: 'content',
        page: slug,
        section: id,
        message: 'BaselineFeatures has no items',
      })
    }
  }
  if (id === 'BaselineTestimonials') {
    const items = Array.isArray(content.testimonials)
      ? content.testimonials
      : Array.isArray(content.items)
        ? content.items
        : []
    if (items.length < 1) {
      issues.push({
        level: 'fail',
        category: 'content',
        page: slug,
        section: id,
        message: 'BaselineTestimonials has no items',
      })
    }
  }
  if (id === 'PricingTiers' && (!Array.isArray(content.tiers) || content.tiers.length < 1)) {
    issues.push({
      level: 'fail',
      category: 'content',
      page: slug,
      section: id,
      message: 'PricingTiers has no tiers',
    })
  }
  if (id === 'FAQAccordion' && (!Array.isArray(content.faqs) || content.faqs.length < 1)) {
    issues.push({
      level: 'fail',
      category: 'content',
      page: slug,
      section: id,
      message: 'FAQAccordion has no faqs',
    })
  }
  if (id === 'BaselineHero' || id === 'HeroCinematic' || id === 'HeroEditorial' || id === 'BaselinePageHeader') {
    const h = typeof content.headline === 'string' ? content.headline.trim() : ''
    if (!h) {
      content.headline = 'Welcome'
      issues.push({
        level: 'fixed',
        category: 'content',
        page: slug,
        section: id,
        message: 'missing headline — defaulted',
      })
    }
  }
}

/** Helpful one-liner summary for logs / verification scripts. */
export function summarizeIssues(issues: QualityIssue[]): string {
  if (issues.length === 0) return 'clean'
  const byCat = new Map<string, number>()
  let fails = 0
  for (const i of issues) {
    byCat.set(i.category, (byCat.get(i.category) ?? 0) + 1)
    if (i.level === 'fail') fails++
  }
  const parts = [...byCat.entries()].map(([c, n]) => `${c}:${n}`).join(' ')
  return `${issues.length} issues (${fails} fail) — ${parts}`
}
