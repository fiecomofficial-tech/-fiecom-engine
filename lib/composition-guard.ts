import { contrastRatio, findContrastIssues } from './contrast'
import { COMPONENT_REGISTRY, SECTION_META, type ComponentId } from './registry'
import { DEFAULT_THEME_KEY, THEME_KEYS } from './themes'
import {
  fallbackSitePlan,
  type PagePlan,
  type SitePlan,
  type SiteIntent,
  type CinematicDimension,
} from './site-plan'

/**
 * Post-generation safety net for the composer output. The AI now plans
 * the site (Stage 1) and composes sections (Stage 2). The guard does
 * NOT force the AI's section sequence to match a hardcoded variant —
 * it only enforces three invariants:
 *
 *   1. Every page in the plan exists in the output.
 *   2. Every page has BaselineNavbar first and BaselineFooter last.
 *   3. Every CTA href resolves to a real page (no dead anchors).
 *
 * Content normalization (brand, email, nav links, footer columns,
 * recipient email) is also done here so individual sections never have
 * to know about plan-level facts.
 */

interface RawSection {
  id?: unknown
  content?: Record<string, unknown>
  imageQueries?: {
    primary?: string
    secondary?: string
    gallery?: string[]
  }
}

interface RawPage {
  slug?: string
  title?: string
  sections?: RawSection[]
}

interface RawConfig {
  theme?: Record<string, string>
  pages?: RawPage[]
  sections?: RawSection[]
  intent?: SiteIntent
}

/** All hero component IDs — used to detect heroes during page normalization. */
const ALL_HERO_IDS: ReadonlySet<string> = new Set([
  'HeroCinematic', 'HeroEditorial', 'BaselineHero',
  'ZentryHero', 'SpyltHero', 'FlowHero', 'TruusVimeoHero',
])

/** Chrome component IDs — first/last on every page. */
const NAVBAR_IDS: ReadonlySet<ComponentId> = new Set<ComponentId>(['BaselineNavbar'])
const FOOTER_IDS: ReadonlySet<ComponentId> = new Set<ComponentId>(['BaselineFooter'])

/** Heroes that count as "the page's hero" — either of these may open
 *  the home body, replacing BaselineHero. Coerced to BaselineHero only
 *  when none of these were chosen. */
const ALLOWED_HOME_HEROES: ReadonlySet<ComponentId> = new Set<ComponentId>([
  'BaselineHero', 'HeroEditorial', 'HeroCinematic',
  'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero',
])

/** Sections the AI may place in the home body (between Hero and CTA). */
const HOME_BODY_ALLOWED: ReadonlySet<ComponentId> = new Set<ComponentId>([
  // Heroes (composer chooses one)
  'BaselineHero', 'HeroEditorial', 'HeroCinematic',
  'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero',
  // Baseline body
  'BaselineLogoBar', 'BaselineFeatures', 'BaselineTestimonials',
  'BaselineCTA', 'BaselineAboutNarrative',
  // Functional blocks (Baseline-compatible)
  'PricingTiers', 'FAQAccordion', 'FeatureList', 'LogoCloud', 'TwoColumnText',
  'ContactBlock', 'MetricRow',
  // Cinematic enhancements (the safe 4)
  'MessageReveal', 'MarqueeBand', 'ImageGallery', 'HorizontalShowcase',
  // Imported cinematic template body sections
  'ZentryAbout', 'ZentryFeatures', 'ZentryStory', 'ZentryContact',
  'FlowEvent', 'FlowWhoWeAre', 'FlowOnDemand', 'FlowTutors',
  'FlowWhatWeDo', 'FlowPartyTools',
  'SpyltMessage', 'SpyltFlavor', 'SpyltNutrition', 'SpyltBenefit',
  'SpyltTestimonials', 'SpyltBottomBanner',
  'TruusHorizontalWords', 'TruusMotionCards', 'TruusShowreel',
  'TruusServiceCards', 'TruusDoubleMarquee',
])

/** Cinematic home-only enhancements. Capped by cinematicIntensity.
 *  Includes the safe 4 + alternate heroes + imported template families. */
const HOME_CINEMATIC: ReadonlySet<ComponentId> = new Set<ComponentId>([
  // Safe 4 (designed as inserts)
  'MessageReveal', 'MarqueeBand', 'ImageGallery', 'HorizontalShowcase',
  // Alternate cinematic heroes (count as 1 cinematic when chosen)
  'HeroEditorial', 'HeroCinematic',
  'ZentryHero', 'FlowHero', 'SpyltHero', 'TruusVimeoHero',
  // Imported cinematic body sections
  'ZentryAbout', 'ZentryFeatures', 'ZentryStory', 'ZentryContact',
  'FlowEvent', 'FlowWhoWeAre', 'FlowOnDemand', 'FlowTutors',
  'FlowWhatWeDo', 'FlowPartyTools',
  'SpyltMessage', 'SpyltFlavor', 'SpyltNutrition', 'SpyltBenefit',
  'SpyltTestimonials', 'SpyltBottomBanner',
  'TruusHorizontalWords', 'TruusMotionCards', 'TruusShowreel',
  'TruusServiceCards', 'TruusDoubleMarquee',
])

/** Cinematic component families. Pure body components only — heroes
 *  are picked separately. MarqueeBand is treated as universal
 *  punctuation usable across any family. */
type FamilyKey = 'editorial' | 'showcase' | 'playful' | 'experience' | 'luxury' | 'social'

const CINEMATIC_FAMILIES: Record<FamilyKey, ComponentId[]> = {
  editorial:  ['MessageReveal', 'TruusHorizontalWords', 'ZentryStory', 'HeroEditorial'],
  showcase:   ['ImageGallery', 'HorizontalShowcase', 'TruusShowreel', 'ZentryFeatures'],
  playful:    ['SpyltHero', 'SpyltFlavor', 'SpyltMessage', 'SpyltBottomBanner'],
  experience: ['FlowEvent', 'FlowWhoWeAre', 'FlowOnDemand', 'FlowTutors'],
  luxury:     ['HeroCinematic', 'ZentryHero', 'ZentryAbout', 'TruusVimeoHero'],
  social:     ['SpyltTestimonials', 'TruusDoubleMarquee', 'FlowTutors'],
}

/** Universal punctuation — usable across families regardless of industry. */
const PUNCTUATION_COMPONENTS: ComponentId[] = ['MarqueeBand']

/** Industry-keyword → families. First match wins. Listed most-specific
 *  first so e.g. "boutique hotel" matches before generic words. */
const INDUSTRY_FAMILIES: Array<{ pattern: RegExp; families: FamilyKey[] }> = [
  { pattern: /\b(hotel|resort|villa|spa|retreat|stay|travel|tourism|hospitality)\b/i,
    families: ['luxury', 'showcase'] },
  { pattern: /\b(fashion|atelier|couture|beauty|cosmet|skincare|lookbook|brand)\b/i,
    families: ['editorial', 'showcase'] },
  { pattern: /\b(restaurant|cafe|coffee|bakery|cupcake|pastry|patisserie|chocolate|ice ?cream|bar|brewery|food|drink|kitchen|chef)\b/i,
    families: ['playful', 'social'] },
  { pattern: /\b(event|conference|community|meetup|festival|tutor|coach|education|school|academy|bootcamp|course)\b/i,
    families: ['experience', 'social'] },
  { pattern: /\b(architect|interior|studio|agency|gallery|museum|film|photo|design|creative|portfolio)\b/i,
    families: ['editorial', 'showcase'] },
  { pattern: /\b(saas|b2b|devtool|developer|api|cloud|platform|fintech|finance|bank|payment|insurance|legal|health|clinic|medical|therapy)\b/i,
    families: ['editorial'] }, // restrained
]

/** Map industry/prompt to a ranked family list. Default is editorial +
 *  showcase, which works for "anything visual". */
function familiesForBrand(plan: SitePlan, prompt: string): FamilyKey[] {
  const haystack = `${plan.industry} ${prompt}`.toLowerCase()
  for (const { pattern, families } of INDUSTRY_FAMILIES) {
    if (pattern.test(haystack)) return families
  }
  return ['editorial', 'showcase']
}

/** Strict ComponentId validator: id must be a non-empty string AND
 *  appear in both COMPONENT_REGISTRY (renderable) and SECTION_META
 *  (catalogued for content/image defaults). Any pool / swap target /
 *  augmentation insert MUST pass this check before reaching the saved
 *  config — otherwise the renderer / orchestrator crashes downstream
 *  on `{ id: undefined }` or `meta.primary` on undefined. */
function isValidComponentId(id: unknown): id is ComponentId {
  return typeof id === 'string'
    && id.length > 0
    && id in COMPONENT_REGISTRY
    && id in SECTION_META
}

/** Deterministic seed derived from the prompt so two prompts produce
 *  different family rotations / starting offsets, but the same prompt
 *  is reproducible. */
function promptSeed(prompt: string): number {
  let h = 2166136261
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 *  HOMEPAGE SHAPE LIBRARY
 *  ──────────────────────
 *  Each family has 4 distinct full-shape templates (body only, hero-first,
 *  closing-CTA-last, no chrome). The picker chooses one shape per brand
 *  via `(seed >>> 12) % shapes.length`, then trims it to fit the
 *  cinematic cap. Two prompts in the same family pick different shapes
 *  because they hash to different seeds, so a "luxury hotel in Bali" and
 *  a "luxury resort in Aspen" do NOT produce the same section order.
 *
 *  Constraints baked into every shape:
 *    • starts with a hero (alternate hero allowed for cinematic-intensity
 *      ≥ moderate; else coerced to BaselineHero)
 *    • ends with BaselineCTA
 *    • baseline anchors (Features, Testimonials, AboutNarrative) appear
 *      at least once for grounding
 *    • cinematic sections are surrounded by baseline beats, never stacked
 *      three deep
 *    • MarqueeBand at most once across the shape, only in a few variants
 *    • LogoBar ONLY in shapes that explicitly opt in (and even then we
 *      omit the rendered section if there's no real client data)
 *    • shapes vary in length so density flows through cleanly. */
type HomeShape = readonly ComponentId[]

const SHAPES_BY_FAMILY: Record<FamilyKey, HomeShape[]> = {
  // Editorial: typography-led, asymmetric, sparse imagery
  editorial: [
    ['HeroEditorial', 'MessageReveal', 'BaselineFeatures', 'TruusHorizontalWords', 'ImageGallery', 'BaselineTestimonials', 'ZentryStory', 'BaselineCTA'],
    ['BaselineHero', 'MessageReveal', 'BaselineFeatures', 'HorizontalShowcase', 'BaselineTestimonials', 'BaselineCTA'],
    ['HeroEditorial', 'TruusHorizontalWords', 'BaselineFeatures', 'ZentryStory', 'ImageGallery', 'BaselineTestimonials', 'HorizontalShowcase', 'MessageReveal', 'BaselineCTA'],
    ['HeroEditorial', 'ZentryStory', 'BaselineFeatures', 'TruusHorizontalWords', 'ImageGallery', 'BaselineTestimonials', 'BaselineCTA'],
  ],
  // Showcase: image-led, dense visual storytelling
  showcase: [
    ['HeroCinematic', 'ImageGallery', 'BaselineFeatures', 'HorizontalShowcase', 'BaselineTestimonials', 'TruusShowreel', 'BaselineCTA'],
    ['HeroEditorial', 'HorizontalShowcase', 'BaselineFeatures', 'ImageGallery', 'BaselineTestimonials', 'ZentryFeatures', 'BaselineCTA'],
    ['TruusVimeoHero', 'TruusShowreel', 'BaselineFeatures', 'ImageGallery', 'BaselineTestimonials', 'HorizontalShowcase', 'BaselineCTA'],
    ['HeroCinematic', 'HorizontalShowcase', 'BaselineFeatures', 'TruusShowreel', 'ImageGallery', 'BaselineTestimonials', 'BaselineCTA'],
  ],
  // Luxury: cinematic hospitality, immersive but spacious
  luxury: [
    ['HeroCinematic', 'MessageReveal', 'BaselineFeatures', 'ZentryAbout', 'ImageGallery', 'BaselineTestimonials', 'HorizontalShowcase', 'BaselineCTA'],
    ['TruusVimeoHero', 'BaselineFeatures', 'ImageGallery', 'ZentryAbout', 'TruusShowreel', 'BaselineTestimonials', 'BaselineCTA'],
    ['ZentryHero', 'MessageReveal', 'BaselineFeatures', 'ImageGallery', 'ZentryAbout', 'HorizontalShowcase', 'BaselineTestimonials', 'TruusShowreel', 'BaselineCTA'],
    ['HeroCinematic', 'ZentryAbout', 'BaselineFeatures', 'TruusShowreel', 'ImageGallery', 'BaselineTestimonials', 'MessageReveal', 'BaselineCTA'],
  ],
  // Playful: food/drink/retail product — energetic, warm
  playful: [
    ['BaselineHero', 'BaselineFeatures', 'SpyltFlavor', 'BaselineTestimonials', 'SpyltMessage', 'SpyltBottomBanner', 'BaselineCTA'],
    ['SpyltHero', 'SpyltMessage', 'BaselineFeatures', 'SpyltFlavor', 'SpyltTestimonials', 'SpyltBottomBanner', 'BaselineCTA'],
    ['BaselineHero', 'SpyltMessage', 'BaselineFeatures', 'SpyltFlavor', 'BaselineTestimonials', 'SpyltBottomBanner', 'BaselineCTA'],
    ['SpyltHero', 'BaselineFeatures', 'SpyltFlavor', 'SpyltMessage', 'BaselineTestimonials', 'SpyltBottomBanner', 'BaselineCTA'],
  ],
  // Experience: events / education / community — chapter-by-chapter
  experience: [
    ['FlowHero', 'FlowWhoWeAre', 'BaselineFeatures', 'FlowEvent', 'BaselineTestimonials', 'FlowOnDemand', 'BaselineCTA'],
    ['BaselineHero', 'FlowWhoWeAre', 'BaselineFeatures', 'FlowEvent', 'FlowTutors', 'BaselineTestimonials', 'BaselineCTA'],
    ['FlowHero', 'FlowOnDemand', 'BaselineFeatures', 'FlowEvent', 'FlowWhatWeDo', 'BaselineTestimonials', 'BaselineCTA'],
    ['BaselineHero', 'FlowEvent', 'BaselineFeatures', 'FlowWhoWeAre', 'FlowTutors', 'BaselineTestimonials', 'BaselineCTA'],
  ],
  // Social: testimonials/community foreground (rare standalone, usually
  // additive — we still expose 4 shapes for prompts that explicitly lead
  // with social proof, e.g. "community network", "creator collective").
  social: [
    ['BaselineHero', 'BaselineFeatures', 'SpyltTestimonials', 'BaselineTestimonials', 'TruusDoubleMarquee', 'BaselineCTA'],
    ['BaselineHero', 'TruusDoubleMarquee', 'BaselineFeatures', 'SpyltTestimonials', 'BaselineTestimonials', 'BaselineCTA'],
    ['BaselineHero', 'BaselineFeatures', 'TruusDoubleMarquee', 'BaselineTestimonials', 'SpyltTestimonials', 'BaselineCTA'],
    ['BaselineHero', 'BaselineFeatures', 'SpyltTestimonials', 'TruusDoubleMarquee', 'BaselineTestimonials', 'BaselineCTA'],
  ],
}

/** Restrained / B2B brands skip the family library and use this small
 *  set of clean shapes. No cinematic ornamentation. */
const RESTRAINED_SHAPES: HomeShape[] = [
  ['BaselineHero', 'BaselineFeatures', 'BaselineTestimonials', 'BaselineCTA'],
  ['BaselineHero', 'BaselineFeatures', 'FAQAccordion', 'BaselineTestimonials', 'BaselineCTA'],
  ['BaselineHero', 'BaselineFeatures', 'MetricRow', 'BaselineTestimonials', 'BaselineCTA'],
  ['BaselineHero', 'BaselineFeatures', 'BaselineTestimonials', 'FAQAccordion', 'BaselineCTA'],
]

/** Pick a shape deterministically per brand. The seed shift uses bits
 *  the family-rotation doesn't, so two prompts in the same family pick
 *  different shapes even when their family lists are identical. */
function pickHomeShape(
  intensity: CinematicDimension,
  families: FamilyKey[],
  seed: number,
): { shape: HomeShape; familyUsed: FamilyKey | 'restrained' } {
  if (intensity === 'restrained' || families.length === 0) {
    const idx = (seed >>> 12) % RESTRAINED_SHAPES.length
    return { shape: RESTRAINED_SHAPES[idx], familyUsed: 'restrained' }
  }
  // Pick a primary family from the family list, then a shape within it.
  const primaryFam = families[(seed >>> 16) % families.length]
  const shapes = SHAPES_BY_FAMILY[primaryFam]
  const idx = (seed >>> 12) % shapes.length
  return { shape: shapes[idx], familyUsed: primaryFam }
}

/** Apply intensity-based rhythm trimming. A "high" shape can carry up
 *  to 6 cinematic; if the picked shape has more, trim from the tail
 *  (preserve the opener); if it has fewer, leave as-is (shapes are
 *  designed to be near-cap already). */
function trimToCap(shape: HomeShape, cap: number, cinematicIds: ReadonlySet<ComponentId>): ComponentId[] {
  const out: ComponentId[] = []
  let used = 0
  for (const id of shape) {
    if (cinematicIds.has(id)) {
      if (used >= cap) continue
      used += 1
    }
    out.push(id)
  }
  return out
}

/** Compose the home body from a shape + AI-emitted sections.
 *  For each id in the shape, reuse AI's content if it emitted the
 *  same id; otherwise create a fresh defaults-driven section. AI
 *  sections that don't match the shape are dropped. */
function composeHomeShape(
  shape: ComponentId[],
  aiBody: RawSection[],
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): RawSection[] {
  const aiById = new Map<ComponentId, RawSection>()
  for (const s of aiBody) {
    const id = s.id as ComponentId
    if (isValidComponentId(id) && !aiById.has(id)) {
      aiById.set(id, s)
    }
  }
  const out: RawSection[] = []
  for (const id of shape) {
    if (!isValidComponentId(id)) continue
    const ai = aiById.get(id)
    out.push(hydrateSection(ai ?? { id }, ctx))
  }
  return out
}

/** Industry-aware cinematic selection — shape-based. Deprecated name
 *  kept for callers; internals fully rewritten. */
function applyCinematicSelection(
  body: RawSection[],
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
  prompt: string,
): RawSection[] {
  const intensity = ctx.plan.intent.cinematicIntensity
  const cap = CINEMATIC_CAPS[intensity] ?? 0
  const families = familiesForBrand(ctx.plan, prompt)
  const seed = promptSeed(`${prompt} | ${ctx.brand}`) // include brand so even
  // same prompt with different brand re-rolls the shape
  const log = (msg: string) =>
    console.log(`[fiecom/cinematic] ${ctx.brand}: ${msg}`)

  const { shape, familyUsed } = pickHomeShape(intensity, families, seed)
  log(`industry="${ctx.plan.industry}" intensity=${intensity} cap=${cap} families=${families.join('+')} → shape from ${familyUsed} (#${(seed >>> 12) % (familyUsed === 'restrained' ? RESTRAINED_SHAPES.length : SHAPES_BY_FAMILY[familyUsed].length)})`)

  // Identify cinematic ids in the shape so we can cap.
  const cinematicInShape = shape.filter((id) => HOME_CINEMATIC.has(id))
  const trimmedShape = trimToCap(shape, cap, HOME_CINEMATIC)
  log(`shape=[${shape.join(', ')}] cinematicInShape=${cinematicInShape.length} trimmed→${trimmedShape.length} (${trimmedShape.filter((id) => HOME_CINEMATIC.has(id)).length} cinematic kept)`)

  const composed = composeHomeShape(trimmedShape, body, ctx)

  // Diagnostic: which AI sections were dropped because they didn't fit
  // the shape (helpful to understand why the AI's choices don't always
  // survive — but the shape is authoritative for visual rhythm).
  const aiIds = new Set(body.slice(1).map((s) => s.id as ComponentId))
  const droppedAi = [...aiIds].filter((id) => !trimmedShape.includes(id))
  if (droppedAi.length) {
    log(`AI emitted but not in shape: [${droppedAi.join(', ')}] (shape is authoritative for composition)`)
  }

  return composed
}

/** How many cinematic inserts each intensity level may keep on home.
 *  Cinematic = the safe 4 (MessageReveal, MarqueeBand, ImageGallery,
 *  HorizontalShowcase) + imported template body sections. The hero
 *  doesn't count against the cap. Caps are upper bounds — the AI picks
 *  the exact count per brand. Visual brands should hit the cap. */
const CINEMATIC_CAPS: Record<CinematicDimension, number> = {
  restrained: 1,
  moderate: 3,
  high: 6,
  extreme: 8,
}

/** Sections the AI may place on an internal-page body (NO cinematic). */
const INTERNAL_BODY_ALLOWED: ReadonlySet<ComponentId> = new Set<ComponentId>([
  'BaselinePageHeader', 'BaselineAboutNarrative', 'BaselineContact',
  'PricingTiers', 'FAQAccordion', 'FeatureList', 'LogoCloud',
  'TwoColumnText', 'LinkList', 'BlogIndex', 'JobsList', 'ChangelogList',
  'NewsletterSignup', 'ContactBlock', 'ContactForm', 'MetricRow',
])

const INTERNAL_BODY_MAX = 4 // + Navbar + Footer = 6 total

interface GuardContext {
  prompt: string
  preferences?: Record<string, unknown>
  plan?: SitePlan
}

export function strengthenGeneratedConfig<T extends RawConfig>(
  input: T,
  ctx: GuardContext,
): T {
  const plan = ctx.plan ?? fallbackSitePlan(ctx.prompt)
  const brand = brandName(plan, ctx.prompt, ctx.preferences)
  const email = contactEmail(brand)

  const planSlugs = new Set(plan.pages.map((p) => p.slug))
  let pages = normalizePages(input).filter((p) => planSlugs.has(p.slug || ''))

  // Insert any planned page the composer skipped, with a minimal scaffold.
  for (const planPage of plan.pages) {
    if (!pages.some((p) => p.slug === planPage.slug)) {
      pages.push(scaffoldPage(planPage, { brand, email, plan }))
    }
  }
  // Sort so home leads, then follow plan order.
  pages = sortPagesByPlan(pages, plan)

  for (const page of pages) {
    const slug = page.slug || 'home'
    page.sections = sanitizePage(page, plan, brand, email)
    page.sections = applyIntentFilter(page.sections, slug, plan, brand, email)
    // Belt-and-suspenders: drop anything that doesn't have a valid id
    // registered in COMPONENT_REGISTRY. Prevents stray sections from
    // intent-filter intermediates / JSON-repair leftovers / etc.
    page.sections = page.sections.filter(isSection)
  }

  const out: RawConfig = {
    ...input,
    theme: sanitizeTheme(input.theme, plan),
    pages,
    intent: plan.intent,
  }
  delete out.sections
  return out as T
}

/**
 * The heart of the visual-output diversification. After the AI has
 * composed sections, we enforce the energy + density rules:
 *   • strip forbidden components for this energy
 *   • swap the hero if it doesn't match the energy
 *   • trim section count to the energy/density cap
 *   • insert a quiet beat after the hero when the energy needs breathing
 *
 * Without this filter the composer collapses to ~the same shape for
 * every prompt regardless of intent.
 */
function applyIntentFilter(
  sections: RawSection[],
  slug: string,
  plan: SitePlan,
  brand: string,
  email: string,
): RawSection[] {
  const ctx = { brand, email, slug, plan }
  return slug === 'home'
    ? applyHomeBaselineSystem(sections, ctx)
    : applyInternalPageFilter(sections, ctx)
}

/**
 * Home page: preserve the AI's composition while enforcing the
 * non-negotiable invariants — Navbar+Footer chrome, BaselineHero as
 * first body section, BaselineCTA before footer, and a cap on cinematic
 * inserts derived from plan.intent.cinematicIntensity.
 *
 * Unlike the previous version which collapsed every brand to the same
 * 7-section skeleton, this passes the AI's section ordering through and
 * only intervenes when an invariant is missing.
 */
function applyHomeBaselineSystem(
  sections: RawSection[],
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): RawSection[] {
  const pick = (id: ComponentId, fallback?: RawSection) =>
    hydrateSection(findSection(sections, id) ?? fallback ?? { id }, ctx)

  // 1) Strip chrome from AI body (we re-add it at the end).
  const aiBody: RawSection[] = sections
    .filter((s) => s.id !== 'BaselineNavbar' && s.id !== 'BaselineFooter')
    .map((s) => ({ ...s }))

  // 2) Coerce heroes. Disallowed heroes always coerce to BaselineHero.
  //    Allowed alternate heroes pass through UNLESS cinematicIntensity is
  //    "restrained" — in that case they also coerce to BaselineHero (a
  //    cinematic hero would exceed the restrained brand's intent).
  const intensity = ctx.plan.intent.cinematicIntensity
  const allowAltHero = intensity !== 'restrained'
  for (let i = 0; i < aiBody.length; i++) {
    const sid = aiBody[i].id as ComponentId
    const isHero = ALL_HERO_IDS.has(sid as string)
    if (!isHero) continue
    const shouldCoerce =
      !ALLOWED_HOME_HEROES.has(sid) ||
      (sid !== 'BaselineHero' && !allowAltHero)
    if (shouldCoerce) {
      const promoted = firstHeroAsBaseline([aiBody[i]])
      if (promoted) aiBody[i] = promoted
    }
  }

  // 3) Filter to allowed home body IDs.
  let body = aiBody.filter((s) =>
    HOME_BODY_ALLOWED.has(s.id as ComponentId),
  )

  // 4) Ensure SOME hero exists and is the first body section. Accept
  //    any ALLOWED_HOME_HEROES; if none present, insert BaselineHero.
  const heroIdx = body.findIndex((s) =>
    ALLOWED_HOME_HEROES.has(s.id as ComponentId),
  )
  if (heroIdx === -1) {
    body.unshift(firstHeroAsBaseline(sections) ?? { id: 'BaselineHero' })
  } else if (heroIdx > 0) {
    const [hero] = body.splice(heroIdx, 1)
    body.unshift(hero)
  }
  // Drop any additional heroes after the first (only one hero per page).
  let seenHero = false
  body = body.filter((s) => {
    if (ALLOWED_HOME_HEROES.has(s.id as ComponentId)) {
      if (seenHero) return false
      seenHero = true
    }
    return true
  })

  // 5) Cinematic selection — industry-aware dedup + cap + augmentation.
  //    See applyCinematicSelection for the full algorithm + logging.
  body = applyCinematicSelection(body, ctx, ctx.plan.brand)

  // 6) Ensure a closing BaselineCTA exists before the footer.
  if (!body.some((s) => s.id === 'BaselineCTA')) {
    body.push({ id: 'BaselineCTA' })
  } else {
    // Move CTA to the end if AI placed it earlier.
    const ctaIdx = body.findIndex((s) => s.id === 'BaselineCTA')
    if (ctaIdx !== body.length - 1) {
      const [cta] = body.splice(ctaIdx, 1)
      body.push(cta)
    }
  }

  // 7) Wrap with chrome and hydrate everything.
  return [
    pick('BaselineNavbar'),
    ...body.map((s) => hydrateSection(s, ctx)),
    pick('BaselineFooter'),
  ]
}

function findSection(sections: RawSection[], id: ComponentId): RawSection | undefined {
  return sections.find((s) => s.id === id)
}

function firstHeroAsBaseline(sections: RawSection[]): RawSection | undefined {
  const hero = sections.find((s) => ALL_HERO_IDS.has(s.id as ComponentId))
  if (!hero) return undefined
  const content = hero.content ?? {}
  return {
    id: 'BaselineHero',
    content: {
      eyebrow: content.eyebrow,
      headline: content.headline,
      accent: content.accent ?? content.subhead,
      body: content.body,
      cta: content.cta,
      secondaryCta: content.secondaryCta,
    },
    imageQueries: hero.imageQueries,
  }
}

/**
 * Internal-page pipeline. Preserve AI's body sections (filtered to
 * non-cinematic utility blocks), force a PageHeader opener, cap at 6
 * sections total. If the AI didn't compose a real body, fall back to
 * slug-based defaults.
 */
function applyInternalPageFilter(
  sections: RawSection[],
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): RawSection[] {
  const pick = (id: ComponentId, fallback?: RawSection) =>
    hydrateSection(findSection(sections, id) ?? fallback ?? { id }, ctx)

  // Slugs whose body component already owns its own header (eyebrow +
  // h1), per the Fiecom template `src/pages/About.jsx` / `Contact.jsx`.
  // Composer must NOT prepend a separate BaselinePageHeader on these.
  const selfHeaderedSlugs = new Set(['about', 'studio', 'contact'])
  const slugOwnsHeader = selfHeaderedSlugs.has(ctx.slug)

  // 1) Strip chrome from AI body.
  const aiBody: RawSection[] = sections
    .filter((s) => s.id !== 'BaselineNavbar' && s.id !== 'BaselineFooter')
    .map((s) => ({ ...s }))

  // 2) Coerce any hero in the body to BaselinePageHeader (or drop it on
  //    self-headered slugs since they own their own header).
  for (let i = 0; i < aiBody.length; i++) {
    if (ALL_HERO_IDS.has(aiBody[i].id as string)) {
      if (slugOwnsHeader) {
        aiBody[i] = { id: undefined } // marker to drop in filter step
      } else {
        const promoted = firstHeroAsPageHeader([aiBody[i]])
        if (promoted) aiBody[i] = promoted
      }
    }
  }

  // 3) Filter to allowed internal body IDs (drops cinematic + heroes).
  //    On self-headered slugs, ALSO drop any BaselinePageHeader the AI
  //    emitted — the body component renders the header inline.
  let body = aiBody.filter((s) => {
    const sid = s.id as ComponentId
    if (slugOwnsHeader && sid === 'BaselinePageHeader') return false
    return INTERNAL_BODY_ALLOWED.has(sid)
  })

  // 4) Ensure opener. Self-headered slugs: skip BaselinePageHeader and
  //    instead guarantee the canonical body component (AboutNarrative /
  //    BaselineContact) is present and first. Other slugs: ensure
  //    BaselinePageHeader exists and is first.
  if (slugOwnsHeader) {
    const expected: ComponentId = ctx.slug === 'contact'
      ? 'BaselineContact'
      : 'BaselineAboutNarrative'
    const idx = body.findIndex((s) => s.id === expected)
    if (idx === -1) {
      body.unshift({ id: expected })
    } else if (idx > 0) {
      const [hd] = body.splice(idx, 1)
      body.unshift(hd)
    }
  } else {
    const phIdx = body.findIndex((s) => s.id === 'BaselinePageHeader')
    if (phIdx === -1) {
      body.unshift(
        firstHeroAsPageHeader(sections) ?? { id: 'BaselinePageHeader' },
      )
    } else if (phIdx > 0) {
      const [ph] = body.splice(phIdx, 1)
      body.unshift(ph)
    }
  }

  // 5) If body is only the opener, fall back to slug-based defaults so
  //    the page still has content.
  if (body.length <= 1) {
    const defaults = internalBodyIds(ctx.slug)
      .filter((id) => INTERNAL_BODY_ALLOWED.has(id))
      // Don't duplicate the opener we just guaranteed.
      .filter((id) => !body.some((s) => s.id === id))
      .map<RawSection>((id) => ({ id }))
    body.push(...defaults)
  }

  // 6) Cap body length so internal pages stay ≤ 6 total with chrome.
  body = body.slice(0, INTERNAL_BODY_MAX)

  return [
    pick('BaselineNavbar'),
    ...body.map((s) => hydrateSection(s, ctx)),
    pick('BaselineFooter'),
  ]
}

function internalBodyIds(slug: string): ComponentId[] {
  switch (slug) {
    case 'about':
    case 'studio':
      return ['BaselineAboutNarrative']
    case 'contact':
      return ['BaselineContact']
    case 'pricing':
    case 'plans':
      return ['PricingTiers', 'FAQAccordion']
    case 'work':
    case 'portfolio':
      return ['TwoColumnText', 'LinkList']
    case 'journal':
    case 'blog':
      return ['BlogIndex', 'NewsletterSignup']
    case 'careers':
      return ['JobsList', 'ContactBlock']
    case 'changelog':
      return ['ChangelogList', 'NewsletterSignup']
    case 'services':
    case 'product':
    default:
      return ['FeatureList', 'FAQAccordion']
  }
}

function firstHeroAsPageHeader(sections: RawSection[]): RawSection | undefined {
  const hero = sections.find((s) => ALL_HERO_IDS.has(s.id as ComponentId))
  if (!hero) return undefined
  const content = hero.content ?? {}
  return {
    id: 'BaselinePageHeader',
    content: {
      eyebrow: content.eyebrow,
      headline: content.headline,
      body: content.body,
    },
  }
}

function normalizePages(input: RawConfig): RawPage[] {
  const raw = Array.isArray(input.pages)
    ? input.pages
    : Array.isArray(input.sections)
      ? [{ slug: 'home', sections: input.sections }]
      : []
  return raw
    .filter((p) => p && Array.isArray(p.sections))
    .map((p, i) => ({
      slug: slugify(p.slug || (i === 0 ? 'home' : `page-${i + 1}`)),
      title: p.title,
      sections: (p.sections ?? []).filter(isSection),
    }))
}

function sortPagesByPlan(pages: RawPage[], plan: SitePlan): RawPage[] {
  const order = new Map(plan.pages.map((p, i) => [p.slug, i]))
  return [...pages].sort((a, b) => {
    const ai = order.get(a.slug || '') ?? 999
    const bi = order.get(b.slug || '') ?? 999
    return ai - bi
  })
}

function scaffoldPage(planPage: PagePlan, ctx: { brand: string; email: string; plan: SitePlan }): RawPage {
  // Conservative fallback for a page the composer didn't emit. Every
  // scaffold is built from the Baseline* set so a missing page still
  // preserves the Fiecom template structure.
  const ids: ComponentId[] = ['BaselineNavbar']
  const slug = planPage.slug
  const titleLower = planPage.title.toLowerCase()
  if (slug === 'home') {
    ids.push('BaselineHero', 'BaselineFeatures')
    if (planPage.pacing !== 'tight') ids.push('BaselineTestimonials')
    ids.push('BaselineCTA')
  } else {
    ids.push('BaselinePageHeader')
    const isContact = slug === 'contact' || titleLower.includes('contact')
    const isPricing = slug === 'pricing' || slug === 'plans' || titleLower.includes('pricing') || titleLower.includes('plans')
    const isAbout = slug === 'about' || slug === 'studio' || titleLower.includes('about')
    if (isContact) {
      ids.push('BaselineContact')
    } else if (isPricing) {
      ids.push('PricingTiers', 'FAQAccordion')
    } else if (isAbout) {
      ids.push('BaselineAboutNarrative')
    } else {
      ids.push('FeatureList', 'FAQAccordion')
    }
  }
  ids.push('BaselineFooter')
  return {
    slug: planPage.slug,
    title: planPage.title,
    sections: ids.map((id) => makeSection(id, { brand: ctx.brand, email: ctx.email, slug: planPage.slug, plan: ctx.plan })),
  }
}

function sanitizePage(page: RawPage, plan: SitePlan, brand: string, email: string): RawSection[] {
  const slug = page.slug || 'home'
  const out: RawSection[] = []
  for (const section of page.sections ?? []) {
    if (!isSection(section)) continue
    out.push(hydrateSection(section, { brand, email, slug, plan }))
  }
  ensureChrome(out, { brand, email, slug, plan })
  return out
}

function ensureChrome(
  sections: RawSection[],
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
) {
  // Default to the Baseline chrome.
  const first = sections[0]?.id as ComponentId | undefined
  if (!first || !NAVBAR_IDS.has(first)) {
    sections.unshift(makeSection('BaselineNavbar', ctx))
  }
  const last = sections[sections.length - 1]?.id as ComponentId | undefined
  if (!last || !FOOTER_IDS.has(last)) {
    sections.push(makeSection('BaselineFooter', ctx))
  }
}

function hydrateSection(
  section: RawSection,
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): RawSection {
  const id = section.id as ComponentId
  const fallback = makeSection(id, ctx)
  return {
    id,
    content: normalizeContent(id, { ...(fallback.content ?? {}), ...(section.content ?? {}) }, ctx),
    imageQueries: mergeImageQueries(id, section.imageQueries, fallback.imageQueries),
  }
}

/** Merge AI-emitted imageQueries with fallback ones, slot-by-slot.
 *  The composer's JSON schema requires `imageQueries` to exist but allows
 *  its inner slots to be omitted — so the AI often returns `{}` or only
 *  `{ primary }` for a section that also needs `gallery`. Plain
 *  `section.imageQueries ?? fallback.imageQueries` keeps the (empty)
 *  object and the orchestrator never resolves a single image, which
 *  surfaces as the empty gray boxes in BaselineFeatures cards. The fix
 *  is to fill missing/empty slots from the fallback, per the section's
 *  expected meta (primary/secondary/gallery counts). */
function mergeImageQueries(
  id: ComponentId,
  ai: RawSection['imageQueries'],
  fallback: RawSection['imageQueries'],
): RawSection['imageQueries'] {
  if (!ai && !fallback) return undefined
  const meta = SECTION_META[id]
  const out: NonNullable<RawSection['imageQueries']> = {}
  const wantPrimary = !!meta?.primary
  const wantSecondary = !!meta?.secondary
  const wantGallery = !!meta?.gallery
  if (wantPrimary) {
    out.primary = ai?.primary?.trim() || fallback?.primary
  }
  if (wantSecondary) {
    out.secondary = ai?.secondary?.trim() || fallback?.secondary
  }
  if (wantGallery) {
    const aiGallery = Array.isArray(ai?.gallery) ? ai.gallery.filter((s) => typeof s === 'string' && s.trim()) : []
    const fbGallery = fallback?.gallery ?? []
    const expected = meta?.gallery ?? 0
    if (aiGallery.length >= expected) {
      out.gallery = aiGallery.slice(0, expected)
    } else {
      // Top up with fallback queries so every slot has a query to resolve.
      const merged = [...aiGallery]
      for (let i = 0; i < expected && merged.length < expected; i++) {
        const fb = fbGallery[i] ?? fbGallery[fbGallery.length - 1]
        if (fb) merged.push(fb)
      }
      if (merged.length) out.gallery = merged
    }
  }
  // Strip empties so downstream stays simple.
  if (!out.primary) delete out.primary
  if (!out.secondary) delete out.secondary
  if (!out.gallery || out.gallery.length === 0) delete out.gallery
  return Object.keys(out).length ? out : undefined
}

function makeSection(
  id: ComponentId,
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): RawSection {
  return {
    id,
    content: normalizeContent(id, defaultContent(id, ctx), ctx),
    imageQueries: defaultImageQueries(id, ctx),
  }
}

function normalizeContent(
  id: ComponentId,
  content: Record<string, unknown>,
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): Record<string, unknown> {
  const out = { ...content }
  if (id === 'StickyNavbar' || id === 'BaselineNavbar') {
    out.brand = String(out.brand || ctx.brand)
    out.links = navLinks(ctx.plan)
    const ctaIn = (out.cta as Record<string, unknown> | undefined) ?? {}
    out.cta = {
      label: String(ctaIn.label || (id === 'BaselineNavbar' ? 'Get started' : 'Start')),
      href: safeCtaHref(ctaIn.href, ctx.plan),
    }
  }
  if (id === 'PageHeader' || id === 'BaselinePageHeader') {
    delete out.crumbs
    out.headline = out.headline || titleForSlug(ctx.slug)
  }
  if (id === 'HeroCinematic' || id === 'BaselineHero' || id === 'ClosingCTA' || id === 'BaselineCTA' || id === 'CTABanner') {
    const cta = (out.cta as Record<string, unknown> | undefined) ?? {}
    const defaultLabel =
      id === 'HeroCinematic' ? 'Start now'
      : id === 'BaselineHero' ? 'Get started'
      : id === 'BaselineCTA' ? 'Get started'
      : 'Get in touch'
    out.cta = {
      label: String(cta.label || defaultLabel),
      href: safeCtaHref(cta.href, ctx.plan),
    }
    const sec = out.secondaryCta as Record<string, unknown> | undefined
    if (sec && (sec.label || sec.href)) {
      out.secondaryCta = {
        label: String(sec.label || 'Learn more'),
        href: safeCtaHref(sec.href, ctx.plan),
      }
    }
  }
  if (id === 'PricingTiers' && Array.isArray(out.tiers)) {
    const tierHref = safeCtaHref(undefined, ctx.plan)
    out.tiers = out.tiers.map((tier) =>
      tier && typeof tier === 'object'
        ? { ...(tier as Record<string, unknown>), cta: { label: 'Choose plan', href: tierHref } }
        : tier,
    )
  }
  if (id === 'ContactBlock') {
    out.cta = { label: 'Email the team', href: `mailto:${ctx.email}` }
    out.details = Array.isArray(out.details) && out.details.length
      ? out.details
      : [
          { label: 'Email', value: ctx.email, href: `mailto:${ctx.email}` },
          { label: 'Response', value: 'Within one business day' },
          { label: 'Location', value: 'Remote and on-site' },
        ]
  }
  if (id === 'BaselineContact') {
    out.recipientEmail = String(out.recipientEmail || ctx.email)
    out.details = Array.isArray(out.details) && out.details.length
      ? out.details
      : [
          { label: 'Email', value: ctx.email, href: `mailto:${ctx.email}` },
          { label: 'Response', value: 'Within one business day' },
        ]
  }
  if (id === 'ContactForm') {
    out.recipientEmail = String(out.recipientEmail || ctx.email)
    out.submitLabel = String(out.submitLabel || 'Send request')
  }
  if (id === 'FooterRich' || id === 'BaselineFooter') {
    out.brand = String(out.brand || ctx.brand)
    out.columns = footerColumns(ctx.plan)
    const ctaIn = (out.cta as Record<string, unknown> | undefined) ?? {}
    out.cta = {
      label: String(ctaIn.label || 'Contact'),
      href: safeCtaHref(ctaIn.href, ctx.plan),
    }
    out.legal = String(out.legal || `© ${new Date().getFullYear()} ${ctx.brand}. All rights reserved.`)
    if (id === 'BaselineFooter') {
      out.tagline = String(out.tagline || `${ctx.brand}. Built for clarity.`)
      out.meta = Array.isArray(out.meta) && out.meta.length
        ? out.meta
        : [{ label: 'Privacy', href: '/' }, { label: 'Terms', href: '/' }]
    }
  }
  return out
}

function defaultContent(
  id: ComponentId,
  ctx: { brand: string; email: string; slug: string; plan: SitePlan },
): Record<string, unknown> {
  const label = titleForSlug(ctx.slug)
  const brand = ctx.brand
  switch (id) {
    case 'StickyNavbar':
      return { brand, links: navLinks(ctx.plan), cta: { label: 'Start', href: safeCtaHref(undefined, ctx.plan) } }
    case 'BaselineNavbar':
      return { brand, links: navLinks(ctx.plan), cta: { label: 'Get started', href: safeCtaHref(undefined, ctx.plan) } }
    case 'BaselineHero':
      return {
        eyebrow: `New — ${ctx.plan.industry}`,
        headline: `Precision tools for`,
        accent: `teams that ship`,
        body: `${brand} is a modern workspace built for clarity. Designed for momentum.`,
        cta: { label: 'Get started', href: safeCtaHref(undefined, ctx.plan) },
        secondaryCta: { label: 'Learn more', href: safeCtaHref('/about', ctx.plan) },
      }
    case 'BaselineFeatures':
      return {
        eyebrow: 'What we do',
        headline: 'One platform, three disciplines.',
        accent: 'Built to compound.',
        features: [
          { eyebrow: '01 — Planning', title: 'Roadmaps that map', body: 'Connect strategy to execution with timelines and dependencies that stay in sync.' },
          { eyebrow: '02 — Building', title: 'A workspace for craft', body: 'Documents, tasks, and reviews in one canvas. Keyboard-first, fast as thought.' },
          { eyebrow: '03 — Shipping', title: 'Release with confidence', body: 'Automated changelogs and stakeholder updates generated from work you already do.' },
        ],
      }
    case 'BaselineLogoBar':
      // Intentionally empty: never invent fake clients. The component
      // returns null when clients is empty, so the section disappears
      // unless the AI emits real names. Filler like "Linear, Stripe,
      // Notion..." was deleted because it surfaced as fake credibility.
      return { clients: [] }
    case 'BaselineTestimonials':
      return {
        eyebrow: 'Customers',
        headline: `Teams move faster with ${brand}.`,
        testimonials: [
          { quote: `${brand} replaced four tools. Our planning cycles are 40% shorter.`, author: 'Elena Vasquez', role: 'Head of Product' },
          { quote: `It feels like a tool designed by people who actually ship software.`, author: 'Marcus Chen', role: 'Engineering Lead' },
          { quote: `The clarity is the killer feature. Our roadmap is finally trusted.`, author: 'Priya Anand', role: 'COO' },
        ],
      }
    case 'BaselineCTA':
      return {
        eyebrow: 'Get started',
        headline: 'Build something',
        accent: 'remarkable.',
        body: 'Start your free trial. No credit card required. Cancel anytime.',
        cta: { label: 'Get started', href: safeCtaHref(undefined, ctx.plan) },
        secondaryCta: { label: 'Talk to sales', href: safeCtaHref(undefined, ctx.plan) },
      }
    case 'BaselinePageHeader':
      return {
        eyebrow: titleForSlug(ctx.slug),
        headline: pageHeaderHeadlineFor(ctx.slug, brand),
        body: `Everything you need to understand ${titleForSlug(ctx.slug).toLowerCase()} and take the next step.`,
      }
    case 'BaselineAboutNarrative':
      return {
        eyebrow: 'About us',
        headline: `Built for what ${brand} actually does.`,
        body: `${brand} was founded by a small team of designers and engineers who had spent years building software at category-defining companies. We were tired of tools that fought us. So we started building one that doesn't.`,
        pillarEyebrow: 'Core pillars',
        pillarHeadline: 'The principles we build by.',
        pillars: [
          { title: 'Clarity over cleverness', body: 'The best tools disappear. Every pixel is in service of helping you think — not impressing you.' },
          { title: 'Craft is a discipline', body: 'We sweat the details others ignore. The microcopy. The cursor states. Quality compounds.' },
          { title: 'Speed is respect', body: 'Your attention is the most valuable thing you bring to work. We honor it.' },
        ],
        statsEyebrow: 'By the numbers',
        stats: [
          { value: '2022', label: 'Founded' },
          { value: '34', label: 'Team' },
          { value: '12k+', label: 'Active users' },
        ],
      }
    case 'BaselineContact':
      return {
        eyebrow: 'Contact',
        headline: `Let's build something together.`,
        formTitle: 'Get in touch',
        formBody: 'Send us a message and we will get back within one business day.',
        recipientEmail: ctx.email,
        subjectTemplate: `New inquiry from {name}`,
        details: [
          { label: 'Email', value: ctx.email, href: `mailto:${ctx.email}` },
          { label: 'Response', value: 'Within one business day' },
        ],
      }
    case 'HeroCinematic':
      return { eyebrow: ctx.plan.industry, headline: brand, subhead: 'Built to move', body: `${brand} turns the brief into a complete, navigable digital experience.`, cta: { label: 'Start now', href: safeCtaHref(undefined, ctx.plan) } }
    case 'HeroEditorial':
      return { eyebrow: ctx.plan.industry, headline: brand.toUpperCase(), body: `A complete digital presence\nshaped around product, proof,\nand conversion.` }
    case 'PageHeader':
      return { eyebrow: brand, headline: label, body: `Everything visitors need to understand ${label.toLowerCase()} and take the next step.` }
    case 'MessageReveal':
      return { firstLine: `${brand} is not another template`, accent: 'different', secondLine: 'It is a structured product story', body: 'The rhythm, sections, and proof points change with the market instead of repainting the same layout.' }
    case 'FeatureBento':
      return { eyebrow: 'Capabilities', headline: 'Designed around the job to be done', body: 'A focused set of proof points, workflows, and conversion paths.', features: ['Strategy', 'Experience', 'Operations', 'Support', 'Growth', 'Trust'].map((title, i) => ({ title, body: `${title} content tailored to ${brand}.`, size: i === 0 ? 'lg' : 'sm' })) }
    case 'HorizontalShowcase':
      // Captions intentionally omitted — generic "Overview for <brand>"
      // labels read as filler. When the AI emits real captions they
      // surface; otherwise the cards render image-only.
      return { eyebrow: 'Selected work', headline: 'A studio in motion', body: 'A horizontal cross-section of what the studio has made recently.', cards: [{ title: 'Recent' }, { title: 'Current' }, { title: 'Concept' }, { title: 'Process' }, { title: 'Detail' }, { title: 'Field' }] }
    case 'StickyChapters':
      return { eyebrow: 'Story', chapters: ['The problem is specific', 'The solution is structured', 'The next step is clear'].map((title) => ({ title, body: `${brand} explains this moment with a focused narrative beat.` })) }
    case 'ImageGallery':
      return { eyebrow: 'Gallery', headline: 'Seen from every angle', body: 'A visual layer that makes the offer tangible.', captions: ['Signal', 'Space', 'Detail', 'Flow', 'Texture', 'Proof', 'People', 'System', 'Outcome'].map((title, i) => ({ title, year: String(2026 - (i % 2)) })) }
    case 'StatsCounter':
      return { eyebrow: 'Proof', headline: 'Measured where it matters', stats: [{ value: 0, label: 'cases shipped' }, { value: 0, suffix: '%', label: 'lift in clarity' }, { value: 0, suffix: '/10', label: 'partner trust' }] }
    case 'MetricRow':
      return { eyebrow: 'Signals', headline: 'How the work performs', metrics: [{ value: '—', label: 'active engagements' }, { value: '—', label: 'measured outcomes' }, { value: '—', label: 'response window' }] }
    case 'DataTable':
      return { eyebrow: 'Compare', headline: 'A practical view of the offer', columns: [{ key: 'item', label: 'Item' }, { key: 'status', label: 'Status' }, { key: 'value', label: 'Value' }], rows: [{ item: 'Launch plan', status: 'Included', value: '2 weeks' }, { item: 'Support', status: 'Included', value: 'Priority' }, { item: 'Reporting', status: 'Included', value: 'Monthly' }] }
    case 'ProcessSteps':
      return { eyebrow: 'Process', headline: 'From first signal to launch', steps: ['Discover', 'Shape', 'Build', 'Launch'].map((title, i) => ({ number: `0${i + 1}`, title, body: `${title} the ${brand} experience with a clear owner and outcome.` })) }
    case 'TimelineScroll':
      return { eyebrow: 'Timeline', headline: 'How the story unfolds', events: ['2023', '2024', '2025', '2026'].map((year, i) => ({ year, title: ['Foundation', 'Momentum', 'Expansion', 'Next chapter'][i], body: `${brand} builds credibility through a sequence of visible milestones.` })) }
    case 'PricingTiers':
      return { eyebrow: 'Plans', headline: 'Find the right starting point', tiers: ['Starter', 'Studio', 'Custom'].map((name, i) => ({ name, price: name, period: undefined, description: `${name === 'Custom' ? 'Tailored engagement' : `${name} engagement`} for ${brand}.`, features: ['Strategy and direction', 'Design and build', 'Ongoing support'], featured: i === 1, cta: { label: 'Talk to us', href: safeCtaHref(undefined, ctx.plan) } })) }
    case 'FAQAccordion':
      return { eyebrow: 'FAQ', headline: 'Questions before you start', faqs: ['How quickly can we launch?', 'What do you need from us?', 'Can this scale into more pages?', 'How does support work?'].map((q) => ({ q, a: 'The site is structured so the first version can launch quickly, then expand with focused edits and new pages.' })) }
    case 'TestimonialCarousel':
      return { eyebrow: 'Voices', testimonials: [{ quote: `${brand} made everything feel intentional from the first scroll.`, author: 'Client partner', role: 'Founder' }, { quote: 'The experience reads like a real product, not a pitch.', author: 'Long-time customer', role: 'Operator' }, { quote: 'Every section had a clear reason to exist.', author: 'Studio collaborator', role: 'Director' }] }
    case 'CTABanner':
      return { eyebrow: 'Next', headline: 'Turn interest into a useful action', body: 'Give visitors a clear path instead of a dead end.', cta: { label: 'Talk to us', href: safeCtaHref(undefined, ctx.plan) } }
    case 'ContactBlock':
      return { eyebrow: 'Contact', headline: 'Start with a focused conversation', body: `Send a note to ${brand} and get a practical next step.`, cta: { label: 'Email the team', href: `mailto:${ctx.email}` } }
    case 'ContactForm':
      return { eyebrow: 'Start', headline: 'Tell us what you need', body: 'The form opens your mail client with the right context.', recipientEmail: ctx.email }
    case 'FeatureList':
      return { eyebrow: 'Details', headline: `${label} details`, features: ['Core offer', 'Delivery', 'Support', 'Measurement', 'Next step'].map((title) => ({ title, body: `${title} information for ${brand}.` })) }
    case 'LinkList':
      return { eyebrow: 'Resources', headline: 'Helpful destinations', groups: [{ title: 'Explore', links: navLinks(ctx.plan).map((l) => ({ ...l, description: `Open ${l.label}` })) }] }
    case 'LogoCloud':
      // Empty by default. Generic "Trusted by" + fake client names was
      // deleted; the component handles the empty case by rendering null.
      return { clients: [] }
    case 'NewsletterSignup':
      return { eyebrow: 'Updates', headline: 'Get the next dispatch', body: 'Occasional notes with useful context.', cta: { label: 'Subscribe' } }
    case 'BlogIndex':
      return { eyebrow: 'Journal', headline: 'Latest thinking', posts: ['How the category is changing', 'Designing for trust', 'What buyers need next', 'Launch notes'].map((title, i) => ({ title, date: `2026-0${Math.min(i + 1, 9)}-15`, category: 'Field note', readingMinutes: 4 })) }
    case 'JobsList':
      return { eyebrow: 'Careers', headline: 'Build with us', groups: [{ team: 'Studio', jobs: [{ role: 'Product Designer', location: 'Remote', type: 'Full-time' }, { role: 'Frontend Engineer', location: 'Remote', type: 'Full-time' }] }] }
    case 'ChangelogList':
      return { eyebrow: 'Updates', headline: 'Product changes', entries: [{ date: '2026-05-01', title: 'New experience launched', body: `${brand} released a sharper site structure.`, tag: 'new' }] }
    case 'TwoColumnText':
      return { eyebrow: 'Context', headline: `${label} in detail`, paragraphs: ['Positioning', 'Experience', 'Operations'].map((heading) => ({ heading, body: `${heading} content for ${brand}.` })) }
    case 'MarqueeBand':
      return { items: [brand, 'Strategy', 'Motion', 'Proof', 'Conversion'], tone: 'normal' }
    case 'FooterRich':
      return { brand, tagline: `${brand} is built as a complete website system.`, giant: brand, columns: footerColumns(ctx.plan), cta: { label: 'Contact', href: safeCtaHref(undefined, ctx.plan) } }
    case 'ZentryHero':
      return { eyebrow: ctx.plan.industry, headline: brand, subhead: 'Enter the experience', body: `${brand} turns the offer into a cinematic first impression.`, cta: { label: 'Explore', href: safeCtaHref(undefined, ctx.plan) } }
    case 'ZentryAbout':
      return { eyebrow: 'Welcome', headline: `Discover ${brand}`, body: `${brand} brings the story, proof, and product promise into one immersive moment.` }
    case 'ZentryFeatures':
      return { eyebrow: 'Inside the system', headline: 'Connected pieces with motion', body: 'Each card turns a core capability into a visual beat.', features: ['Signal', 'World', 'Layer', 'Momentum', 'More soon'].map((title) => ({ title, body: `${title} for ${brand}.` })) }
    case 'ZentryStory':
      return { eyebrow: 'The story', headline: `The world behind ${brand}`, body: `${brand} gives visitors a memorable story instead of a static pitch.` }
    case 'ZentryContact':
      return { eyebrow: 'Join us', headline: 'Build the next era together', cta: { label: 'Contact us', href: safeCtaHref(undefined, ctx.plan) } }
    case 'ZentryFooter':
      return { brand, links: navLinks(ctx.plan), cta: { label: 'Privacy', href: '/' }, legal: `${new Date().getFullYear()} ${brand}. All rights reserved.` }
    case 'FlowHero':
      return { eyebrow: 'live', headline: brand.split(/\s+/)[0] || brand, body: `${brand} is a shared space for momentum, learning, and action.` }
    case 'FlowEvent':
      return { eyebrow: 'Events', headline: 'Moments', body: 'A sequence of high-energy stories visitors can scan fast.', cards: ['Launch', 'Workshop', 'Showcase', 'Session'].map((title) => ({ title, heading: brand, category: 'experience', meta: 'now' })) }
    case 'FlowWhoWeAre':
      return { headline: `What is ${brand}`, body: `${brand} is a focused community around the offer and the people it serves.`, statement: 'A place to learn, share knowledge and move forward' }
    case 'FlowOnDemand':
      return { eyebrow: brand, headline: 'A focused journey guided by the right expertise.', badge: 'On demand' }
    case 'FlowTutors':
      return { headline: 'The guides', body: 'A group of specialists shapes the experience from every angle.', people: ['Strategy', 'Design', 'Motion', 'Growth'].map((title) => ({ title })), stats: [{ value: 'Weekly' }, { value: '2Hrs' }, { value: '8Hrs' }, { value: '32Hrs' }] }
    case 'FlowWhatWeDo':
      return { headline: 'What we do', body: 'A set of useful formats for visitors who want to participate.', cards: ['Challenges', 'Live streams', 'After party'].map((title) => ({ title })) }
    case 'FlowPartyTools':
      return { headline: 'Tools', body: 'Useful resources with a strong editorial rhythm.', items: ['Live build', 'Learning path', 'Creative session', 'Technical deep dive'].map((title) => ({ title, href: safeCtaHref(undefined, ctx.plan) })) }
    case 'FlowFooter':
      return { brand, headline: 'Subscribe', cta: { label: 'Start now', href: safeCtaHref(undefined, ctx.plan) }, legal: `${new Date().getFullYear()} ${brand}` }
    case 'SpyltHero':
      return { headline: 'Freaking good', subhead: 'Fuel up', body: `${brand} makes the product feel energetic, tactile, and easy to want.`, cta: { label: 'Get it now', href: safeCtaHref(undefined, ctx.plan) } }
    case 'SpyltMessage':
      return { firstLine: 'Stir up the fearless past', accent: 'Fuel up', secondLine: 'the future with every move', body: `${brand} turns nostalgia and product benefit into one bold message.` }
    case 'SpyltFlavor':
      return { headline: 'Choose your favorite', cards: ['Original', 'Bright', 'Deep', 'Smooth', 'Bold', 'Classic'].map((title) => ({ title })), cta: { label: 'Get it now', href: safeCtaHref(undefined, ctx.plan) } }
    case 'SpyltNutrition':
      return { headline: 'It still does', accent: 'Body good', body: `${brand} explains the practical value in a compact product-proof band.`, stats: [{ label: 'Signal', value: 'High' }, { label: 'Energy', value: 'Clean' }, { label: 'Format', value: 'Ready' }] }
    case 'SpyltBenefit':
      return { body: `Explore the key benefits of choosing ${brand}.`, features: ['Shelf stable', 'High signal', 'Reusable', 'Easy choice'].map((title) => ({ title })) }
    case 'SpyltTestimonials':
      return { testimonials: ['Customer one', 'Customer two', 'Customer three', 'Customer four', 'Customer five'].map((author) => ({ author, quote: `${brand} made the choice obvious.` })) }
    case 'SpyltBottomBanner':
      return { headline: 'Right around', accent: 'The corner', body: `${brand} gives visitors a clear way to find the offer.`, cta: { label: 'Find out', href: safeCtaHref(undefined, ctx.plan) } }
    case 'SpyltFooter':
      return { brand, headline: brand, tagline: 'Stay informed about updates and events.', legal: `${new Date().getFullYear()} ${brand}. All rights reserved.` }
    case 'TruusVimeoHero':
      return { headline: `${brand} makes the new mainstream feel impossible to ignore` }
    case 'TruusHorizontalWords':
      return { headline: 'We go where the people are', body: `${brand} meets audiences where attention already lives.` }
    case 'TruusMotionCards':
      return { headline: 'Built for the future.', subhead: 'from idea to action.', body: `${brand} works across every touchpoint with a visual system that feels alive.`, cards: ['One', 'Two', 'Three', 'Four'].map((title) => ({ title })) }
    case 'TruusShowreel':
      return { headline: 'Showreel', body: `${brand} in motion across the moments that matter.` }
    case 'TruusServiceCards':
      return { headline: 'Call us if you need:', cards: ['Brand', 'Social', 'Activation', 'Production', 'Partners'].map((title) => ({ title, services: ['Strategy', 'Creative', 'Production', 'Support'] })) }
    case 'TruusDoubleMarquee':
      return { headline: 'Proud to work with:', clients: ['Northline', 'Atlas', 'Kindred', 'Forma', 'Field Unit', 'Mono Works', 'Signal', 'Bright'].map((name) => ({ name })) }
    case 'TruusFooter':
      return { brand, giant: brand, tagline: `${brand} turns attention into useful action.`, columns: footerColumns(ctx.plan), cta: { label: 'Contact', href: safeCtaHref(undefined, ctx.plan) }, legal: `${new Date().getFullYear()} ${brand}` }
    default:
      return { headline: brand }
  }
}

function defaultImageQueries(
  id: ComponentId,
  ctx: { brand: string; slug: string; plan: SitePlan },
): RawSection['imageQueries'] {
  const base = imageBase(ctx.plan.industry, ctx.plan.intent.energy)
  const meta = SECTION_META[id] // may be undefined for registered-but-not-cataloged ids
  const q: NonNullable<RawSection['imageQueries']> = {}
  // BaselineHero pairs a framed product/brand image with the text — use a
  // product-first query so it reads as "what you ship" not "atmosphere".
  if (id === 'BaselineHero') {
    q.primary = `${base} product detail`
    return q
  }
  if (id === 'BaselineFeatures') {
    q.gallery = ['workflow', 'detail', 'craft'].map((kw) => `${base} ${kw}`)
    return q
  }
  if (id === 'BaselineAboutNarrative') {
    q.primary = `${base} workspace team`
    return q
  }
  if (meta?.primary) q.primary = `${base} hero`
  if (meta?.secondary) q.secondary = `${base} detail`
  if (meta?.gallery) q.gallery = Array.from({ length: Math.min(meta.gallery, 6) }, (_, i) => `${base} ${['interior', 'team', 'product', 'detail', 'workflow', 'texture'][i] ?? 'scene'}`)
  return Object.keys(q).length ? q : undefined
}

function sanitizeTheme(theme: RawConfig['theme'], plan: SitePlan): Record<string, string> {
  const themeHint = plan.intent.themeHint
  const preset = theme?.preset && THEME_KEYS.includes(theme.preset)
    ? theme.preset
    : THEME_KEYS.includes(themeHint) ? themeHint : DEFAULT_THEME_KEY
  const out: Record<string, string> = { ...(theme ?? {}), preset }
  const rough = {
    bg: out.bg || '#ffffff',
    ink: out.ink || '#111111',
    accent: out.accent || '#2347ff',
    onAccent: out.onAccent || '#ffffff',
    bgAccent: out.bgAccent || '#111111',
  }
  if (out.bg && out.ink && contrastRatio(out.ink, out.bg) < 4.5) {
    delete out.bg
    delete out.ink
  }
  if (findContrastIssues(rough).some((i) => i.pair === 'onAccent/accent')) {
    delete out.accent
    delete out.onAccent
  }
  return out
}

/**
 * Derive the navbar links from the SitePlan's navOrder + pages. Every
 * link points to a real route — labels that don't map to a page are
 * dropped (no broken anchors).
 */
function navLinks(plan: SitePlan): { label: string; href: string }[] {
  const slugByTitle = new Map(plan.pages.map((p) => [p.title.toLowerCase(), p.slug]))
  const out: { label: string; href: string }[] = []
  const seen = new Set<string>()
  for (const label of plan.navOrder) {
    if (out.length >= 6) break
    const slug = slugByTitle.get(label.toLowerCase())
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push({ label, href: slug === 'home' ? '/' : `/${slug}` })
  }
  // Backfill any pages the AI forgot to nav.
  for (const page of plan.pages) {
    if (out.length >= 6) break
    if (seen.has(page.slug)) continue
    seen.add(page.slug)
    out.push({ label: page.title, href: page.slug === 'home' ? '/' : `/${page.slug}` })
  }
  return out
}

function footerColumns(plan: SitePlan) {
  const realLinks = navLinks(plan)
  const hasContact = plan.pages.some((p) => p.slug === 'contact')
  const primary = realLinks.slice(0, Math.max(3, Math.ceil(realLinks.length / 2)))
  const secondary = realLinks.slice(primary.length)
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    { title: 'Site', links: primary },
  ]
  if (secondary.length > 0) columns.push({ title: 'More', links: secondary })
  const ctas: { label: string; href: string }[] = []
  if (hasContact) ctas.push({ label: 'Start a project', href: '/contact' })
  ctas.push({ label: 'Send a message', href: safeCtaHref(undefined, plan) })
  columns.push({ title: 'Get in touch', links: ctas })
  return columns
}

function safeCtaHref(href: unknown, plan: SitePlan): string {
  const slugs = new Set(plan.pages.map((p) => p.slug))
  const raw = typeof href === 'string' ? href.trim() : ''
  if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('http')) return raw
  if (raw.startsWith('/')) {
    const slug = raw.slice(1).split(/[/?#]/)[0]
    if (slug === '' || slug === 'home') return '/'
    if (slugs.has(slug)) return raw
  }
  if (slugs.has('contact')) return '/contact'
  const others = plan.pages.filter((p) => p.slug !== 'home')
  if (others.length > 0) return `/${others[others.length - 1].slug}`
  return '/'
}

function brandName(plan: SitePlan, prompt: string, preferences?: Record<string, unknown>): string {
  const prefBrand = preferences?.brand
  if (typeof prefBrand === 'string' && prefBrand.trim()) return cleanBrand(prefBrand)
  if (plan.brand && plan.brand !== 'Studio') return cleanBrand(plan.brand)
  const quoted = prompt.match(/["'“]([^"'”]{2,40})["'”]/)
  if (quoted) return cleanBrand(quoted[1])
  const named = prompt.match(/\b(?:for|called|named|brand)\s+([A-Z][A-Za-z0-9& -]{1,32})/)
  if (named) return cleanBrand(named[1])
  return plan.brand || 'Fiecom'
}

function contactEmail(brand: string): string {
  const slug = slugify(brand).replace(/-/g, '')
  return `hello@${slug || 'studio'}.co`
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
}

function cleanBrand(s: string): string {
  return s.trim().replace(/[^\w& -]/g, '').slice(0, 28) || 'Fiecom'
}

function titleForSlug(slug: string): string {
  if (slug === 'home') return 'Home'
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function pageHeaderHeadlineFor(slug: string, brand: string): string {
  switch (slug) {
    case 'about':
    case 'studio':
      return `Our mission is to make great work feel inevitable.`
    case 'contact':
      return `Let's build something together.`
    case 'pricing':
    case 'plans':
      return `Plans for every stage.`
    case 'services':
    case 'product':
      return `What we do.`
    case 'work':
    case 'portfolio':
      return `Selected work.`
    case 'careers':
      return `Build with us.`
    case 'changelog':
      return `Product updates.`
    case 'journal':
    case 'blog':
      return `Field notes from ${brand}.`
    default:
      return titleForSlug(slug)
  }
}

function imageBase(industry: string, energy: string): string {
  const e = energy.toLowerCase()
  if (e === 'cinematic' || e === 'immersive' || e === 'artistic') return 'cinematic atmospheric scene'
  if (e === 'quiet-luxury' || e === 'editorial' || e === 'storytelling-heavy') return 'editorial premium brand detail'
  if (e === 'product-heavy' || e === 'conversion-heavy' || e === 'startup') return 'minimal modern product detail'
  const map: Record<string, string> = {
    saas: 'minimal software dashboard',
    fintech: 'modern finance app',
    hospitality: 'boutique hotel interior',
    food: 'warm restaurant dining',
    creative: 'editorial design studio',
    commerce: 'premium product photography',
    health: 'calm wellness clinic',
    education: 'modern learning space',
    app: 'clean app interface',
  }
  return map[industry] ?? 'premium brand detail'
}

function isSection(s: RawSection): s is RawSection & { id: ComponentId } {
  return !!s && typeof s === 'object' && typeof s.id === 'string' && s.id in SECTION_META
}
