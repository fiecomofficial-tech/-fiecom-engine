/**
 * Stage 3 — Page blueprint. Decides homepage objective, total section
 * count, narrative arc, CTA / proof / media strategy, and the site
 * page set. The blueprint feeds the role plan in stage 4.
 *
 * Stage 4 — Role plan. Picks an ordered list of section ROLES (not
 * components) that fulfill the blueprint. Two different prompts in the
 * same archetype produce different role orderings via a per-prompt seed.
 */

import type {
  Brief,
  DesignSystem,
  PageBlueprint,
  CTAStrategy,
  ProofStrategy,
  MediaRhythm,
  RolePlan,
  RolePlanEntry,
  SectionRole,
} from './types'

// ── Helpers ────────────────────────────────────────────────────────

function promptSeed(prompt: string): number {
  let h = 2166136261
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ── Section-count target ───────────────────────────────────────────

function targetSectionCount(brief: Brief, ds: DesignSystem, seed: number): number {
  // Base range per visualAmbition.
  const range: [number, number] =
    brief.visualAmbition === 'restrained' ? [6, 8] :
    brief.visualAmbition === 'polished'   ? [7, 9] :
    brief.visualAmbition === 'editorial'  ? [8, 10] :
    /* cinematic */                          [9, 11]
  // contentDepth nudges within range.
  let [min, max] = range
  if (brief.contentDepth === 'minimal') max = Math.max(min, max - 1)
  if (brief.contentDepth === 'rich') min = Math.min(max, min + 1)
  const span = max - min + 1
  return min + ((seed >>> 4) % span)
}

// ── CTA / proof / media strategy ───────────────────────────────────

function ctaStrategy(brief: Brief): CTAStrategy {
  switch (brief.conversionGoal) {
    case 'signup':
    case 'subscription': return 'pricing-led'
    case 'booking':
    case 'reservation': return 'hospitality-soft'
    case 'lead':
    case 'inquiry': return 'lead-form'
    case 'browse': return 'soft-multiple'
  }
}

function proofStrategy(brief: Brief): ProofStrategy {
  if (brief.archetype === 'saas' || brief.archetype === 'ai-startup' || brief.archetype === 'product-launch') return 'mixed'
  if (brief.archetype === 'fintech' || brief.archetype === 'b2b') return 'logos'
  if (brief.archetype === 'fashion' || brief.archetype === 'creative-studio' || brief.archetype === 'portfolio') return 'editorial-quote'
  if (brief.archetype === 'restaurant' || brief.archetype === 'hospitality' || brief.archetype === 'wellness') return 'testimonials'
  return 'testimonials'
}

function mediaRhythm(brief: Brief, ds: DesignSystem): MediaRhythm {
  if (ds.image.density === 'heavy') return 'image-led'
  if (ds.image.density === 'light') return 'balanced'
  return 'copy-led'
}

// ── Page set ────────────────────────────────────────────────────────

function pageSet(brief: Brief): Array<{ slug: string; title: string; sectionCount: number }> {
  switch (brief.archetype) {
    case 'saas':
    case 'ai-startup':
    case 'product-launch':
      return [
        { slug: 'home', title: 'Home', sectionCount: 9 },
        { slug: 'product', title: 'Product', sectionCount: 5 },
        { slug: 'pricing', title: 'Pricing', sectionCount: 4 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'fintech':
      return [
        { slug: 'home', title: 'Home', sectionCount: 8 },
        { slug: 'product', title: 'Product', sectionCount: 5 },
        { slug: 'plans', title: 'Plans', sectionCount: 4 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'hospitality':
      return [
        { slug: 'home', title: 'Home', sectionCount: 10 },
        { slug: 'rooms', title: 'Rooms', sectionCount: 5 },
        { slug: 'reservations', title: 'Reservations', sectionCount: 4 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'restaurant':
      return [
        { slug: 'home', title: 'Home', sectionCount: 8 },
        { slug: 'menu', title: 'Menu', sectionCount: 5 },
        { slug: 'reservations', title: 'Reservations', sectionCount: 4 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'fashion':
      return [
        { slug: 'home', title: 'Home', sectionCount: 10 },
        { slug: 'collection', title: 'Collection', sectionCount: 5 },
        { slug: 'about', title: 'About', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'creative-studio':
    case 'portfolio':
      return [
        { slug: 'home', title: 'Home', sectionCount: 10 },
        { slug: 'work', title: 'Work', sectionCount: 5 },
        { slug: 'studio', title: 'Studio', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'architecture':
      return [
        { slug: 'home', title: 'Home', sectionCount: 10 },
        { slug: 'projects', title: 'Projects', sectionCount: 5 },
        { slug: 'studio', title: 'Studio', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'ecommerce':
      return [
        { slug: 'home', title: 'Home', sectionCount: 8 },
        { slug: 'shop', title: 'Shop', sectionCount: 5 },
        { slug: 'about', title: 'About', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'wellness':
    case 'health':
      return [
        { slug: 'home', title: 'Home', sectionCount: 7 },
        { slug: 'care', title: 'Care', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'education':
      return [
        { slug: 'home', title: 'Home', sectionCount: 8 },
        { slug: 'programs', title: 'Programs', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    case 'event':
      return [
        { slug: 'home', title: 'Home', sectionCount: 7 },
        { slug: 'schedule', title: 'Schedule', sectionCount: 5 },
        { slug: 'tickets', title: 'Tickets', sectionCount: 4 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
    default:
      return [
        { slug: 'home', title: 'Home', sectionCount: 7 },
        { slug: 'services', title: 'Services', sectionCount: 5 },
        { slug: 'about', title: 'About', sectionCount: 5 },
        { slug: 'contact', title: 'Contact', sectionCount: 4 },
      ]
  }
}

// ── Narrative arc + role pool per archetype ────────────────────────

function arcFor(brief: Brief): { arc: string[]; rolePool: SectionRole[] } {
  switch (brief.archetype) {
    case 'saas':
    case 'ai-startup':
      return {
        arc: ['hook', 'trust', 'capability', 'proof', 'commerce', 'objections', 'close'],
        rolePool: ['hero', 'authority', 'feature-detail', 'product-story', 'authority', 'pricing-conversion', 'faq-objection', 'closing'],
      }
    case 'product-launch':
      return {
        arc: ['hook', 'capability', 'metrics', 'proof', 'commerce', 'objections', 'close'],
        rolePool: ['hero', 'feature-detail', 'authority', 'product-story', 'authority', 'pricing-conversion', 'faq-objection', 'closing'],
      }
    case 'fintech':
      return {
        arc: ['hook', 'trust', 'capability', 'metrics', 'proof', 'objections', 'close'],
        rolePool: ['hero', 'authority', 'feature-detail', 'product-story', 'authority', 'faq-objection', 'closing'],
      }
    case 'hospitality':
      return {
        arc: ['mood', 'reveal', 'rooms', 'place', 'proof', 'editorial', 'close'],
        rolePool: ['hero', 'editorial-moment', 'feature-detail', 'media-gallery', 'product-story', 'authority', 'editorial-moment', 'closing'],
      }
    case 'restaurant':
      return {
        arc: ['mood', 'craft', 'menu', 'proof', 'close'],
        rolePool: ['hero', 'editorial-moment', 'feature-detail', 'media-gallery', 'authority', 'closing'],
      }
    case 'fashion':
      return {
        arc: ['mood', 'editorial', 'gallery', 'craft', 'narrative', 'proof', 'close'],
        rolePool: ['hero', 'editorial-moment', 'media-gallery', 'feature-detail', 'product-story', 'media-gallery', 'authority', 'closing'],
      }
    case 'creative-studio':
    case 'portfolio':
      return {
        arc: ['statement', 'work', 'craft', 'voice', 'work', 'proof', 'close'],
        rolePool: ['hero', 'media-gallery', 'feature-detail', 'editorial-moment', 'product-story', 'media-gallery', 'authority', 'closing'],
      }
    case 'architecture':
      return {
        arc: ['mood', 'projects', 'method', 'proof', 'projects', 'editorial', 'close'],
        rolePool: ['hero', 'media-gallery', 'feature-detail', 'product-story', 'authority', 'media-gallery', 'editorial-moment', 'closing'],
      }
    case 'ecommerce':
      return {
        arc: ['hook', 'editorial', 'product', 'gallery', 'proof', 'close'],
        rolePool: ['hero', 'editorial-moment', 'feature-detail', 'media-gallery', 'authority', 'closing'],
      }
    case 'wellness':
    case 'health':
      return {
        arc: ['hook', 'craft', 'proof', 'editorial', 'close'],
        rolePool: ['hero', 'feature-detail', 'authority', 'editorial-moment', 'closing'],
      }
    case 'education':
      return {
        arc: ['hook', 'capability', 'metrics', 'proof', 'commerce', 'objections', 'close'],
        rolePool: ['hero', 'feature-detail', 'authority', 'editorial-moment', 'authority', 'pricing-conversion', 'faq-objection', 'closing'],
      }
    case 'event':
      return {
        arc: ['hook', 'lineup', 'proof', 'objections', 'close'],
        rolePool: ['hero', 'feature-detail', 'media-gallery', 'authority', 'faq-objection', 'closing'],
      }
    default:
      return {
        arc: ['hook', 'capability', 'proof', 'objections', 'close'],
        rolePool: ['hero', 'feature-detail', 'authority', 'faq-objection', 'closing'],
      }
  }
}

// ── Trim role pool to section count ────────────────────────────────

function trimRolesToCount(pool: SectionRole[], target: number, seed: number): SectionRole[] {
  if (pool.length === target) return pool
  if (pool.length < target) {
    // Pad with editorial / authority / media beats from the middle.
    const out = [...pool]
    const adders: SectionRole[] = ['editorial-moment', 'authority', 'media-gallery', 'product-story']
    let i = 0
    while (out.length < target) {
      const insertAt = Math.max(1, out.length - 2) // before closing
      out.splice(insertAt, 0, adders[(seed + i) % adders.length])
      i++
    }
    return out
  }
  // Trim: drop optional roles from the middle, never the first or last.
  const out = [...pool]
  const droppable: SectionRole[] = ['editorial-moment', 'product-story', 'media-gallery', 'authority']
  for (const role of droppable) {
    while (out.length > target) {
      // Find last index of role, but not the closing slot.
      const idx = out.length - 1 - [...out].reverse().findIndex((r, i) => r === role && i !== 0)
      if (idx >= out.length || idx <= 0) break
      out.splice(idx, 1)
    }
    if (out.length === target) break
  }
  while (out.length > target) {
    out.splice(out.length - 2, 1)
  }
  return out
}

// ── Public entries ─────────────────────────────────────────────────

export function buildBlueprint(brief: Brief, ds: DesignSystem): PageBlueprint {
  const seed = promptSeed(brief.prompt)
  const sectionCount = targetSectionCount(brief, ds, seed)
  const { arc } = arcFor(brief)
  return {
    homepageObjective: `Convert ${brief.targetCustomer} on ${brief.conversionGoal}.`,
    sectionCount,
    narrativeArc: arc,
    ctaStrategy: ctaStrategy(brief),
    proofStrategy: proofStrategy(brief),
    mediaRhythm: mediaRhythm(brief, ds),
    pages: pageSet(brief),
  }
}

export function planRoles(brief: Brief, ds: DesignSystem, blueprint: PageBlueprint): RolePlan {
  const seed = promptSeed(brief.prompt)
  const { rolePool } = arcFor(brief)
  const trimmed = trimRolesToCount(rolePool, blueprint.sectionCount, seed)
  const intentByRole: Record<SectionRole, string> = {
    hero: brief.offer,
    authority: 'Show why visitors can trust this brand.',
    'product-story': `Explain what ${brief.brand} does and why it matters.`,
    'media-gallery': 'Show the work through imagery.',
    'editorial-moment': 'A quiet beat that anchors the story.',
    'feature-detail': 'Detail the capabilities or offer.',
    'pricing-conversion': 'Make the next step obvious.',
    'faq-objection': 'Answer the question stopping the visitor from acting.',
    closing: blueprint.ctaStrategy === 'hospitality-soft' ? 'Invite the visitor to reach out.' : 'Convert the visitor.',
  }
  const entries: RolePlanEntry[] = trimmed.map((role) => ({
    role,
    intent: intentByRole[role],
    mediaWanted: role === 'hero' || role === 'media-gallery' || role === 'product-story' || (role === 'feature-detail' && ds.image.density !== 'none'),
  }))
  return { entries }
}

export function describeBlueprint(b: PageBlueprint): string {
  return `objective="${b.homepageObjective}"  sections=${b.sectionCount}  arc=[${b.narrativeArc.join(' › ')}]  cta=${b.ctaStrategy} proof=${b.proofStrategy} media=${b.mediaRhythm}`
}

export function describeRolePlan(r: RolePlan): string {
  return r.entries.map((e) => e.role).join(' › ')
}
