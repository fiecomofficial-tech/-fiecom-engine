/**
 * Build TemplateData from Brief + DesignSystem + Blueprint.
 *
 * Templates render the entire homepage so this builder must produce
 * EVERY field a template might want. Missing fields render conditionally
 * inside the template — keep this builder generous, not stingy.
 */

import type { Brief, DesignSystem, PageBlueprint } from './types'
import type {
  TemplateData,
  FeatureItem,
  PricingTier,
  Testimonial,
  FAQ,
  NavLink,
  FooterColumn,
} from '@/components/templates/types'
import type { SectionImage } from '@/components/sections/types'
import type { TemplateId } from './templates'

export function buildTemplateData(
  brief: Brief,
  ds: DesignSystem,
  blueprint: PageBlueprint,
  templateId: TemplateId,
): TemplateData {
  const email = contactEmail(brief.brand)
  const navLinks: NavLink[] = blueprint.pages.map((p) => ({
    label: p.title,
    href: p.slug === 'home' ? '/' : `/${p.slug}`,
  }))
  const ctaTarget = pickCtaHref(blueprint)

  return {
    brand: brief.brand,
    tagline: `${brief.brand} · ${brief.tone}.`,
    navLinks,
    navCta: { label: primaryCtaLabel(brief), href: ctaTarget },
    hero: buildHero(brief, templateId, ctaTarget),
    logos: buildLogos(brief, templateId),
    marquee: buildMarquee(brief, templateId),
    features: buildFeatures(brief, templateId),
    metrics: buildMetrics(brief, templateId),
    testimonials: buildTestimonials(brief),
    pricing: buildPricing(brief, templateId),
    faq: buildFaq(brief, templateId),
    gallery: buildGallery(templateId),
    editorialQuote: buildEditorialQuote(brief, templateId),
    story: buildStory(brief, templateId),
    closing: buildClosing(brief, templateId, ctaTarget, email),
    footer: buildFooter(brief, navLinks, email),
    tokens: {
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
      mode: ds.colors.mode,
    },
  }
}

// ── Hero ────────────────────────────────────────────────────────────

function buildHero(brief: Brief, tid: TemplateId, ctaHref: string): TemplateData['hero'] {
  const { brand, businessType, offer, targetCustomer } = brief
  // SaaS-style framed-product hero
  if (tid === 'SaasBuilderTemplate') {
    return {
      eyebrow: 'New — Launching now',
      headline: saasHeadline(brief),
      body: `${offer} Made for ${targetCustomer}.`,
      cta: { label: primaryCtaLabel(brief), href: ctaHref },
      secondaryCta: { label: 'See how it works', href: '/product' },
    }
  }
  // Fashion-style oversized serif overlay
  if (tid === 'FashionEditorialTemplate') {
    return {
      eyebrow: businessType,
      headline: fashionHeadline(brief),
      body: `${offer}`,
      cta: { label: 'Shop the collection', href: ctaHref },
      secondaryCta: { label: 'About the atelier', href: '/about' },
    }
  }
  // Restaurant — split warm serif hero
  if (tid === 'RestaurantWarmTemplate') {
    return {
      eyebrow: 'Now serving',
      headline: restaurantHeadline(brief),
      subhead: restaurantSubhead(brief),
      body: `${offer} A short menu, written by the season.`,
      cta: { label: 'Reserve a table', href: ctaHref },
      secondaryCta: { label: 'Read the menu', href: '/menu' },
    }
  }
  // Creative Studio — oversized type, featured project tile
  if (tid === 'CreativeStudioTemplate') {
    return {
      eyebrow: 'Studio at work',
      headline: studioHeadline(brief),
      body: `${offer} Made with ${targetCustomer} in mind, shaped over weeks not days.`,
      cta: { label: 'Start a project', href: ctaHref },
      secondaryCta: { label: 'See the work', href: '/work' },
    }
  }
  // Hospitality cinematic (default for hospitality/wellness)
  return {
    eyebrow: businessType,
    headline: hospHeadline(brief),
    subhead: hospSubhead(brief),
    body: offer,
    cta: { label: primaryCtaLabel(brief), href: ctaHref },
    secondaryCta: { label: 'Explore the property', href: '/rooms' },
  }
}

function saasHeadline(brief: Brief): string {
  const { brand, archetype } = brief
  if (archetype === 'ai-startup') return `${brand} builds the things you ship.`
  if (archetype === 'fintech') return `${brand} — the calm way to manage money.`
  if (archetype === 'product-launch') return `${brand}. Built for clarity.`
  return `${brand} ships work that compounds.`
}

function fashionHeadline(brief: Brief): string {
  switch (brief.archetype) {
    case 'fashion': return 'Quiet, lasting pieces.'
    case 'architecture': return 'Spaces that hold up.'
    case 'creative-studio': return 'Work made with care.'
    case 'portfolio': return 'Selected work.'
    case 'ecommerce': return 'Made to keep.'
    default: return brief.brand.toUpperCase()
  }
}

function hospHeadline(brief: Brief): string {
  switch (brief.archetype) {
    case 'hospitality': return 'A quieter way to arrive.'
    case 'restaurant': return 'Honest food, daily.'
    case 'wellness': return 'A calmer way to be.'
    default: return brief.brand
  }
}

function hospSubhead(brief: Brief): string | undefined {
  if (brief.archetype === 'hospitality') return 'Built to rest, made to move.'
  if (brief.archetype === 'restaurant') return 'Seasonal, wood-fired, neighborhood.'
  return undefined
}

function restaurantHeadline(brief: Brief): string {
  // Short, warm, slightly poetic — restaurant heros work as a serif statement.
  const map: Record<string, string> = {
    restaurant: 'Honest food. Slow rooms.',
  }
  return map[brief.archetype] ?? `${brief.brand}. Honest food.`
}

function restaurantSubhead(brief: Brief): string {
  return 'A short menu, written by the season.'
}

function studioHeadline(brief: Brief): string {
  switch (brief.archetype) {
    case 'creative-studio': return 'Work made with care.'
    case 'portfolio':       return 'Selected work.'
    case 'architecture':    return 'Spaces that hold up.'
    default:                return `${brief.brand}. Considered work.`
  }
}

// ── Logos ───────────────────────────────────────────────────────────

function buildLogos(brief: Brief, tid: TemplateId): TemplateData['logos'] {
  // Only SaaS uses the logo strip prominently. Skip on others.
  if (tid !== 'SaasBuilderTemplate') return undefined
  // Generic-sounding wordmarks — better than fake recognizable client names.
  return [{ name: 'Northline' }, { name: 'Atlas' }, { name: 'Field Unit' }, { name: 'Kindred' }, { name: 'Signal' }, { name: 'Forma' }]
}

// ── Marquee ─────────────────────────────────────────────────────────

function buildMarquee(brief: Brief, tid: TemplateId): TemplateData['marquee'] {
  if (tid === 'FashionEditorialTemplate') {
    return ['Slow goods', 'Made to keep', 'Considered cuts', 'Field-tested', brief.brand]
  }
  if (tid === 'RestaurantWarmTemplate') {
    return ['Seasonal', 'Wood-fired', 'House sourdough', 'Natural wine', 'Daily market', 'Open kitchen']
  }
  if (tid === 'CreativeStudioTemplate') {
    return ['Brand', 'Editorial', 'Motion', 'Print', 'Identity', 'Direction', 'Type']
  }
  return undefined
}

// ── Features ────────────────────────────────────────────────────────

function buildFeatures(brief: Brief, tid: TemplateId): FeatureItem[] {
  const { brand, businessType, archetype } = brief

  if (tid === 'SaasBuilderTemplate') {
    if (archetype === 'ai-startup') {
      return [
        { eyebrow: 'CORE', title: 'From prompt to ship', body: `${brand} turns intent into production-ready output without the usual rewrites.` },
        { eyebrow: 'CONTROL', title: 'Stays inside your stack', body: 'Drop into existing infra, model providers, and access controls.' },
        { eyebrow: 'TRUST', title: 'Observable by default', body: 'Every run is logged with cost, latency, and what changed.' },
        { eyebrow: 'TEAM', title: 'Built for collaboration', body: 'Comments, reviews, and audit trails — not just an inbox of chats.' },
      ]
    }
    return [
      { eyebrow: 'COLLAB', title: 'A workspace for the work', body: `${brand} lives where your team already does — async-first, comment-led.` },
      { eyebrow: 'CLARITY', title: 'Decisions, not threads', body: 'Outcomes show up in one place. Roadmap stays trustworthy.' },
      { eyebrow: 'SPEED',   title: 'Built keyboard-first', body: 'Fewer modals, fewer menus, more direct paths to action.' },
      { eyebrow: 'TRUST',   title: 'Owned by you', body: 'Your data, your audit log. Export everything any time.' },
    ]
  }

  if (tid === 'FashionEditorialTemplate') {
    return [
      { eyebrow: 'A / W 26', title: 'The first edition', body: 'A short, considered drop made in limited quantities.' },
      { eyebrow: 'CRAFT',   title: 'Hand-finished',     body: 'Each piece is finished by hand at a small workshop in town.' },
      { eyebrow: 'MATERIAL', title: 'Honest fabrics',   body: 'Natural fibers, traceable mills, no synthetic blends.' },
      { eyebrow: 'INTENT',  title: 'Made to repair',    body: 'Designed for a long life — and a free repair, when needed.' },
    ]
  }

  if (tid === 'RestaurantWarmTemplate') {
    // Dishes — short serif names, sensory descriptions.
    return [
      { eyebrow: 'STARTER',  title: 'Charred leek, smoked cream', body: 'Slow-charred over the grill, finished with smoked cream, capers, and a thin slice of preserved lemon.' },
      { eyebrow: 'PASTA',    title: 'Cavatelli, spring greens',   body: 'Hand-rolled cavatelli with the morning\'s greens, brown butter, and aged pecorino.' },
      { eyebrow: 'MAIN',     title: 'Wood-fired plaice',          body: 'Whole plaice, salt-cured for an hour, finished over white oak with brown butter and capers.' },
      { eyebrow: 'DESSERT',  title: 'Roasted plums, sheep\'s milk', body: 'Late-summer plums roasted in red wine, served warm with cold sheep\'s milk gelato.' },
    ]
  }

  if (tid === 'CreativeStudioTemplate') {
    // Projects — large, named, with a discipline label.
    return [
      { eyebrow: 'BRAND',     title: 'A new mark for Northline', body: 'A full identity rebuild for a logistics company moving from B2B operations into consumer-facing service.' },
      { eyebrow: 'EDITORIAL', title: 'Field Notes, Volume Three', body: 'Six-month editorial direction across a print quarterly, website, and supporting campaign.' },
      { eyebrow: 'TYPE',      title: 'A serif for Atlas',         body: 'A bespoke display serif drawn for an architecture practice. Two weights, full Latin coverage, ten ligatures.' },
      { eyebrow: 'MOTION',    title: 'Signal — a film system',    body: 'A small film series and motion language for an AI tooling company entering the mainstream.' },
    ]
  }

  // Hospitality
  return [
    { eyebrow: 'THE PLACE', title: 'A quiet corner of the world', body: `${brand} is a small ${businessType}, shaped by the light, the language, and the people who already live here.` },
    { eyebrow: 'THE STAY',  title: 'Built to rest',                body: 'Long mornings, short menus, slow nights — the kind of pace you can actually keep.' },
    { eyebrow: 'GARDEN SUITE', title: 'Garden Suite', body: 'A ground-floor suite opening onto a private courtyard with morning sun.', },
    { eyebrow: 'OCEAN SUITE',  title: 'Ocean Suite',  body: 'A double-aspect room with an ocean view and a soaking tub by the window.' },
    { eyebrow: 'STUDIO',       title: 'Studio',       body: 'A quiet room with a desk, daylight, and a kitchenette for slower stays.' },
  ]
}

// ── Metrics ─────────────────────────────────────────────────────────

function buildMetrics(brief: Brief, tid: TemplateId): TemplateData['metrics'] {
  if (tid !== 'SaasBuilderTemplate') return undefined
  return [
    { value: '40%', label: 'shorter cycles', delta: '+12% YoY' },
    { value: '1d',  label: 'avg response',   delta: '−0.5d' },
    { value: '12k', label: 'active users',   delta: '+3.4k QoQ' },
    { value: '99.99%', label: 'uptime',      delta: '90-day' },
  ]
}

// ── Testimonials ────────────────────────────────────────────────────

function buildTestimonials(brief: Brief): Testimonial[] {
  const { brand, archetype } = brief
  if (archetype === 'hospitality' || archetype === 'restaurant' || archetype === 'wellness') {
    return [
      { quote: `Quiet, considered, and the staff remembered our names by the second morning. We've already booked a second stay.`, author: 'Hana & Theo', role: 'Returning guests' },
    ]
  }
  if (archetype === 'fashion' || archetype === 'creative-studio' || archetype === 'portfolio' || archetype === 'architecture' || archetype === 'ecommerce') {
    return [
      { quote: `Working with ${brand} felt like sketching with someone who already knew the answer.`, author: 'Elena Vasquez', role: 'Founder, Studio Verre' },
    ]
  }
  return [
    { quote: `${brand} replaced four tools for us. Cycles are now 40% shorter and the roadmap is finally trusted.`, author: 'Elena Vasquez', role: 'Head of Product', org: 'Northwind Atlas' },
  ]
}

// ── Pricing ─────────────────────────────────────────────────────────

function buildPricing(brief: Brief, tid: TemplateId): TemplateData['pricing'] {
  // Only the SaaS template uses a tier grid.
  if (tid !== 'SaasBuilderTemplate') return undefined
  const { brand, archetype } = brief
  const tiers: PricingTier[] = archetype === 'ai-startup' ? [
    { name: 'Starter',  price: '$0',  description: `Trial ${brand} on a small project.`, features: ['Up to 1,000 runs / mo', 'Standard models', 'Community support'], cta: { label: 'Start free', href: '/pricing' } },
    { name: 'Team',     price: '$49', period: 'per seat / month', description: `Day-to-day work with ${brand}.`, features: ['Unlimited runs', 'All models', 'Audit log', 'Email support'], featured: true, cta: { label: 'Start team trial', href: '/pricing' } },
    { name: 'Scale',    price: 'Custom', description: 'For larger orgs with their own infra.', features: ['SSO', 'BYO cloud', 'Custom SLA', 'Dedicated contact'], cta: { label: 'Talk to us', href: '/contact' } },
  ] : [
    { name: 'Starter', price: '$12', period: 'per seat / month', description: `Start using ${brand} with a small team.`, features: ['Core workspace', 'Unlimited projects', 'Basic integrations', 'Email support'], cta: { label: 'Get started', href: '/pricing' } },
    { name: 'Studio',  price: '$28', period: 'per seat / month', description: 'The standard for in-flight teams.', features: ['Everything in Starter', 'Advanced workflows', 'Priority support', 'SSO + audit log'], featured: true, cta: { label: 'Get started', href: '/pricing' } },
    { name: 'Scale',   price: 'Custom', description: 'For larger orgs.', features: ['Dedicated success contact', 'Custom SLA', 'Procurement-ready', 'On-prem options'], cta: { label: 'Talk to us', href: '/contact' } },
  ]
  return {
    eyebrow: 'PLANS',
    headline: 'Simple pricing, every team scales.',
    body: 'Try free for 14 days. Cancel any time.',
    tiers,
  }
}

// ── FAQ ─────────────────────────────────────────────────────────────

function buildFaq(brief: Brief, tid: TemplateId): TemplateData['faq'] {
  if (tid !== 'SaasBuilderTemplate') return undefined
  const { brand } = brief
  const faqs: FAQ[] = [
    { q: 'How quickly can we get started?', a: `Most teams are up and running with ${brand} the same day. The migration tools cover the most common stacks out of the box.` },
    { q: 'How does support work?',          a: 'One named contact, one shared channel, response within one business day on every plan above Starter.' },
    { q: 'Is the data really mine?',        a: 'Yes — full export at any time, no lock-in. We treat your data as a guest in our system.' },
    { q: 'Can we self-host?',               a: 'The Scale plan supports BYO cloud and on-prem deployments. We provide the deployment scripts and one engineer to help you bring it up.' },
  ]
  return { eyebrow: 'Questions', headline: 'Things teams ask first.', faqs }
}

// ── Gallery / look strip ───────────────────────────────────────────

function buildGallery(tid: TemplateId): TemplateData['gallery'] {
  if (tid === 'FashionEditorialTemplate') {
    // 8 slots — first 4 used in the lookbook grid, last 4 in the look strip.
    return Array.from({ length: 8 }, () => ({ url: '', alt: 'editorial' } as SectionImage))
  }
  if (tid === 'HospitalityCinematicTemplate') {
    return Array.from({ length: 0 }, () => ({ url: '', alt: 'hospitality' } as SectionImage))
  }
  // Restaurant and Creative Studio use `features[i].image` for their
  // grids — they don't need a separate flat gallery list. Returning
  // undefined avoids wasted Pexels lookups.
  return undefined
}

// ── Editorial quote ─────────────────────────────────────────────────

function buildEditorialQuote(brief: Brief, tid: TemplateId): TemplateData['editorialQuote'] {
  if (tid === 'FashionEditorialTemplate') {
    return {
      quote: `Working with ${brief.brand} feels like leaving a part of yourself in the work — and finding it again, refined.`,
      attribution: 'Mireille K.',
      attributionRole: 'Editor, Field Notes',
    }
  }
  if (tid === 'RestaurantWarmTemplate') {
    return {
      quote: `One of those rooms where the cooking, the room, and the people behind the bar all agree on the same idea. We came for an hour and stayed for three.`,
      attribution: 'Field Notes',
      attributionRole: 'Restaurant column, March 2026',
    }
  }
  if (tid === 'CreativeStudioTemplate') {
    return {
      quote: `Good work is mostly listening. The studio that hears the brief properly is already most of the way there.`,
      attribution: `The ${brief.brand} studio`,
      attributionRole: 'Studio notes',
    }
  }
  return undefined
}

// ── Story ───────────────────────────────────────────────────────────

function buildStory(brief: Brief, tid: TemplateId): TemplateData['story'] {
  const { brand, businessType } = brief
  if (tid === 'HospitalityCinematicTemplate') {
    return {
      eyebrow: 'The story',
      headline: `Built around the place.`,
      body: `${brand} began as a small ${businessType} shaped by the people who already lived here. The light, the language, the slower mornings — the building takes its cues from all of it. We stay short on rules and long on care.`,
    }
  }
  if (tid === 'RestaurantWarmTemplate') {
    return {
      eyebrow: 'In the kitchen',
      headline: `Cooking the way the room is set.`,
      body: `${brand} opened with a short menu and a longer conversation. The kitchen is open, the room is loud in the right way, and the wine list is small on purpose. We change the menu when the weather changes — and the seats fill up either way.`,
    }
  }
  return undefined
}

// ── Closing ─────────────────────────────────────────────────────────

function buildClosing(brief: Brief, tid: TemplateId, ctaHref: string, email: string): TemplateData['closing'] {
  if (tid === 'SaasBuilderTemplate') {
    return {
      eyebrow: 'GET STARTED',
      headline: `Move your team to ${brief.brand} this week.`,
      body: 'Free 14-day trial. No credit card required. White-glove migration available.',
      cta: { label: 'Start free trial', href: ctaHref },
      secondaryCta: { label: 'Talk to sales', href: `mailto:${email}` },
    }
  }
  if (tid === 'FashionEditorialTemplate') {
    return {
      eyebrow: 'Newsletter',
      headline: 'A quiet dispatch, once a month.',
      body: 'Field notes, fittings, and the next small drop.',
      cta: { label: 'Subscribe', href: ctaHref },
    }
  }
  if (tid === 'RestaurantWarmTemplate') {
    return {
      eyebrow: 'Reservations',
      headline: `Pull up a chair.`,
      body: 'Tables open thirty days out. A short call gets you a private room or the chef\'s counter.',
      cta: { label: 'Reserve a table', href: ctaHref },
      secondaryCta: { label: 'Private events', href: `mailto:${email}` },
    }
  }
  if (tid === 'CreativeStudioTemplate') {
    return {
      eyebrow: 'New work',
      headline: `Have a project in mind?`,
      body: 'A short note is enough. We reply within one business day, and most first calls happen within the week.',
      cta: { label: 'Start a project', href: ctaHref },
      secondaryCta: { label: 'Studio email', href: `mailto:${email}` },
    }
  }
  return {
    eyebrow: 'Reservations',
    headline: 'Plan a stay.',
    body: 'Eight rooms, one short conversation. We reply within a day.',
    cta: { label: primaryCtaLabel(brief), href: ctaHref },
  }
}

// ── Footer ──────────────────────────────────────────────────────────

function buildFooter(brief: Brief, navLinks: NavLink[], email: string): TemplateData['footer'] {
  const half = Math.max(2, Math.ceil(navLinks.length / 2))
  const columns: FooterColumn[] = [
    { title: 'Site', links: navLinks.slice(0, half) },
  ]
  if (navLinks.length > half) {
    columns.push({ title: 'More', links: navLinks.slice(half) })
  }
  columns.push({ title: 'Contact', links: [
    { label: 'Email',    href: `mailto:${email}` },
    { label: 'Privacy',  href: '/' },
    { label: 'Terms',    href: '/' },
  ]})
  return {
    brand: brief.brand,
    tagline: `${brief.brand}. ${brief.tone}.`,
    columns,
    legal: `© ${new Date().getFullYear()} ${brief.brand}. All rights reserved.`,
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function pickCtaHref(blueprint: PageBlueprint): string {
  const slugs = new Set(blueprint.pages.map((p) => p.slug))
  if (slugs.has('reservations')) return '/reservations'
  if (slugs.has('pricing'))      return '/pricing'
  if (slugs.has('contact'))      return '/contact'
  return '/'
}

function primaryCtaLabel(brief: Brief): string {
  switch (brief.conversionGoal) {
    case 'signup':       return 'Get started'
    case 'subscription': return 'Subscribe'
    case 'booking':      return 'Book a stay'
    case 'reservation':  return 'Reserve a table'
    case 'inquiry':      return 'Start a project'
    case 'browse':       return 'Explore'
    default:             return 'Get in touch'
  }
}

function contactEmail(brand: string): string {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `hello@${slug || 'studio'}.co`
}
