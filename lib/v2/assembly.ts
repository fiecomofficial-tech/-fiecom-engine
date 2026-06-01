/**
 * Stage 6 — Assemble a renderable V2Config.
 *
 * For each matched section, generate:
 *   • content (defaults + brief-driven phrasing where applicable)
 *   • imageQueries (from design system image vocabulary + role)
 *
 * Internal pages reuse the existing internal-page conventions
 * (BaselinePageHeader opener for non-canonical slugs; self-headered
 * About / Contact slugs use their canonical body component).
 *
 * Chrome (BaselineNavbar + BaselineFooter) is added by this stage, NOT
 * by composition-guard. The whole composition-guard shape pipeline is
 * bypassed when V2 produces the config.
 */

import type {
  Brief,
  DesignSystem,
  PageBlueprint,
  ComponentMatchPlan,
  V2Config,
  V2Page,
  V2Section,
  MatchedSection,
} from './types'
import type { ComponentId } from '../registry'
import { SECTION_META } from '../registry'

interface Ctx {
  brief: Brief
  ds: DesignSystem
  blueprint: PageBlueprint
  email: string
}

// ── Public entry ───────────────────────────────────────────────────

export function assembleSite(
  brief: Brief,
  ds: DesignSystem,
  blueprint: PageBlueprint,
  match: ComponentMatchPlan,
): V2Config {
  const email = contactEmail(brief.brand)
  const ctx: Ctx = { brief, ds, blueprint, email }

  // Build home page from match plan + chrome.
  const homeBody: V2Section[] = match.sections.map((m) => buildSection(m, ctx, 'home'))

  // Ensure closing CTA exists.
  if (!homeBody.some((s) => s.id === 'BaselineCTA')) {
    homeBody.push(buildSection({ role: 'closing', componentId: 'BaselineCTA', intent: '', mediaWanted: false }, ctx, 'home'))
  }

  const navOrder = blueprint.pages.map((p) => p.title)
  const home: V2Page = {
    slug: 'home',
    title: 'Home',
    sections: [
      buildNavbar(ctx, navOrder, blueprint),
      ...homeBody,
      buildFooter(ctx, navOrder, blueprint),
    ],
  }

  const internalPages: V2Page[] = blueprint.pages
    .filter((p) => p.slug !== 'home')
    .map((p) => buildInternalPage(p, ctx, navOrder, blueprint))

  // Theme tokens carried as preset metadata so the renderer can pick
  // them up. The full ColorSystem also gets attached as `theme.*`
  // properties so resolveTheme() picks up the custom palette.
  const themePreset = inferPresetKey(ds)
  const theme: Record<string, string> = {
    preset: themePreset,
    bg: ds.colors.bg,
    ink: ds.colors.ink,
    ink2: ds.colors.ink2,
    accent: ds.colors.accent,
    onAccent: ds.colors.onAccent,
    bgAccent: ds.colors.bgAccent,
    bgDeep: ds.colors.bgDeep,
    surface: ds.colors.surface,
    surfaceEdge: ds.colors.surfaceEdge,
    mute: ds.colors.mute,
    fontDisplay: ds.typography.display.family,
    fontBody: ds.typography.body.family,
  }

  return {
    theme,
    pages: [home, ...internalPages],
    designSystem: ds,
    brief,
    blueprint,
  }
}

/** Map design-system mode + dominant colors to one of the existing
 *  theme preset keys. The renderer's `resolveTheme` uses theme.* values
 *  for the actual palette; the preset is just a label / fallback. */
function inferPresetKey(ds: DesignSystem): string {
  if (ds.colors.mode === 'dark') {
    if (/^#0c0f1d|midnight/i.test(ds.colors.bg)) return 'midnight-luxury'
    if (/^#161312|1c1b18/i.test(ds.colors.bg)) return 'editorial-noir'
    if (/^#0d0c0b/i.test(ds.colors.bg)) return 'editorial-noir'
    return 'editorial-noir'
  }
  if (/^#fafaf7|f7f7fa|fafaf|f7f3/i.test(ds.colors.bg)) return 'fintech-minimal'
  if (/^#e7e9ec/i.test(ds.colors.bg)) return 'metallic-mono'
  if (/^#e9dcc7|efe7d9/i.test(ds.colors.bg)) return 'warm-sand'
  if (/^#f4ede0/i.test(ds.colors.bg)) return 'editorial-cream'
  return 'fintech-minimal'
}

// ── Chrome ──────────────────────────────────────────────────────────

function buildNavbar(ctx: Ctx, navOrder: string[], blueprint: PageBlueprint): V2Section {
  const links = navOrder.map((title) => {
    const slug = title.toLowerCase() === 'home' ? '' : blueprint.pages.find((p) => p.title === title)?.slug
    return { label: title, href: slug ? `/${slug}` : '/' }
  })
  return {
    id: 'BaselineNavbar',
    content: {
      brand: ctx.brief.brand,
      links: links.slice(0, 6),
      cta: { label: ctaLabel(ctx), href: safeCtaHref(ctx, blueprint) },
    },
  }
}

function buildFooter(ctx: Ctx, navOrder: string[], blueprint: PageBlueprint): V2Section {
  const realLinks = navOrder.map((title) => {
    const slug = title.toLowerCase() === 'home' ? '' : blueprint.pages.find((p) => p.title === title)?.slug
    return { label: title, href: slug ? `/${slug}` : '/' }
  })
  const half = Math.max(2, Math.ceil(realLinks.length / 2))
  const primary = realLinks.slice(0, half)
  const secondary = realLinks.slice(half)
  const columns: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [{ title: 'Site', links: primary }]
  if (secondary.length) columns.push({ title: 'More', links: secondary })
  columns.push({
    title: 'Contact',
    links: [
      { label: 'Email', href: `mailto:${ctx.email}` },
      { label: ctaLabel(ctx), href: safeCtaHref(ctx, blueprint) },
    ],
  })
  return {
    id: 'BaselineFooter',
    content: {
      brand: ctx.brief.brand,
      tagline: `${ctx.brief.brand} · ${ctx.brief.tone}.`,
      columns,
      cta: { label: 'Contact', href: safeCtaHref(ctx, blueprint) },
      legal: `© ${new Date().getFullYear()} ${ctx.brief.brand}. All rights reserved.`,
      meta: [{ label: 'Privacy', href: '/' }, { label: 'Terms', href: '/' }],
    },
  }
}

function ctaLabel(ctx: Ctx): string {
  switch (ctx.brief.conversionGoal) {
    case 'signup':       return 'Get started'
    case 'subscription': return 'Subscribe'
    case 'booking':      return 'Book a stay'
    case 'reservation':  return 'Reserve a table'
    case 'inquiry':      return 'Start a project'
    case 'browse':       return 'Explore'
    default:             return 'Get in touch'
  }
}

function safeCtaHref(ctx: Ctx, blueprint: PageBlueprint): string {
  const slugs = new Set(blueprint.pages.map((p) => p.slug))
  if (slugs.has('contact')) return '/contact'
  if (slugs.has('reservations')) return '/reservations'
  return `mailto:${ctx.email}`
}

function contactEmail(brand: string): string {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `hello@${slug || 'studio'}.co`
}

// ── Internal pages ─────────────────────────────────────────────────

function buildInternalPage(
  page: { slug: string; title: string; sectionCount: number },
  ctx: Ctx,
  navOrder: string[],
  blueprint: PageBlueprint,
): V2Page {
  const body: V2Section[] = []
  const selfHeadered = page.slug === 'about' || page.slug === 'studio' || page.slug === 'contact'

  if (page.slug === 'about' || page.slug === 'studio') {
    body.push(buildSection({ role: 'product-story', componentId: 'BaselineAboutNarrative', intent: '', mediaWanted: true }, ctx, page.slug))
  } else if (page.slug === 'contact') {
    body.push(buildSection({ role: 'closing', componentId: 'BaselineContact', intent: '', mediaWanted: false }, ctx, page.slug))
  } else if (page.slug === 'pricing' || page.slug === 'plans') {
    body.push(buildSection({ role: 'hero', componentId: 'BaselinePageHeader', intent: '', mediaWanted: false }, ctx, page.slug))
    body.push(buildSection({ role: 'pricing-conversion', componentId: 'PricingTiers', intent: '', mediaWanted: false }, ctx, page.slug))
    body.push(buildSection({ role: 'faq-objection', componentId: 'FAQAccordion', intent: '', mediaWanted: false }, ctx, page.slug))
  } else if (page.slug === 'reservations') {
    body.push(buildSection({ role: 'hero', componentId: 'BaselinePageHeader', intent: '', mediaWanted: false }, ctx, page.slug))
    body.push(buildSection({ role: 'closing', componentId: 'ContactForm', intent: '', mediaWanted: false }, ctx, page.slug))
  } else {
    body.push(buildSection({ role: 'hero', componentId: 'BaselinePageHeader', intent: '', mediaWanted: false }, ctx, page.slug))
    body.push(buildSection({ role: 'feature-detail', componentId: 'FeatureList', intent: '', mediaWanted: false }, ctx, page.slug))
    body.push(buildSection({ role: 'faq-objection', componentId: 'FAQAccordion', intent: '', mediaWanted: false }, ctx, page.slug))
  }

  void selfHeadered
  return {
    slug: page.slug,
    title: page.title,
    sections: [
      buildNavbar(ctx, navOrder, blueprint),
      ...body,
      buildFooter(ctx, navOrder, blueprint),
    ],
  }
}

// ── Sections (content + image queries) ─────────────────────────────

function buildSection(m: MatchedSection, ctx: Ctx, slug: string): V2Section {
  const id = m.componentId
  const content = defaultContent(id, m, ctx, slug)
  const imageQueries = buildImageQueries(id, m, ctx)
  return { id, content, imageQueries }
}

function buildImageQueries(
  id: ComponentId,
  m: MatchedSection,
  ctx: Ctx,
): V2Section['imageQueries'] | undefined {
  if (!m.mediaWanted) return undefined
  const meta = SECTION_META[id]
  if (!meta) return undefined
  const vocab = ctx.ds.image.vocabulary
  const q: NonNullable<V2Section['imageQueries']> = {}
  if (meta.primary) q.primary = `${vocab} hero`
  if (meta.secondary) q.secondary = `${vocab} detail`
  if (meta.gallery) {
    const kws = ['detail', 'interior', 'texture', 'material', 'workspace', 'craft', 'product', 'place', 'people']
    q.gallery = Array.from({ length: meta.gallery }, (_, i) => `${vocab} ${kws[i % kws.length]}`)
  }
  return Object.keys(q).length ? q : undefined
}

function defaultContent(id: ComponentId, m: MatchedSection, ctx: Ctx, slug: string): Record<string, unknown> {
  const { brand, offer, targetCustomer, businessType, tone } = ctx.brief
  switch (id) {
    case 'BaselineHero': return {
      eyebrow: titleEyebrow(ctx),
      headline: headlineFor(ctx),
      accent: accentFor(ctx),
      body: heroBody(ctx),
      cta: { label: primaryCta(ctx), href: safeCtaHref(ctx, ctx.blueprint) },
      secondaryCta: { label: 'Learn more', href: '/about' },
    }
    case 'HeroEditorial': return {
      eyebrow: titleEyebrow(ctx),
      headline: editorialHeadline(ctx),
      body: `${offer}\n${tone}.`,
    }
    case 'HeroCinematic': return {
      eyebrow: businessType,
      headline: cinematicHeadline(ctx),
      subhead: cinematicSubhead(ctx),
      body: `${offer}`,
      cta: { label: primaryCta(ctx), href: safeCtaHref(ctx, ctx.blueprint) },
    }
    case 'BaselineFeatures': return {
      eyebrow: 'Capabilities',
      headline: 'What we do, in three moves.',
      features: featureTriple(ctx),
    }
    case 'FeatureList': return {
      eyebrow: 'Details',
      headline: 'Everything that comes with the offer.',
      features: featurePentagon(ctx),
    }
    case 'BaselineTestimonials': return {
      eyebrow: 'Voices',
      headline: `Teams choose ${brand} when clarity matters.`,
      testimonials: testimonials(ctx),
    }
    case 'BaselineLogoBar': return { eyebrow: 'Trusted by teams worldwide', clients: [] }
    case 'BaselineCTA': return {
      eyebrow: 'Next step',
      headline: ctaHeadline(ctx),
      accent: ctaAccent(ctx),
      body: ctaBody(ctx),
      cta: { label: primaryCta(ctx), href: safeCtaHref(ctx, ctx.blueprint) },
      secondaryCta: { label: 'Talk to us', href: `mailto:${ctx.email}` },
    }
    case 'BaselinePageHeader': return {
      eyebrow: slug,
      headline: `${capitalize(slug)} — ${brand}.`,
      body: `Everything you need to understand ${slug.toLowerCase()} and take the next step.`,
    }
    case 'BaselineAboutNarrative': return {
      eyebrow: `About ${brand}`,
      headline: `Built around ${targetCustomer}.`,
      body: `${brand} is a ${businessType}. ${offer} The work is shaped by ${tone}, and built for ${targetCustomer}.`,
      pillarEyebrow: 'Core pillars',
      pillarHeadline: 'The principles we work by.',
      pillars: [
        { title: 'Clarity over cleverness', body: 'Every choice serves the customer first.' },
        { title: 'Craft as discipline', body: 'We sweat the details that compound.' },
        { title: 'Respect for attention', body: 'Speed and focus, not noise.' },
      ],
    }
    case 'BaselineContact': return {
      eyebrow: 'Contact',
      headline: `Let's start a conversation.`,
      formTitle: 'Get in touch',
      formBody: 'Send a note and we will get back within one business day.',
      recipientEmail: ctx.email,
      details: [{ label: 'Email', value: ctx.email, href: `mailto:${ctx.email}` }],
    }
    case 'PricingTiers': return {
      eyebrow: 'Plans',
      headline: 'Pick the right starting point.',
      tiers: pricingTiers(ctx),
    }
    case 'FAQAccordion': return {
      eyebrow: 'FAQ',
      headline: 'Questions before you start',
      faqs: faqs(ctx),
    }
    case 'MetricRow': return {
      eyebrow: 'Signals',
      headline: 'Where the work shows up.',
      metrics: metrics(ctx),
    }
    case 'TwoColumnText': return {
      eyebrow: 'Context',
      headline: `Why ${brand}.`,
      paragraphs: [
        { heading: 'Position', body: offer },
        { heading: 'Voice', body: `${tone} — applied to every touchpoint.` },
        { heading: 'Outcome', body: `${targetCustomer} get a clear next step every time.` },
      ],
    }
    case 'EditorialQuote': return {
      eyebrow: 'In their words',
      quote: editorialQuoteText(ctx),
      attribution: 'Long-time client',
      attributionRole: 'Founder',
    }
    case 'MessageReveal': return {
      firstLine: messageRevealFirst(ctx),
      accent: messageRevealAccent(ctx),
      secondLine: messageRevealSecond(ctx),
      body: tone,
    }
    case 'ImageGallery': return {
      eyebrow: 'Gallery',
      headline: 'Seen up close.',
      body: `A visual layer that makes the work tangible.`,
      captions: Array.from({ length: 9 }, (_, i) => ({ title: galleryCaption(ctx, i), year: i % 3 === 0 ? '2026' : '2025' })),
    }
    case 'HorizontalShowcase': return {
      eyebrow: 'Selected work',
      headline: showcaseHeadline(ctx),
      body: `A horizontal cross-section of what ${brand} has made recently.`,
      cards: Array.from({ length: 6 }, (_, i) => ({ title: showcaseCardTitle(ctx, i) })),
    }
    case 'AsymmetricGrid': return {
      eyebrow: 'A closer look',
      headline: 'Four frames.',
      body: `The textures and gestures that define ${brand}.`,
      tiles: [
        { title: 'Field' },
        { title: 'Set' },
        { title: 'Method', caption: `Every project starts the same way: a long conversation, then a tight brief.` },
        { title: 'Detail' },
      ],
    }
    case 'StickyNarrative': return {
      eyebrow: 'Chapters',
      headline: `How ${brand} works.`,
      chapters: [
        { meta: 'Chapter 01', title: 'Begin with the room.', body: 'We listen first, longer than feels efficient. The brief takes shape from there.' },
        { meta: 'Chapter 02', title: 'Translate, then refine.', body: 'A small number of moves, each one earning its place by removing two others.' },
      ],
    }
    case 'LogoCloud':       return { eyebrow: 'Featured in', clients: [] }
    case 'ContactForm':     return {
      eyebrow: 'Start',
      headline: 'Tell us what you need',
      body: 'The form opens your mail client with the right context.',
      recipientEmail: ctx.email,
    }
    default: return { headline: brand }
  }
}

// ── Copy helpers (brief-driven, no AI) ─────────────────────────────

function titleEyebrow(ctx: Ctx): string {
  switch (ctx.brief.archetype) {
    case 'saas':
    case 'ai-startup':
    case 'product-launch': return 'New — Launching now'
    case 'fintech': return 'Built for the next decade'
    case 'hospitality': return ctx.brief.businessType
    case 'restaurant': return 'Now serving'
    case 'fashion': return 'New — Fall 2026'
    case 'creative-studio': return 'Studio at work'
    case 'architecture': return 'Selected projects'
    case 'ecommerce': return 'New release'
    case 'portfolio': return 'Selected work'
    case 'wellness':
    case 'health': return 'A calmer way'
    case 'education': return 'Now enrolling'
    case 'event': return 'Now booking'
    default: return ctx.brief.businessType
  }
}

function headlineFor(ctx: Ctx): string {
  const { brand, offer, targetCustomer } = ctx.brief
  switch (ctx.brief.archetype) {
    case 'saas':
    case 'ai-startup': return `${brand} ships work that compounds.`
    case 'product-launch': return `${brand} — built for clarity.`
    case 'fintech': return `${brand} is the calm way to manage money.`
    case 'hospitality': return `A quiet place worth coming back to.`
    case 'restaurant': return `Honest food.`
    case 'fashion': return `Considered, lasting.`
    case 'creative-studio': return `Selected work, made with care.`
    case 'architecture': return `Spaces that hold up.`
    case 'ecommerce': return `Made to keep.`
    case 'portfolio': return `Work, in process.`
    case 'wellness': return `A calmer way to be.`
    case 'health': return `Care that listens.`
    case 'education': return `${brand} prepares you for what's next.`
    case 'event': return `${brand} brings the field together.`
    default: return `${brand} delivers focused work.`
  }
}

function accentFor(ctx: Ctx): string {
  switch (ctx.brief.archetype) {
    case 'saas':
    case 'ai-startup': return 'in days, not quarters'
    case 'fintech': return 'precisely'
    case 'fashion': return 'every season'
    case 'creative-studio': return 'with intent'
    case 'restaurant': return 'every day'
    case 'hospitality': return 'arriving home'
    case 'ecommerce': return 'in the everyday'
    case 'architecture': return 'over time'
    default: return ''
  }
}

function heroBody(ctx: Ctx): string {
  return `${ctx.brief.offer} Made for ${ctx.brief.targetCustomer}.`
}

function primaryCta(ctx: Ctx): string {
  switch (ctx.brief.conversionGoal) {
    case 'signup':       return 'Get started'
    case 'subscription': return 'Subscribe'
    case 'booking':      return 'Book a stay'
    case 'reservation':  return 'Reserve'
    case 'inquiry':      return 'Start a project'
    case 'browse':       return 'Explore the collection'
    default:             return 'Get in touch'
  }
}

function ctaHeadline(ctx: Ctx): string {
  switch (ctx.brief.archetype) {
    case 'hospitality': return 'Plan your stay'
    case 'restaurant': return 'Book your table'
    case 'fashion': return 'Explore the collection'
    case 'creative-studio':
    case 'architecture':
    case 'portfolio': return 'Start a project together'
    case 'fintech':
    case 'saas':
    case 'ai-startup':
    case 'product-launch': return 'Get started today'
    case 'ecommerce': return 'Shop the latest'
    case 'wellness':
    case 'health': return 'Reach out when ready'
    case 'education': return 'Apply for the next cohort'
    case 'event': return 'Reserve your seat'
    default: return 'Get in touch'
  }
}
function ctaAccent(ctx: Ctx): string { return ctx.brief.tone.split(' ')[0] }
function ctaBody(ctx: Ctx): string {
  return `One short conversation. We will get back within one business day.`
}

function editorialHeadline(ctx: Ctx): string {
  const words = ctx.brief.offer.split(/\s+/).slice(0, 3).join(' ').toUpperCase()
  return words || ctx.brief.brand.toUpperCase()
}

function cinematicHeadline(ctx: Ctx): string {
  switch (ctx.brief.archetype) {
    case 'hospitality': return 'Slow Mornings'
    case 'fashion': return 'Quiet Power'
    case 'restaurant': return 'Honest Plates'
    case 'creative-studio': return 'Studio Hours'
    default: return ctx.brief.brand.split(/\s+/)[0]
  }
}
function cinematicSubhead(ctx: Ctx): string { return 'Built to move' }

function featureTriple(ctx: Ctx): Array<Record<string, unknown>> {
  const { brand, businessType } = ctx.brief
  return [
    { eyebrow: '01 — Approach',  title: 'A clear way in',     body: `${brand} starts with a focused conversation, never a pitch deck.` },
    { eyebrow: '02 — Craft',     title: 'Decisions you can feel', body: `${businessType} is a category that rewards real care. We work accordingly.` },
    { eyebrow: '03 — Outcome',   title: 'Built to keep',      body: `What you take away is meant to last. We measure by what holds up.` },
  ]
}

function featurePentagon(ctx: Ctx): Array<Record<string, unknown>> {
  const { brand } = ctx.brief
  return [
    { title: 'Core offer',  body: `Everything you need from ${brand} day one.` },
    { title: 'Delivery',    body: `Hand-off is clear, scoped, and on time.` },
    { title: 'Support',     body: `One human contact for every question.` },
    { title: 'Measurement', body: `We track the outcome, not the activity.` },
    { title: 'Next step',   body: `A clean handoff into long-term work.` },
  ]
}

function testimonials(ctx: Ctx): Array<Record<string, unknown>> {
  const { brand } = ctx.brief
  return [
    { quote: `${brand} replaced four tools for us. Cycles are now 40% shorter.`, author: 'Elena Vasquez', role: 'Head of Product' },
    { quote: `It feels like a service designed by people who actually do the work.`, author: 'Marcus Chen', role: 'Engineering Lead' },
    { quote: `The clarity is the killer feature. Our team finally trusts the roadmap.`, author: 'Priya Anand', role: 'COO' },
  ]
}

function pricingTiers(ctx: Ctx): Array<Record<string, unknown>> {
  const { brand } = ctx.brief
  return [
    { name: 'Starter', price: 'Starter', description: `A starting point with ${brand}.`, features: ['Core offer', 'Onboarding', 'Standard support'], cta: { label: 'Start', href: '/contact' } },
    { name: 'Studio', price: 'Studio', description: `The most popular engagement.`, features: ['Everything in Starter', 'Priority delivery', 'Dedicated contact', 'Quarterly review'], featured: true, cta: { label: 'Choose plan', href: '/contact' } },
    { name: 'Custom', price: 'Custom', description: `A tailored engagement.`, features: ['Custom scope', 'Custom support', 'Custom SLA'], cta: { label: 'Talk to us', href: '/contact' } },
  ]
}

function faqs(ctx: Ctx): Array<{ q: string; a: string }> {
  return [
    { q: 'How quickly can we get started?', a: 'Within one business week for most engagements.' },
    { q: 'What do you need from us?', a: 'A clear picture of the outcome you want. The brief takes shape from there.' },
    { q: 'How does support work?', a: 'One direct contact, one shared channel, response within one business day.' },
    { q: 'Can we scale this up later?', a: 'Yes. The engagement is structured so the first phase grounds the next.' },
  ]
}

function metrics(ctx: Ctx): Array<Record<string, unknown>> {
  return [
    { value: '40%', label: 'shorter cycles', delta: '+12% YoY', trend: 'up' },
    { value: '1d',  label: 'avg response',   delta: '−0.5d',     trend: 'down' },
    { value: '24',  label: 'engagements',    delta: '+9 this year', trend: 'up' },
  ]
}

function editorialQuoteText(ctx: Ctx): string {
  return `${ctx.brief.brand} felt like sketching with someone who already knew the answer.`
}

function messageRevealFirst(ctx: Ctx): string { return `${ctx.brief.brand} is not another template` }
function messageRevealAccent(ctx: Ctx): string { return 'different' }
function messageRevealSecond(ctx: Ctx): string { return `It is a structured product story` }

function galleryCaption(ctx: Ctx, i: number): string {
  const pool = ['Signal', 'Space', 'Detail', 'Flow', 'Texture', 'Proof', 'People', 'System', 'Outcome']
  return pool[i % pool.length]
}
function showcaseHeadline(ctx: Ctx): string { return 'A studio in motion' }
function showcaseCardTitle(ctx: Ctx, i: number): string {
  const pool = ['Recent', 'Current', 'Concept', 'Process', 'Detail', 'Field']
  return pool[i % pool.length]
}

function capitalize(s: string): string {
  return s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}
