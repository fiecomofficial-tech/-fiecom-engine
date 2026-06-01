/**
 * Stage 5 — Match roles to concrete component ids.
 *
 * The matcher reads from the design system + brief + role to pick the
 * best component. It explicitly does NOT consult a fixed shape library.
 * Each role has a priority list of candidate components; the first one
 * that (a) is not forbidden, (b) hasn't been used yet, and (c) fits the
 * motion budget wins.
 */

import type { ComponentId } from '../registry'
import type {
  Brief,
  DesignSystem,
  RolePlan,
  ComponentMatchPlan,
  MatchedSection,
  SectionRole,
} from './types'

interface CandidateList {
  cinematic: ComponentId[]   // costs cinematic budget
  baseline: ComponentId[]    // free
}

// Per (archetype, role) candidate lists. The matcher walks the list
// in order — first usable component wins.
const ROLE_CANDIDATES: Record<string, Partial<Record<SectionRole, CandidateList>>> = {
  saas: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineLogoBar', 'BaselineTestimonials', 'MetricRow', 'LogoCloud'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures', 'FeatureList'] },
    'product-story': { cinematic: ['EditorialQuote'], baseline: ['TwoColumnText'] },
    'pricing-conversion': { cinematic: [], baseline: ['PricingTiers'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  'ai-startup': {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineLogoBar', 'BaselineTestimonials', 'MetricRow', 'LogoCloud'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures', 'FeatureList'] },
    'product-story': { cinematic: ['EditorialQuote'], baseline: ['TwoColumnText'] },
    'pricing-conversion': { cinematic: [], baseline: ['PricingTiers'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  'product-launch': {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineLogoBar', 'MetricRow', 'BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures', 'FeatureList'] },
    'product-story': { cinematic: [], baseline: ['TwoColumnText'] },
    'pricing-conversion': { cinematic: [], baseline: ['PricingTiers'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  fintech: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineLogoBar', 'MetricRow', 'BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures', 'FeatureList'] },
    'product-story': { cinematic: [], baseline: ['TwoColumnText'] },
    'pricing-conversion': { cinematic: [], baseline: ['PricingTiers'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  hospitality: {
    hero: { cinematic: ['HeroCinematic'], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['MessageReveal', 'EditorialQuote'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['ImageGallery', 'HorizontalShowcase', 'AsymmetricGrid'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote', 'MessageReveal', 'StickyNarrative'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  restaurant: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['MessageReveal'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['AsymmetricGrid', 'ImageGallery'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote', 'MessageReveal'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  fashion: {
    hero: { cinematic: ['HeroEditorial'], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials', 'LogoCloud'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures', 'FeatureList'] },
    'product-story': { cinematic: ['MessageReveal', 'EditorialQuote'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['ImageGallery', 'HorizontalShowcase', 'AsymmetricGrid', 'StickyNarrative'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote', 'MessageReveal', 'StickyNarrative'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  'creative-studio': {
    hero: { cinematic: ['HeroEditorial'], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['MessageReveal', 'EditorialQuote'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['HorizontalShowcase', 'AsymmetricGrid', 'ImageGallery'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote', 'StickyNarrative', 'MessageReveal'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  portfolio: {
    hero: { cinematic: ['HeroEditorial'], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['EditorialQuote'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['HorizontalShowcase', 'AsymmetricGrid', 'ImageGallery'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote', 'StickyNarrative'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  architecture: {
    hero: { cinematic: ['HeroEditorial'], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['MessageReveal'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['AsymmetricGrid', 'StickyNarrative', 'ImageGallery'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  ecommerce: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'product-story': { cinematic: ['EditorialQuote'], baseline: ['TwoColumnText'] },
    'media-gallery': { cinematic: ['HorizontalShowcase', 'AsymmetricGrid'], baseline: [] },
    'editorial-moment': { cinematic: ['EditorialQuote'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  wellness: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['FeatureList', 'BaselineFeatures'] },
    'editorial-moment': { cinematic: ['EditorialQuote'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  health: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['FeatureList'] },
    'editorial-moment': { cinematic: ['EditorialQuote'], baseline: [] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  education: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials', 'MetricRow'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'editorial-moment': { cinematic: ['EditorialQuote'], baseline: [] },
    'pricing-conversion': { cinematic: [], baseline: ['PricingTiers'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  event: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineTestimonials', 'LogoCloud'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'media-gallery': { cinematic: ['AsymmetricGrid'], baseline: [] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
  b2b: {
    hero: { cinematic: [], baseline: ['BaselineHero'] },
    authority: { cinematic: [], baseline: ['BaselineLogoBar', 'BaselineTestimonials'] },
    'feature-detail': { cinematic: [], baseline: ['BaselineFeatures'] },
    'faq-objection': { cinematic: [], baseline: ['FAQAccordion'] },
    closing: { cinematic: [], baseline: ['BaselineCTA'] },
  },
}

const FALLBACK_BY_ROLE: Record<SectionRole, ComponentId[]> = {
  hero: ['BaselineHero'],
  authority: ['BaselineTestimonials', 'BaselineLogoBar', 'LogoCloud'],
  'product-story': ['TwoColumnText'],
  'media-gallery': ['BaselineFeatures'],
  'editorial-moment': ['EditorialQuote', 'TwoColumnText'],
  'feature-detail': ['BaselineFeatures', 'FeatureList'],
  'pricing-conversion': ['PricingTiers'],
  'faq-objection': ['FAQAccordion'],
  closing: ['BaselineCTA'],
}

export function matchComponents(
  brief: Brief,
  ds: DesignSystem,
  rolePlan: RolePlan,
): ComponentMatchPlan {
  const cands = ROLE_CANDIDATES[brief.archetype] ?? ROLE_CANDIDATES.b2b
  const forbidden = new Set<string>(ds.forbiddenComponents)
  const used = new Set<string>()
  let cinematicUsed = 0
  const result: MatchedSection[] = []
  // Stable per-prompt seed for tiebreaking in the candidate lists.
  const seed = promptSeedFromBrief(brief)

  for (let i = 0; i < rolePlan.entries.length; i++) {
    const entry = rolePlan.entries[i]
    const role = entry.role
    const cand = cands[role] ?? { cinematic: [], baseline: FALLBACK_BY_ROLE[role] ?? ['BaselineFeatures'] }

    let picked: ComponentId | null = null

    // 1) Try cinematic candidates first IF this role wants visual depth
    // AND budget remains AND ds.preferredCinematic agrees.
    const cinematicPool = cand.cinematic.filter((id) =>
      !forbidden.has(id) &&
      !used.has(id) &&
      ds.preferredCinematic.includes(id),
    )
    if (cinematicPool.length > 0 && cinematicUsed < ds.motion.cinematicBudget) {
      const idx = (seed + i * 7) % cinematicPool.length
      picked = cinematicPool[idx]
      cinematicUsed += 1
    }

    // 2) Fall back to baseline candidates.
    if (!picked) {
      const baselinePool = cand.baseline.filter((id) => !forbidden.has(id) && !used.has(id))
      if (baselinePool.length > 0) {
        const idx = (seed + i * 11) % baselinePool.length
        picked = baselinePool[idx]
      }
    }

    // 3) Final fallback — drop in a generic baseline.
    if (!picked) {
      const fb = FALLBACK_BY_ROLE[role] ?? ['BaselineFeatures']
      for (const id of fb) {
        if (!used.has(id) && !forbidden.has(id)) { picked = id; break }
      }
    }
    if (!picked) continue

    used.add(picked)
    result.push({ role, componentId: picked, intent: entry.intent, mediaWanted: entry.mediaWanted })
  }

  return { sections: result }
}

function promptSeedFromBrief(b: Brief): number {
  const s = `${b.prompt}|${b.brand}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function describeMatch(plan: ComponentMatchPlan): string {
  return plan.sections.map((s) => `${s.componentId}(${s.role})`).join(' › ')
}
