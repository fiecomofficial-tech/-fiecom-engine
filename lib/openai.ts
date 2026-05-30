import OpenAI from 'openai'
import { SECTION_META, type ComponentId } from './registry'
import type { PreviewConfig } from './render-preview'
import { THEME_KEYS } from './themes'
import { safeParseJSON, dumpFailure } from './json-safe'
import { validateGeneratedConfig } from './validate'
import { generateSitePlan, fallbackSitePlan, describeSitePlan, type SitePlan } from './site-plan'
import { strengthenGeneratedConfig } from './composition-guard'
import { safeHeaderValue } from './safe-headers'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  ? safeHeaderValue(process.env.OPENAI_API_KEY)
  : undefined
const client = new OpenAI({ apiKey: OPENAI_API_KEY })
const PLANNER_MODEL = process.env.OPENAI_PLANNER_MODEL ?? process.env.OPENAI_COMPOSITION_MODEL ?? 'gpt-4.1-mini'
const COMPOSER_MODEL = process.env.OPENAI_COMPOSITION_MODEL ?? 'gpt-4.1-mini'
const MAX_TOKENS = Number(process.env.OPENAI_COMPOSITION_MAX_TOKENS ?? 6500)

const BASE44_COMPONENT_IDS: ComponentId[] = [
  // Chrome
  'BaselineNavbar',
  'BaselineFooter',
  // Baseline foundation
  'BaselineHero',
  'BaselineLogoBar',
  'BaselineFeatures',
  'BaselineTestimonials',
  'BaselineCTA',
  'BaselinePageHeader',
  'BaselineAboutNarrative',
  'BaselineContact',
  // Functional blocks
  'FeatureList',
  'PricingTiers',
  'FAQAccordion',
  'ContactBlock',
  'ContactForm',
  'NewsletterSignup',
  'LinkList',
  'BlogIndex',
  'JobsList',
  'ChangelogList',
  'TwoColumnText',
  'LogoCloud',
  'MetricRow',
  // Cinematic homepage allowlist — HOME PAGE ONLY, intent-capped
  'MessageReveal',
  'MarqueeBand',
  'ImageGallery',
  'HorizontalShowcase',
  'EditorialQuote',
  'AsymmetricGrid',
  'StickyNarrative',
  // Alternate cinematic heroes (replace BaselineHero for visual brands)
  'HeroCinematic',
  'HeroEditorial',
  // Imported cinematic template families (homepage only, used sparingly)
  'ZentryHero', 'ZentryAbout', 'ZentryFeatures', 'ZentryStory', 'ZentryContact',
  'FlowHero', 'FlowEvent', 'FlowWhoWeAre', 'FlowOnDemand', 'FlowTutors',
  'FlowWhatWeDo', 'FlowPartyTools',
  'SpyltHero', 'SpyltMessage', 'SpyltFlavor', 'SpyltNutrition', 'SpyltBenefit',
  'SpyltTestimonials', 'SpyltBottomBanner',
  'TruusVimeoHero', 'TruusHorizontalWords', 'TruusMotionCards', 'TruusShowreel',
  'TruusServiceCards', 'TruusDoubleMarquee',
]

const COMPACT_REGISTRY_DOC = buildRegistryDoc()

function buildRegistryDoc(): string {
  const byTier: Record<string, Record<string, string[]>> = { cinematic: {}, block: {} }
  for (const id of BASE44_COMPONENT_IDS) {
    const m = SECTION_META[id]
    const t = (byTier[m.tier] = byTier[m.tier] ?? {})
    ;(t[m.role] = t[m.role] ?? []).push(`  ${id} → ${m.contentNotes}`)
  }
  const tierDoc = (label: string, key: string) => {
    const entries = Object.entries(byTier[key] ?? {})
    if (!entries.length) return ''
    return [
      `=== ${label} ===`,
      ...entries.map(([role, lines]) => `[${role.toUpperCase()}]\n${lines.join('\n')}`),
    ].join('\n\n')
  }
  return [tierDoc('FIECOM TEMPLATE BLOCKS', 'block')].filter(Boolean).join('\n\n')
}

function composerSystemPrompt(): string {
  return `You are a section composer for a modern website builder.
Return JSON only. You are given a SITE PLAN with intent dimensions and
per-page pacing — your job is to compose sections that honor that plan.

═════════════════════════════════════════════════════════════════════════
ARCHITECTURE — FIECOM TEMPLATE BASELINE ONLY
═════════════════════════════════════════════════════════════════════════
The foundation of EVERY site is a clean, modern, usable website —
modeled on Lovable, Framer AI, Framer AI, and Replit AI. That foundation
is provided by the Baseline* section family:

  BaselineNavbar          — pill nav, shrinks on scroll, mobile drawer
  BaselineHero            — clean text+framed-image hero with serif italic accent
  BaselineLogoBar         — wordmark band on muted surface
  BaselineFeatures        — 3-card grid with framed image per card
  BaselineTestimonials    — 3-card quotes on muted surface
  BaselineCTA             — inverted dark CTA card with soft accent glow
  BaselinePageHeader      — internal-page opener (NOT a hero)
  BaselineAboutNarrative  — internal About page body (narrative + pillars + stats)
  BaselineContact         — internal Contact page body (details + clean form)
  BaselineFooter          — link columns + tagline + legal/meta links

Cinematic homepage layer (re-enabled, HOMEPAGE ONLY, never on internal):

  • Safe inserts: MessageReveal, MarqueeBand, ImageGallery,
    HorizontalShowcase — slot BETWEEN baseline sections.
  • Alternate cinematic heroes: HeroEditorial, HeroCinematic, ZentryHero,
    FlowHero, SpyltHero, TruusVimeoHero — REPLACE BaselineHero on visual
    brands when cinematicIntensity ≥ moderate.
  • Imported template body sections: Zentry*/Flow*/Spylt*/Truus* —
    AT MOST ONE per page. Never chain an entire family.

A two-brand test: a "minimal SaaS" and a "cinematic hotel" share the
chrome (BaselineNavbar + BaselineFooter) and END with BaselineCTA. They
differ in: hero variant, text, colors, fonts, branding, Pexels images,
WHICH optional body sections appear, and in what order. SaaS = 0
cinematic inserts + BaselineHero. Hotel = 2–3 inserts and may use
HeroEditorial or HeroCinematic instead of BaselineHero.

═════════════════════════════════════════════════════════════════════════
SECTION REGISTRY — use ids verbatim, keep content compact
═════════════════════════════════════════════════════════════════════════
${COMPACT_REGISTRY_DOC}

═════════════════════════════════════════════════════════════════════════
HOME PAGE COMPOSITION — BASELINE BACKBONE + CINEMATIC ENHANCEMENTS
═════════════════════════════════════════════════════════════════════════
The home page MUST:
  • Open with BaselineNavbar (chrome — added by guard if you omit).
  • Have a HERO as the FIRST body section (BaselineHero by default;
    alternate cinematic heroes allowed for visual brands).
  • End with BaselineCTA + BaselineFooter (closing).

Between hero and CTA you have FULL composition freedom. The composer
should treat each brand as a fresh website, not a fill-in-the-blanks
template. Two prompts for two different brand types must differ in
WHICH SECTIONS APPEAR, not just in copy.

ALLOWED HOME BODY SECTIONS (pick 4-8 between Hero and CTA):
  • Baseline: BaselineLogoBar, BaselineFeatures, BaselineTestimonials,
    BaselineAboutNarrative
  • Functional: PricingTiers, FAQAccordion, FeatureList, LogoCloud,
    TwoColumnText, ContactBlock, MetricRow
  • Cinematic safe inserts (HOMEPAGE ONLY, capped by intensity):
    MessageReveal, MarqueeBand, ImageGallery, HorizontalShowcase
  • Imported cinematic family bodies (use at most ONE per page):
    ZentryAbout, ZentryFeatures, ZentryStory, ZentryContact,
    FlowEvent, FlowWhoWeAre, FlowOnDemand, FlowTutors, FlowWhatWeDo,
    FlowPartyTools,
    SpyltMessage, SpyltFlavor, SpyltNutrition, SpyltBenefit,
    SpyltTestimonials, SpyltBottomBanner,
    TruusHorizontalWords, TruusMotionCards, TruusShowreel,
    TruusServiceCards, TruusDoubleMarquee

ALLOWED HOME HEROES (pick exactly ONE, first body section):
  • BaselineHero — default; always safe; required for restrained brands.
  • HeroEditorial — large editorial typography hero (newspaper-style).
    Use for fashion, gallery, agency, architecture (cinematicIntensity ≥ moderate).
  • HeroCinematic — char-split cinematic hero with motion.
    Use for hotel, lookbook, film studio (cinematicIntensity ≥ high).
  • ZentryHero / FlowHero / SpyltHero / TruusVimeoHero — full-bleed
    cinematic heroes from imported families. Use only when the brand
    matches the family's aesthetic and cinematicIntensity ≥ high.

Disabled (do NOT output): StickyNavbar, FooterRich, FeatureBento,
StatsCounter, TimelineScroll, StickyChapters, ClosingCTA, CTABanner.

═════════════════════════════════════════════════════════════════════════
CINEMATIC INTENSITY — HOMEPAGE INSERT RULES
═════════════════════════════════════════════════════════════════════════
plan.intent.cinematicIntensity decides how many cinematic INSERTS you
may place AFTER the hero (the hero itself is separate):

  • restrained → 0-1 cinematic inserts, BaselineHero only
    (SaaS, devtool, fintech, health, education, legal, B2B service)
  • moderate   → 2-3 cinematic inserts, HeroEditorial allowed
    (restaurant, cafe, retail, e-commerce, skincare, co-working, real estate)
  • high       → 4-6 cinematic inserts, any cinematic hero allowed.
    This is the core business model — visual/luxury brands should feel
    CINEMATIC, not template-clean. AIM for 5-6 inserts when the brand
    strongly supports it. (hotel, resort, fashion, architecture studio,
    gallery, film studio, creative agency)
  • extreme    → 6-8 cinematic inserts, any cinematic hero allowed.
    Push for full premium scroll choreography. Almost every body slot
    between hero and CTA should be cinematic, alternated with one or
    two baseline anchors for rhythm. (high-end fashion, art project,
    game studio, experimental brand)

Where to place inserts:
  • NEVER as the first body section — that slot is the hero.
  • Vary insertion slots per brand: after Hero, after LogoBar, after
    Features, before Testimonials, before CTA. Two different brands
    should not always put the cinematic insert in the same place.
  • Cinematic inserts MUST be SURROUNDED by baseline sections, not
    stacked back-to-back. The guard drops back-to-back cinematic.
  • The guard ALSO dedupes by id — you cannot use the same cinematic
    component twice on one page.

═════════════════════════════════════════════════════════════════════════
CINEMATIC FAMILIES — MATCH FAMILY TO INDUSTRY
═════════════════════════════════════════════════════════════════════════
The cinematic library is grouped into families. Do NOT default to
MessageReveal + MarqueeBand + ImageGallery for everything. Pick from
the families that match the brand:

  editorial   — MessageReveal, TruusHorizontalWords, ZentryStory,
                HeroEditorial
                (typography-led brands: agency, architecture, gallery,
                editorial, atelier)
  showcase    — ImageGallery, HorizontalShowcase, TruusShowreel,
                ZentryFeatures
                (visual portfolio: hotel, fashion, gallery, studio,
                architecture)
  playful     — SpyltHero, SpyltFlavor, SpyltMessage, SpyltBottomBanner
                (food, drink, cafe, restaurant, bakery, cupcake, retail
                product brands)
  experience  — FlowEvent, FlowWhoWeAre, FlowOnDemand, FlowTutors
                (event, community, education, coaching, tutoring,
                conferences)
  luxury      — HeroCinematic, ZentryHero, ZentryAbout, TruusVimeoHero
                (premium hospitality, luxury retail, immersive brand)
  social      — SpyltTestimonials, TruusDoubleMarquee, FlowTutors
                (social-proof augmentation; pairable with any family)

  punctuation — MarqueeBand (universal — usable with any family,
                still capped at one per page).

Industry → families to draw from:
  • hotel / luxury / travel / resort      → luxury + showcase
  • fashion / atelier / beauty / lookbook → editorial + showcase
  • food / drink / cafe / restaurant /
    bakery / cupcake / patisserie         → playful (+ social)
  • event / community / education /
    school / academy / coaching           → experience (+ social)
  • architecture / studio / agency /
    gallery / film studio / portfolio     → editorial + showcase
  • SaaS / devtool / fintech / health /
    legal / B2B service                   → editorial only (restrained)

Two prompts in the same industry should pick DIFFERENT family members.
A boutique hotel and a luxury resort both draw from luxury+showcase,
but one might use ZentryHero+ImageGallery while the other uses
HeroCinematic+TruusShowreel. The guard rotates the augmentation pool
deterministically per brand name, so vary your choices accordingly.

Example homepage shapes:

  SaaS / devtool (restrained, 0-1 inserts):
    Navbar → BaselineHero → LogoBar → Features → FAQAccordion → CTA → Footer

  Cupcake bakery (moderate, 2-3 inserts):
    Navbar → BaselineHero → MarqueeBand → Features → SpyltFlavor →
    Testimonials → SpyltMessage → CTA → Footer

  Boutique hotel (high, 5-6 inserts):
    Navbar → HeroCinematic → MarqueeBand → LogoBar → MessageReveal →
    Features → ImageGallery → ZentryAbout → Testimonials →
    HorizontalShowcase → TruusShowreel → CTA → Footer

  Fashion lookbook (extreme, 6-8 inserts):
    Navbar → HeroCinematic → MarqueeBand → HorizontalShowcase → Features →
    MessageReveal → ImageGallery → SpyltFlavor → TruusHorizontalWords →
    ZentryStory → CTA → Footer

  Architecture studio (high, 5-6 inserts):
    Navbar → HeroEditorial → MarqueeBand → ZentryStory → Features →
    HorizontalShowcase → MessageReveal → TruusHorizontalWords →
    ImageGallery → CTA → Footer

═════════════════════════════════════════════════════════════════════════
SECTION COUNT
═════════════════════════════════════════════════════════════════════════
Aim for plan.pages[i].sectionCount (±2). Home can be 5-12 sections
total. Internal pages stay 4-6. DENSITY multiplier on home only:
  • very-minimal × 0.55  • spacious × 0.8  • balanced × 1.0
  • dense × 1.15  • very-dense × 1.3.

DIVERSITY DIRECTIVE — Two prompts for two different brand types should
differ in which sections appear AND in copy/theme/fonts/branding. A
"minimal SaaS" and a "boutique hotel" must produce visibly different
home pages, not the same skeleton with different text.

[MEDIA]
Use still Pexels image queries only. No videos. No fullscreen media
queries. Keep media subjects on-brand (architecture/landscape/textures
for cinematic brands; product/team/workspace for functional brands).

═════════════════════════════════════════════════════════════════════════
LANDING vs INTERNAL PAGES — THIS IS THE MOST IMPORTANT RULE
═════════════════════════════════════════════════════════════════════════
The site has ONE landing page (slug:"home") and the rest are INTERNAL
pages. They are NOT the same kind of page and must NOT be composed
the same way.

LANDING PAGE (slug:"home")
  • Fixed Baseline backbone only.
  • Intent dimensions may affect text/media choices, not structure.
  • Open with BaselineNavbar + BaselineHero.
  • Close with BaselineCTA + BaselineFooter.
  • Do not choose alternate heroes or alternate chrome.

INTERNAL PAGES (every other slug — about, contact, pricing, services,
work, etc.)
  • CLEAN, MODERN, UTILITY-FOCUSED. Closer to a Lovable/Framer AI/Replit AI
    page than a stripped landing. They SUPPORT the landing — they do
    NOT compete with it.
  • Intent dimensions DO NOT apply here. Internal pages are ALWAYS
    restrained regardless of energy.
  • Max 6 sections total (BaselineNavbar + BaselinePageHeader + 2-3
    body sections + BaselineFooter).
  • Open with BaselineNavbar then BaselinePageHeader. NEVER a hero.
  • FORBIDDEN on internal pages: BaselineHero, BaselineCTA, MarqueeBand,
    MessageReveal, ImageGallery, HorizontalShowcase, BaselineLogoBar,
    BaselineFeatures, BaselineTestimonials, and all old cinematic hero /
    imported-template sections.
  • ALLOWED on internal pages (pick 1-3 body sections):
    BaselinePageHeader (REQUIRED first body), BaselineAboutNarrative,
    BaselineContact, TwoColumnText, FeatureList,
    PricingTiers (pricing/plans page only), FAQAccordion, ContactForm,
    ContactBlock, LinkList, BlogIndex (journal only), JobsList (careers
    only), ChangelogList (changelog only), NewsletterSignup, LogoCloud
    (sparingly).
  • CANONICAL INTERNAL PAGE SHAPES (use these unless brand demands more):
    - About    = BaselineNavbar + BaselinePageHeader + BaselineAboutNarrative + BaselineFooter
    - Contact  = BaselineNavbar + BaselinePageHeader + BaselineContact + BaselineFooter
    - Pricing  = BaselineNavbar + BaselinePageHeader + PricingTiers + FAQAccordion + BaselineFooter
    - Services = BaselineNavbar + BaselinePageHeader + FeatureList + FAQAccordion + BaselineFooter
    - Work     = BaselineNavbar + BaselinePageHeader + TwoColumnText + LinkList + BaselineFooter
  • Keep copy SHORT and direct. No big typography moments. No drama.

═════════════════════════════════════════════════════════════════════════
PAGE-BY-PAGE COMPOSITION RULES
═════════════════════════════════════════════════════════════════════════
For each page in the plan:
  1. Open with BaselineNavbar (every page, every site, every time).
  2. If page is "home", open the body with BaselineHero. If it's an
     internal page, open with BaselinePageHeader.
  3. Build sections that deliver the page's storyBeat. Respect
     sectionCount — within ±2 is fine for home, internal pages stay 4-6.
  4. Preserve the baseline ordering. Vary text, colors, fonts, branding,
     and still images — not the layout system.
  5. Close every page with BaselineFooter.

The landing page should feel unique and emotional. Internal pages should
feel simple, fast, professional — interchangeable across brands is FINE
for internal pages because that is the point. Their job is to be clear,
not memorable.

═════════════════════════════════════════════════════════════════════════
THEME
═════════════════════════════════════════════════════════════════════════
theme.preset MUST be one of: ${THEME_KEYS.join(', ')}.
Prefer plan.intent.themeHint. Do not invent custom bg/ink colors unless
strictly necessary — themes already cover the contrast cases.

═════════════════════════════════════════════════════════════════════════
MEDIA (Pexels photos only)
═════════════════════════════════════════════════════════════════════════
Return 2-5 word Pexels search queries only where the registry asks for
media. Do not emit URLs. Aim for cinematic, premium, editorial,
atmospheric subjects (architecture, landscapes, textures, materials,
ambient light, hands at work, travel, interiors). Avoid generic
"business/team", corporate office, influencer/tiktok-style, low-quality,
or staged-handshake imagery.

No video queries. No fullscreen media. No parallax or scroll-scaling
media behavior.

═════════════════════════════════════════════════════════════════════════
CONTENT TONE
═════════════════════════════════════════════════════════════════════════
Follow plan.intent.copyTone. If the brief is short/vague:
  • Keep copy broad, emotional, positioning-led.
  • Do NOT invent specific prices, plan names, team members, addresses,
    phone numbers, dates, awards, statistics, or operational details.
  • Pricing tiers may exist structurally but use generic tokens
    ("Starter", "Studio", "Custom") instead of fake dollar amounts.
  • FAQs should be category-level, not operations-specific.
  • Testimonials may be omitted or use only first-name + role.
Only generate detailed specifics when the brief explicitly supplies them.

═════════════════════════════════════════════════════════════════════════
OUTPUT CAPS
═════════════════════════════════════════════════════════════════════════
Sections per page: target plan.pages[i].sectionCount (±2). Total <= 30.
Short strings only: headlines <= 8 words, body <= 1 sentence.
Arrays: features/cards/events/posts <= 5, stats <= 4, faqs <= 5, tiers <= 3.
Skip optional fields. No filler.

═════════════════════════════════════════════════════════════════════════
NAVIGATION & CTA DESTINATIONS
═════════════════════════════════════════════════════════════════════════
BaselineNavbar must appear on every page with the SAME nav links derived
from plan.navOrder. Every nav link must point to a page that exists in
this output.
  • Home page → "/"
  • Sub-pages → "/<slug>" matching a slug emitted below
  • Same-page jumps → "#section"
NEVER point a primary nav link at a homepage anchor if a matching
sub-page exists. CTA buttons should use "/contact" if contact is in the
plan, else mailto:.
ContactForm must include recipientEmail. ContactBlock CTA must be mailto:.

═════════════════════════════════════════════════════════════════════════
MULTI-PAGE OUTPUT
═════════════════════════════════════════════════════════════════════════
Return { theme, pages:[{slug,title?,sections}] }. First slug must be
"home". Emit EVERY page in the plan — do not collapse them. Each
non-home page tells its own focused story; it is not a stripped homepage.

═════════════════════════════════════════════════════════════════════════
OUTPUT
═════════════════════════════════════════════════════════════════════════
JSON: { theme: {...}, pages: [{ slug, title?, sections: [...] }, ...] }`
}

const COMPOSER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['theme', 'pages'],
  properties: {
    theme: {
      type: 'object',
      additionalProperties: true,
      required: ['preset'],
      properties: {
        preset: { type: 'string', enum: THEME_KEYS },
        accent: { type: 'string' },
        bg: { type: 'string' },
        ink: { type: 'string' },
        bgAccent: { type: 'string' },
        fontDisplay: { type: 'string' },
        fontBody: { type: 'string' },
      },
    },
    pages: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slug', 'sections'],
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          sections: {
            type: 'array',
            minItems: 3,
            maxItems: 20,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'content', 'imageQueries'],
              properties: {
                id: { type: 'string', enum: BASE44_COMPONENT_IDS as unknown as string[] },
                content: { type: 'object', additionalProperties: true },
                imageQueries: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    primary: { type: 'string' },
                    secondary: { type: 'string' },
                    gallery: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

interface GenerateOptions {
  prompt: string
  preferences?: Record<string, unknown>
  uploads?: Record<string, unknown>
}

export async function generatePreviewConfig(
  input: string | GenerateOptions,
): Promise<PreviewConfig> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured')
  const opts: GenerateOptions = typeof input === 'string' ? { prompt: input } : input
  if (!opts.prompt) throw new Error('prompt is required')

  // Stage 1 — site plan. Falls back to a deterministic plan if the AI
  // call fails so the pipeline never collapses.
  let plan: SitePlan
  try {
    plan = await generateSitePlan(opts.prompt, { client, model: PLANNER_MODEL }, opts.preferences)
    console.log(`[fiecom/plan] industry=${plan.industry} energy=${plan.intent.energy} density=${plan.intent.density} pages=${plan.pages.map((p) => p.slug).join(',')}`)
  } catch (err) {
    console.warn(`[fiecom/plan] planner failed, using fallback: ${err instanceof Error ? err.message : err}`)
    plan = fallbackSitePlan(opts.prompt)
  }

  // Stage 2 — composer.
  return await composeFromPlan(opts, plan)
}

async function composeFromPlan(
  opts: GenerateOptions,
  plan: SitePlan,
): Promise<PreviewConfig> {
  const userMessage = buildComposerUserMessage(opts.prompt, plan, opts.preferences, opts.uploads)

  const attempts: Array<{ label: string; extra?: string; maxTokens: number; temperature: number }> = [
    { label: 'primary', maxTokens: MAX_TOKENS, temperature: 0.85 },
    {
      label: 'shrink',
      maxTokens: Math.min(MAX_TOKENS, 4200),
      temperature: 0.4,
      extra:
        '\n\nPREVIOUS ATTEMPT FAILED — output was truncated or invalid.\n' +
        'GENERATE A SMALLER SITE:\n' +
        '  • Cap each page at 6 sections.\n' +
        '  • Cut every body string to 1 sentence.\n' +
        '  • Cut every array (features/tiers/faqs/stats/etc.) to 3 entries MAX.\n' +
        '  • Skip optional fields.',
    },
  ]

  let lastRaw = ''
  let lastError = ''
  for (const attempt of attempts) {
    const system = composerSystemPrompt() + (attempt.extra ?? '')
    const response = await client.chat.completions.create({
      model: COMPOSER_MODEL,
      temperature: attempt.temperature,
      max_tokens: attempt.maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'preview_config', strict: false, schema: COMPOSER_SCHEMA },
      },
    })

    const raw = response.choices[0]?.message?.content ?? ''
    lastRaw = raw
    if (!raw) { lastError = 'empty response'; continue }

    const parsed = safeParseJSON<unknown>(raw)
    if (!parsed.ok) {
      lastError = `parse failed: ${parsed.error}`
      console.warn(`[fiecom/compose] attempt=${attempt.label} ${lastError} (raw ${raw.length} chars)`)
      continue
    }
    if (parsed.repaired) {
      console.warn(`[fiecom/compose] attempt=${attempt.label} repaired truncated JSON (raw ${raw.length} chars)`)
    }

    const v = validateGeneratedConfig(parsed.value)
    if (v.issues.length > 0) {
      console.warn(
        `[fiecom/compose] attempt=${attempt.label} validator issues:`,
        v.issues.map((i) => `${i.level}: ${i.message}`).join(' | '),
      )
    }
    if (!v.renderable) { lastError = 'no renderable sections'; continue }

    return strengthenGeneratedConfig(v.value as PreviewConfig, {
      prompt: opts.prompt,
      preferences: opts.preferences,
      plan,
    }) as PreviewConfig
  }

  const dumped = dumpFailure('generate', lastRaw)
  console.error(`[fiecom/compose] all attempts failed (${lastError}); raw saved to ${dumped}`)
  throw new Error(`Composition failed: ${lastError}. Raw response saved to ${dumped}`)
}

function buildComposerUserMessage(
  prompt: string,
  plan: SitePlan,
  preferences?: Record<string, unknown>,
  uploads?: Record<string, unknown>,
): string {
  const lines: string[] = [
    `Brand brief:\n${prompt}`,
    '',
    `Site plan (compose pages that honor this plan):\n${describeSitePlan(plan)}`,
  ]
  if (preferences && Object.keys(preferences).length > 0) {
    lines.push('', `Preferences:\n${JSON.stringify(preferences)}`)
  }
  if (uploads && Object.keys(uploads).length > 0) {
    lines.push('', `Uploads: ${Object.keys(uploads).join(', ')}`)
  }
  return lines.join('\n')
}
