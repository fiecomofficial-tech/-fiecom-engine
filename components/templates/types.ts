/**
 * Template data shape — shared by every full-page template.
 *
 * One template owns the entire homepage visual experience. The data
 * shape includes every field a template might want; templates render
 * conditionally on what's present. The V2 pipeline builds this object
 * once and hands it to the chosen template — there is no section
 * iteration, no shape library, no composer-guard re-shuffle.
 */

import type { SectionImage } from '@/components/sections/types'

export interface CTA {
  label: string
  href: string
}

export interface FeatureItem {
  title: string
  body: string
  icon?: string
  image?: SectionImage
  eyebrow?: string
}

export interface PricingTier {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  featured?: boolean
  cta: CTA
}

export interface Testimonial {
  quote: string
  author: string
  role?: string
  org?: string
}

export interface FAQ {
  q: string
  a: string
}

export interface NavLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export interface HeroBlock {
  eyebrow?: string
  headline: string
  subhead?: string
  body: string
  cta: CTA
  secondaryCta?: CTA
  image?: SectionImage
  /** A vertical strip of small images shown beside the hero on some
   *  templates (fashion uses this for a "look strip"). */
  strip?: SectionImage[]
}

export interface StoryBlock {
  eyebrow?: string
  headline: string
  body: string
  image?: SectionImage
}

export interface ClosingBlock {
  eyebrow?: string
  headline: string
  body: string
  cta: CTA
  secondaryCta?: CTA
}

export interface FooterBlock {
  brand: string
  tagline: string
  columns: FooterColumn[]
  legal: string
  bigMark?: boolean
}

export interface TemplateData {
  brand: string
  tagline?: string
  navLinks: NavLink[]
  /** Optional secondary nav action — distinct from primary CTA. */
  navCta?: CTA
  hero: HeroBlock
  /** Short, recognizable wordmarks shown under the hero. Rendered as
   *  text — never invented logos. Empty array hides the strip. */
  logos?: Array<{ name: string }>
  /** Marquee text strip used by editorial templates. */
  marquee?: string[]
  features: FeatureItem[]
  /** Optional second feature grid layout — saas template uses it for
   *  detail bands beneath the bento. */
  featureDetails?: FeatureItem[]
  metrics?: Array<{ value: string; label: string; delta?: string }>
  testimonials?: Testimonial[]
  pricing?: { eyebrow?: string; headline: string; body?: string; tiers: PricingTier[] }
  faq?: { eyebrow?: string; headline: string; faqs: FAQ[] }
  /** A flat list of images — gallery / look / room layouts. */
  gallery?: SectionImage[]
  /** Optional editorial pull quote used by fashion / hospitality. */
  editorialQuote?: { quote: string; attribution?: string; attributionRole?: string }
  story?: StoryBlock
  closing: ClosingBlock
  footer: FooterBlock
  /** Theme tokens copied through from the V2 design system — templates
   *  read them as inline style/css var fallbacks when components need
   *  values not yet exposed via :root. */
  tokens: {
    bg: string
    ink: string
    ink2: string
    accent: string
    onAccent: string
    bgAccent: string
    bgDeep: string
    surface: string
    surfaceEdge: string
    mute: string
    fontDisplay: string
    fontBody: string
    mode: 'light' | 'dark'
  }
}
