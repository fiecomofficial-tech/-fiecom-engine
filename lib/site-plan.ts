import type OpenAI from 'openai'
import { safeParseJSON } from './json-safe'
import { classifyIndustry, type IndustryKey } from './composition'
import { THEME_KEYS } from './themes'

/**
 * Stage 1 of the generation flow. Before any sections are composed, the
 * model decides what KIND of site the brand needs — emotional energy,
 * density, pacing, and which pages actually make sense. The composer
 * (Stage 2) then builds sections inside the boundaries of this plan.
 *
 * The point is to stop picking from a fixed bank of "homepage
 * variants" — every site gets a fresh plan, so two brands rarely land
 * on the same shape.
 */

export type EnergyDimension =
  | 'minimal'
  | 'editorial'
  | 'cinematic'
  | 'product-heavy'
  | 'immersive'
  | 'quiet-luxury'
  | 'startup'
  | 'artistic'
  | 'dense'
  | 'spacious'
  | 'storytelling-heavy'
  | 'conversion-heavy'

export type DensityDimension =
  | 'very-minimal'
  | 'spacious'
  | 'balanced'
  | 'dense'
  | 'very-dense'

export type CinematicDimension = 'restrained' | 'moderate' | 'high' | 'extreme'
export type MotionDimension = 'still' | 'subtle' | 'moderate' | 'rich'
export type PagePacing = 'tight' | 'balanced' | 'long-form'

export const ENERGIES: EnergyDimension[] = [
  'minimal', 'editorial', 'cinematic', 'product-heavy', 'immersive',
  'quiet-luxury', 'startup', 'artistic', 'dense', 'spacious',
  'storytelling-heavy', 'conversion-heavy',
]
export const DENSITIES: DensityDimension[] = ['very-minimal', 'spacious', 'balanced', 'dense', 'very-dense']
export const CINEMATIC_LEVELS: CinematicDimension[] = ['restrained', 'moderate', 'high', 'extreme']
export const MOTION_LEVELS: MotionDimension[] = ['still', 'subtle', 'moderate', 'rich']
export const PACINGS: PagePacing[] = ['tight', 'balanced', 'long-form']

export interface PagePlan {
  slug: string
  title: string
  purpose: string
  storyBeat: string
  pacing: PagePacing
  sectionCount: number
}

export interface SiteIntent {
  energy: EnergyDimension
  density: DensityDimension
  cinematicIntensity: CinematicDimension
  motionIntensity: MotionDimension
  copyTone: string
  themeHint: string
}

export interface SitePlan {
  brand: string
  industry: string
  intent: SiteIntent
  storyArc: string
  pages: PagePlan[]
  navOrder: string[]
}

const SITE_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['brand', 'industry', 'intent', 'storyArc', 'pages', 'navOrder'],
  properties: {
    brand: { type: 'string' },
    industry: { type: 'string', description: 'free-form short label, e.g. "boutique hotel", "indie devtool"' },
    intent: {
      type: 'object',
      additionalProperties: false,
      required: ['energy', 'density', 'cinematicIntensity', 'motionIntensity', 'copyTone', 'themeHint'],
      properties: {
        energy: { type: 'string', enum: ENERGIES },
        density: { type: 'string', enum: DENSITIES },
        cinematicIntensity: { type: 'string', enum: CINEMATIC_LEVELS },
        motionIntensity: { type: 'string', enum: MOTION_LEVELS },
        copyTone: { type: 'string', description: '2-4 word label, e.g. "warm editorial", "blunt technical"' },
        themeHint: { type: 'string', description: `one of: ${THEME_KEYS.join(', ')}` },
      },
    },
    storyArc: { type: 'string', description: 'one sentence describing the home flow' },
    pages: {
      type: 'array',
      minItems: 1,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'title', 'purpose', 'storyBeat', 'pacing', 'sectionCount'],
        properties: {
          slug: { type: 'string', description: 'kebab-case; first page must be "home"' },
          title: { type: 'string' },
          purpose: { type: 'string', description: 'one sentence — why this page exists for this brand' },
          storyBeat: { type: 'string', description: 'this page\'s role in the broader site narrative' },
          pacing: { type: 'string', enum: PACINGS },
          sectionCount: { type: 'integer', minimum: 4, maximum: 14 },
        },
      },
    },
    navOrder: {
      type: 'array',
      description: 'page titles in nav order; must be a subset of pages[].title',
      items: { type: 'string' },
      maxItems: 7,
    },
  },
} as const

function planSystemPrompt(): string {
  return `You are a site strategist for a modern website builder.
Return JSON only.

═════════════════════════════════════════════════════════════════════
YOUR JOB — CLEAN WEBSITE FIRST, CINEMATIC AS ENHANCEMENT
═════════════════════════════════════════════════════════════════════
Plan a REAL website — not a cinematic art project. EVERY site is built
on the Fiecom template foundation (clean Navbar, framed Hero, feature
grid, testimonials, inverted CTA card, clean Footer) — modeled on
Lovable, Framer AI, and Replit AI. The cinematicIntensity dial decides
how much cinematic motion layers ON TOP of that foundation on the
homepage only. Internal pages NEVER receive cinematic enhancement.

Decide: energy, density, cinematic intensity, motion, copy tone, theme,
page set, and arc. You are NOT composing sections yet.

Two different brands must produce visibly different plans. A boutique
hotel and a B2B devtool must NOT look the same. Push dimensions —
but toward what the brand actually needs. The default is "restrained";
escalating to "high" or "extreme" requires a visual/lifestyle reason.

═════════════════════════════════════════════════════════════════════
CRITICAL — LANDING vs INTERNAL PAGES
═════════════════════════════════════════════════════════════════════
The whole \`intent\` block (energy / density / cinematicIntensity /
motionIntensity) describes the LANDING PAGE (slug:"home") ONLY.

Internal pages (about, contact, pricing, services, work, etc.) are
NOT cinematic. They are clean, modern, utility-focused — closer to a
Lovable / Fiecom template / Framer template page. They support the landing page,
they do not compete with it.

For every internal page:
  • pacing MUST be "tight" (or "balanced" if it genuinely needs more)
  • sectionCount MUST be 4-6 (never 7+)
  • storyBeat should describe a UTILITY purpose ("explain pricing
    clearly", "make contact easy", "show team and values")
  • NEVER describe an internal page as cinematic, immersive, or
    storytelling-heavy — that energy lives on home.

For the home page:
  • pacing can be tight / balanced / long-form per the brand
  • sectionCount can stretch to 10-14 if the energy demands it
  • this is the ONE page that gets the cinematic treatment

═════════════════════════════════════════════════════════════════════
PAGE SET — keep it small and honest
═════════════════════════════════════════════════════════════════════
Pages are decided by the brand. Most brands only need 3-4 pages.
Only add a page if the brand truly needs it.
  • Home + About + Contact is a complete site.
  • Add Services / Product / Work only if the brand offers something
    specific to show.
  • Skip pricing if the brand isn't transactional.
  • Skip blog/journal unless there's a publishing story.
  • Skip careers unless the brand is hiring.
NEVER add filler pages just to make the nav bigger. NEVER add a page
you cannot describe a real purpose for. Aim for 3-5 pages total.
First page MUST have slug "home". Every page needs a clear purpose.

═════════════════════════════════════════════════════════════════════
PACING & DENSITY
═════════════════════════════════════════════════════════════════════
  • "tight" = 4-6 sections, decisive, low pacing — ALL internal pages
  • "balanced" = 7-9 sections, classic editorial rhythm — home option
  • "long-form" = 10-14 sections, cinematic scroll, layered narrative
    — home only, when the energy demands it
Pick what fits the page's story beat — internal pages stay tight.

A "minimal" or "quiet-luxury" home is allowed to be 5 sections total.
A "long-form" editorial home should plan 11-14 sections. Don't force a
middle ground when the brand wants an extreme.

═════════════════════════════════════════════════════════════════════
INTENT DIMENSIONS — be opinionated (these apply to HOME)
═════════════════════════════════════════════════════════════════════
energy: ${ENERGIES.join(' | ')}
density: ${DENSITIES.join(' | ')}
cinematicIntensity: ${CINEMATIC_LEVELS.join(' | ')}
motionIntensity: ${MOTION_LEVELS.join(' | ')}

Pick combinations that match the brand. "minimal + still + restrained"
is a real plan. "immersive + rich + extreme" is a real plan. Avoid the
generic "editorial + balanced + moderate + subtle" middle for everything.

BRAND-ARCHETYPE GUIDANCE — different brands deserve different styles:
  • architecture / interior / atelier → editorial luxury, spacious,
    HIGH cinematic (was restrained — now bumped because architecture is
    a visual portfolio brand)
  • SaaS / devtool / B2B → product-heavy or startup, dense, restrained
    cinematic, still/subtle motion, fintech-minimal or metallic-mono theme
  • fashion / lookbook → immersive or artistic, spacious, HIGH-to-EXTREME
    cinematic
  • restaurant / cafe / bakery / patisserie / chocolate → editorial warm,
    spacious, HIGH cinematic (bumped — food brands are visual)
  • AI / fintech → product-heavy or startup, dense, restrained cinematic,
    metallic-mono / fintech-minimal theme — NOT warm editorial themes
  • hotel / hospitality / resort / spa → cinematic quiet luxury, spacious,
    HIGH-to-EXTREME cinematic
  • creative studio / film / gallery → editorial or artistic, spacious,
    HIGH-to-EXTREME cinematic
Do NOT collapse every brief to the same shape. Two prompts for two
different categories must produce wholly different plans.

═════════════════════════════════════════════════════════════════════
CINEMATIC INTENSITY — DEFAULTS BY BRAND TYPE
═════════════════════════════════════════════════════════════════════
"restrained" is the correct default for functional/product brands.
Only assign higher values when the brand identity explicitly demands
visual immersion.

  ALWAYS "restrained": SaaS, B2B, fintech, banking, insurance, app,
    dashboard, platform, devtool, cloud, API, health, clinic, medical,
    therapy, fitness (non-luxury spa), education, course, bootcamp,
    coaching, legal, accounting, consulting, standard service agency

  "moderate" for mixed visual/functional brands: real estate,
    co-working, general services, B2C utility apps with brand polish

  "high" — DEFAULT for any visual brand: hotel, resort, luxury spa,
    fashion, lookbook, architecture studio, interior design, gallery,
    film studio, creative agency, bakery, cupcake / patisserie,
    chocolate, restaurant (chef-led), cafe (concept), skincare,
    apparel, beauty, retail with brand story

  "extreme" for purely visual/storytelling projects: game studio,
    high-end fashion lookbook, art project, experimental brand, any
    brand that explicitly asks for "cinematic", "immersive", "luxury",
    "premium", "editorial", "scroll choreography", or similar.

Do NOT assign "high" or "extreme" to functional or product brands
regardless of how the brief is phrased. "premium SaaS" means quality
design, not extreme cinematic. Match the industry, not the adjective.
Do NOT default to warm editorial themes (editorial-cream, warm-sand)
for tech/product brands — use fintech-minimal or metallic-mono.

═════════════════════════════════════════════════════════════════════
THEME HINT
═════════════════════════════════════════════════════════════════════
themeHint MUST be one of: ${THEME_KEYS.join(', ')}.
Pick what serves the energy — editorial-cream/warm-sand for warm
brands, fintech-minimal/metallic-mono for product/tech, editorial-noir
/midnight-luxury for cinematic/luxury, forest-luxe for natural/wellness,
brutalist-concrete for bold/artistic.

═════════════════════════════════════════════════════════════════════
OUTPUT
═════════════════════════════════════════════════════════════════════
{ brand, industry, intent:{...}, storyArc, pages:[...], navOrder:[...] }`
}

interface PlannerOptions {
  client: OpenAI
  model: string
  maxTokens?: number
}

export async function generateSitePlan(
  prompt: string,
  opts: PlannerOptions,
  preferences?: Record<string, unknown>,
): Promise<SitePlan> {
  const userMsg = preferences && Object.keys(preferences).length
    ? `Brand brief:\n${prompt}\n\nPreferences:\n${JSON.stringify(preferences)}`
    : `Brand brief:\n${prompt}`

  const response = await opts.client.chat.completions.create({
    model: opts.model,
    temperature: 0.95,
    max_tokens: opts.maxTokens ?? 1400,
    messages: [
      { role: 'system', content: planSystemPrompt() },
      { role: 'user', content: userMsg },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'site_plan', strict: false, schema: SITE_PLAN_SCHEMA },
    },
  })

  const raw = response.choices[0]?.message?.content ?? ''
  const parsed = safeParseJSON<unknown>(raw)
  if (!parsed.ok) throw new Error(`site plan: parse failed (${parsed.error})`)
  return sanitizeSitePlan(parsed.value, prompt)
}

/**
 * Defensive normalizer. The AI is mostly trustworthy under structured
 * output but we still pin invariants the rest of the pipeline assumes:
 * first page is "home", slugs are kebab, navOrder titles map to pages.
 */
export function sanitizeSitePlan(raw: unknown, prompt: string): SitePlan {
  const r = (raw ?? {}) as Partial<SitePlan>
  const fallback = fallbackSitePlan(prompt)

  const brand = nonEmpty(r.brand) ?? fallback.brand
  const industry = nonEmpty(r.industry) ?? fallback.industry
  const intent = sanitizeIntent(r.intent, fallback.intent)
  const storyArc = nonEmpty(r.storyArc) ?? fallback.storyArc

  const pagesRaw = Array.isArray(r.pages) ? r.pages : []
  let pages: PagePlan[] = pagesRaw
    .filter((p) => p && typeof p === 'object')
    .map((p) => sanitizePage(p as Partial<PagePlan>))
    .filter((p): p is PagePlan => p !== null)

  if (pages.length === 0) pages = fallback.pages
  // Ensure first page is home.
  const homeIdx = pages.findIndex((p) => p.slug === 'home')
  if (homeIdx === -1) {
    pages = [{ ...pages[0], slug: 'home', title: pages[0].title || 'Home' }, ...pages.slice(1)]
  } else if (homeIdx !== 0) {
    pages = [pages[homeIdx], ...pages.slice(0, homeIdx), ...pages.slice(homeIdx + 1)]
  }
  // Dedupe slugs.
  const seen = new Set<string>()
  pages = pages.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))

  const navOrderRaw = Array.isArray(r.navOrder) ? r.navOrder.filter((s) => typeof s === 'string') as string[] : []
  const navOrder = sanitizeNavOrder(navOrderRaw, pages)

  return { brand, industry, intent, storyArc, pages, navOrder }
}

function sanitizeIntent(raw: Partial<SiteIntent> | undefined, fallback: SiteIntent): SiteIntent {
  return {
    energy: (ENERGIES as readonly string[]).includes(raw?.energy as string) ? (raw!.energy as EnergyDimension) : fallback.energy,
    density: (DENSITIES as readonly string[]).includes(raw?.density as string) ? (raw!.density as DensityDimension) : fallback.density,
    cinematicIntensity: (CINEMATIC_LEVELS as readonly string[]).includes(raw?.cinematicIntensity as string) ? (raw!.cinematicIntensity as CinematicDimension) : fallback.cinematicIntensity,
    motionIntensity: (MOTION_LEVELS as readonly string[]).includes(raw?.motionIntensity as string) ? (raw!.motionIntensity as MotionDimension) : fallback.motionIntensity,
    copyTone: nonEmpty(raw?.copyTone) ?? fallback.copyTone,
    themeHint: (THEME_KEYS as readonly string[]).includes(raw?.themeHint as string) ? (raw!.themeHint as string) : fallback.themeHint,
  }
}

function sanitizePage(raw: Partial<PagePlan>): PagePlan | null {
  const slug = slugify(raw.slug || raw.title || '')
  if (!slug) return null
  const isHome = slug === 'home'
  let pacing: PagePacing = (PACINGS as readonly string[]).includes(raw.pacing as string)
    ? (raw.pacing as PagePacing)
    : 'balanced'
  const rawCount = typeof raw.sectionCount === 'number' ? Math.round(raw.sectionCount) : 8
  let sectionCount = Math.max(4, Math.min(14, rawCount))
  // Internal pages are clean utility pages. Cap them tight regardless of
  // what the planner returned — they must not compete with home.
  if (!isHome) {
    if (pacing === 'long-form') pacing = 'balanced'
    sectionCount = Math.max(4, Math.min(6, sectionCount))
  }
  return {
    slug,
    title: nonEmpty(raw.title) ?? titleForSlug(slug),
    purpose: nonEmpty(raw.purpose) ?? '',
    storyBeat: nonEmpty(raw.storyBeat) ?? '',
    pacing,
    sectionCount,
  }
}

function sanitizeNavOrder(raw: string[], pages: PagePlan[]): string[] {
  const titles = new Set(pages.map((p) => p.title))
  const slugMap = new Map(pages.map((p) => [p.slug, p.title]))
  const out: string[] = []
  for (const entry of raw) {
    if (titles.has(entry) && !out.includes(entry)) { out.push(entry); continue }
    const fromSlug = slugMap.get(slugify(entry))
    if (fromSlug && !out.includes(fromSlug)) out.push(fromSlug)
  }
  // Ensure every page is reachable somewhere in nav. Home goes first.
  for (const p of pages) {
    if (!out.includes(p.title)) out.push(p.title)
  }
  const homeTitle = pages[0].title
  const homeIdx = out.indexOf(homeTitle)
  if (homeIdx > 0) {
    out.splice(homeIdx, 1)
    out.unshift(homeTitle)
  }
  return out.slice(0, 7)
}

/**
 * Deterministic safety-net plan. Used when the AI planner fails, when
 * the API key is missing, and as the seed for sanitizing partial AI
 * output. Intentionally simple — the AI plan is the real product.
 */
export function fallbackSitePlan(prompt: string): SitePlan {
  const industry = classifyIndustry(prompt)
  const brand = guessBrand(prompt)
  const seed = SEEDS[industry]
  return {
    brand,
    industry,
    intent: seed.intent,
    storyArc: seed.storyArc,
    pages: seed.pages,
    navOrder: seed.pages.map((p) => p.title),
  }
}

interface IndustrySeed {
  intent: SiteIntent
  storyArc: string
  pages: PagePlan[]
}

const SEEDS: Record<IndustryKey, IndustrySeed> = {
  saas: {
    intent: { energy: 'product-heavy', density: 'balanced', cinematicIntensity: 'restrained', motionIntensity: 'still', copyTone: 'blunt technical', themeHint: 'fintech-minimal' },
    storyArc: 'Land on a sharp value claim, walk through capability proof, end on plan + contact.',
    pages: [
      seedPage('home', 'Home', 'Convert technical decision-makers in one scroll', 'opening pitch + proof + pricing', 'balanced', 9),
      seedPage('product', 'Product', 'Show how the product actually works', 'capability explainer', 'tight', 5),
      seedPage('pricing', 'Pricing', 'Make plan choice and signup obvious', 'commercial logic', 'tight', 4),
      seedPage('contact', 'Contact', 'Capture qualified inbound', 'human handoff', 'tight', 4),
    ],
  },
  fintech: {
    intent: { energy: 'editorial', density: 'spacious', cinematicIntensity: 'restrained', motionIntensity: 'still', copyTone: 'calm authoritative', themeHint: 'fintech-minimal' },
    storyArc: 'Open with trust, walk through product flows, end on plans + a clean contact.',
    pages: [
      seedPage('home', 'Home', 'Build trust and explain the product fast', 'positioning + proof + plans', 'balanced', 9),
      seedPage('product', 'Product', 'Show the product working end-to-end', 'capability summary', 'tight', 5),
      seedPage('plans', 'Plans', 'Make pricing legible', 'commercial logic', 'tight', 4),
      seedPage('contact', 'Contact', 'Open a conversation', 'human handoff', 'tight', 4),
    ],
  },
  hospitality: {
    intent: { energy: 'cinematic', density: 'spacious', cinematicIntensity: 'high', motionIntensity: 'moderate', copyTone: 'warm sensory', themeHint: 'warm-sand' },
    storyArc: 'Immerse in the place, then walk through the experience, then close on booking.',
    pages: [
      seedPage('home', 'Home', 'Make the destination feel immediate', 'arrival + atmosphere', 'long-form', 10),
      seedPage('rooms', 'Rooms', 'Show what you actually stay in', 'inventory list', 'tight', 5),
      seedPage('reservations', 'Reservations', 'Make booking obvious', 'transactional', 'tight', 4),
      seedPage('contact', 'Contact', 'Reach the front desk', 'human handoff', 'tight', 4),
    ],
  },
  creative: {
    intent: { energy: 'editorial', density: 'spacious', cinematicIntensity: 'high', motionIntensity: 'moderate', copyTone: 'sparse confident', themeHint: 'editorial-noir' },
    storyArc: 'Open on selected work, walk through the studio voice, end on a focused contact.',
    pages: [
      seedPage('home', 'Home', 'Lead with the work', 'selected work + studio statement', 'long-form', 10),
      seedPage('work', 'Work', 'Show range and craft', 'project list', 'tight', 5),
      seedPage('studio', 'Studio', 'Who you are and why', 'about + voice', 'tight', 5),
      seedPage('contact', 'Contact', 'Make starting a project easy', 'transactional', 'tight', 4),
    ],
  },
  commerce: {
    intent: { energy: 'editorial', density: 'spacious', cinematicIntensity: 'high', motionIntensity: 'moderate', copyTone: 'warm intentional', themeHint: 'editorial-cream' },
    storyArc: 'Open with the product\'s sensory feel, walk through the line, close on story + buy.',
    pages: [
      seedPage('home', 'Home', 'Make the product feel desirable', 'editorial product feel', 'balanced', 9),
      seedPage('products', 'Products', 'Show the line', 'catalog list', 'tight', 5),
      seedPage('about', 'About', 'Brand origin and intent', 'studio voice', 'tight', 5),
      seedPage('contact', 'Contact', 'Customer support entry', 'support', 'tight', 4),
    ],
  },
  food: {
    intent: { energy: 'editorial', density: 'spacious', cinematicIntensity: 'high', motionIntensity: 'moderate', copyTone: 'warm sensory', themeHint: 'warm-sand' },
    storyArc: 'Open on the room and food, walk through the menu story, close on reservations.',
    pages: [
      seedPage('home', 'Home', 'Make the room and food feel real', 'arrival + sensory + menu hook', 'balanced', 8),
      seedPage('menu', 'Menu', 'Show what is on offer', 'menu browse', 'tight', 5),
      seedPage('reservations', 'Reservations', 'Make booking obvious', 'transactional', 'tight', 4),
    ],
  },
  health: {
    intent: { energy: 'quiet-luxury', density: 'spacious', cinematicIntensity: 'restrained', motionIntensity: 'subtle', copyTone: 'calm reassuring', themeHint: 'editorial-cream' },
    storyArc: 'Open in a calm, trusted register; explain the care; end on contact.',
    pages: [
      seedPage('home', 'Home', 'Establish trust quickly', 'voice + proof + steps', 'balanced', 8),
      seedPage('care', 'Care', 'Show how care is delivered', 'service explanation', 'tight', 5),
      seedPage('contact', 'Contact', 'Easy first step', 'human handoff', 'tight', 4),
    ],
  },
  education: {
    intent: { energy: 'editorial', density: 'balanced', cinematicIntensity: 'restrained', motionIntensity: 'subtle', copyTone: 'clear ambitious', themeHint: 'editorial-cream' },
    storyArc: 'Open on outcomes, walk through the program, close on enrollment.',
    pages: [
      seedPage('home', 'Home', 'Sell outcomes and program', 'positioning + curriculum + signup', 'balanced', 9),
      seedPage('programs', 'Programs', 'Show what you can take', 'program list', 'tight', 5),
      seedPage('pricing', 'Pricing', 'Make enrollment legible', 'commercial logic', 'tight', 4),
      seedPage('contact', 'Contact', 'Talk to admissions', 'human handoff', 'tight', 4),
    ],
  },
  app: {
    intent: { energy: 'product-heavy', density: 'dense', cinematicIntensity: 'restrained', motionIntensity: 'still', copyTone: 'crisp product', themeHint: 'metallic-mono' },
    storyArc: 'Open with the dashboard moment, walk through workflows, close on plans.',
    pages: [
      seedPage('home', 'Home', 'Make the product feel real fast', 'metric-led pitch + flows', 'balanced', 9),
      seedPage('product', 'Product', 'Show workflows in depth', 'capability summary', 'tight', 5),
      seedPage('pricing', 'Pricing', 'Make plan choice obvious', 'commercial logic', 'tight', 4),
      seedPage('contact', 'Contact', 'Sales handoff', 'human handoff', 'tight', 4),
    ],
  },
  default: {
    intent: { energy: 'editorial', density: 'balanced', cinematicIntensity: 'restrained', motionIntensity: 'subtle', copyTone: 'warm confident', themeHint: 'editorial-cream' },
    storyArc: 'Open on positioning, walk through capability and proof, close on contact.',
    pages: [
      seedPage('home', 'Home', 'Establish the brand fast', 'positioning + proof + close', 'balanced', 9),
      seedPage('about', 'About', 'Who and why', 'studio voice', 'tight', 5),
      seedPage('contact', 'Contact', 'Make the first step easy', 'human handoff', 'tight', 4),
    ],
  },
}

function seedPage(slug: string, title: string, purpose: string, storyBeat: string, pacing: PagePacing, sectionCount: number): PagePlan {
  return { slug, title, purpose, storyBeat, pacing, sectionCount }
}

function guessBrand(prompt: string): string {
  const quoted = prompt.match(/["'“]([^"'”]{2,40})["'”]/)
  if (quoted) return clean(quoted[1])
  const named = prompt.match(/\b(?:for|called|named|brand)\s+([A-Z][A-Za-z0-9& -]{1,32})/)
  if (named) return clean(named[1])
  return 'Studio'
}

function clean(s: string): string {
  return s.trim().replace(/[^\w& -]/g, '').slice(0, 28) || 'Studio'
}

function slugify(s: string): string {
  return (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
}

function titleForSlug(slug: string): string {
  if (slug === 'home') return 'Home'
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function nonEmpty(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** Human-readable summary of a site plan, used as part of the user
 *  message to the composer call. Compact — every byte is paid for. */
export function describeSitePlan(plan: SitePlan): string {
  const intent = plan.intent
  const pages = plan.pages
    .map((p) => `  /${p.slug} (${p.title}) — pacing:${p.pacing} sections~${p.sectionCount} — ${p.purpose}${p.storyBeat ? ` (beat: ${p.storyBeat})` : ''}`)
    .join('\n')
  return [
    `Brand: ${plan.brand}`,
    `Industry: ${plan.industry}`,
    `Energy: ${intent.energy} | Density: ${intent.density} | Cinematic: ${intent.cinematicIntensity} | Motion: ${intent.motionIntensity}`,
    `Copy tone: ${intent.copyTone}`,
    `Theme: ${intent.themeHint}`,
    `Story arc: ${plan.storyArc}`,
    `Nav: ${plan.navOrder.join(' · ')}`,
    `Pages:`,
    pages,
  ].join('\n')
}
