/**
 * Fiecom V2 — Design-system-first generation pipeline.
 *
 * Stages:
 *   1. Brief         (extractBrief)
 *   2. Design System (buildDesignSystem)
 *   3. Page Blueprint (buildBlueprint)
 *   4. Role Plan     (planRoles)
 *   5. Component Match (matchComponents)
 *   6. Assembly      (assembleSite)
 *   7. Visual QA     (visualQA — reuses quality-gate + new checks)
 *
 * Each stage feeds the next. Roles are decided BEFORE components, and
 * components are matched to the design system + brief — NOT to a fixed
 * shape library. The old composition-guard shape system is bypassed on
 * the home page.
 */

import type { ComponentId } from '../registry'

// ── Stage 1: Brief ──────────────────────────────────────────────────

export type ConversionGoal =
  | 'lead'         // contact form / inquiry
  | 'signup'       // self-serve product signup
  | 'booking'      // hospitality / appointment
  | 'reservation'  // restaurant / table
  | 'inquiry'      // creative studio / agency
  | 'subscription' // newsletter / paid plan
  | 'browse'       // editorial / portfolio

export type ContentDepth = 'minimal' | 'moderate' | 'rich'
export type VisualAmbition = 'restrained' | 'polished' | 'cinematic' | 'editorial'

export interface Brief {
  prompt: string
  brand: string
  businessType: string         // "neighborhood Italian restaurant", "boutique cliffside hotel"
  archetype: string            // free-form normalized — saas, ai-startup, hotel, restaurant, fashion, studio, ecommerce, …
  targetCustomer: string       // "distributed engineering teams", "design-conscious travelers"
  offer: string                // "real-time collaboration", "chef-led seasonal menu"
  tone: string                 // "confident technical", "warm sensory"
  conversionGoal: ConversionGoal
  contentDepth: ContentDepth
  visualAmbition: VisualAmbition
}

// ── Stage 2: Design System ─────────────────────────────────────────

export interface ColorSystem {
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
  mode: 'light' | 'dark'
}

export interface TypographySystem {
  display: { family: string; weight: number; scale: number; tracking: string }
  body: { family: string; weight: number; scale: number }
  eyebrow: { family: string; tracking: string }
  /** Tone of voice for copy generation — feeds into headline copy. */
  voice: 'direct-claim' | 'sensory-evocative' | 'editorial-poetic' | 'technical-precise' | 'warm-conversational'
}

export interface SpacingSystem {
  /** Vertical padding between sections — Tailwind class fragment. */
  sectionY: 'tight' | 'balanced' | 'generous'
  /** Inner content gap. */
  contentGap: 'tight' | 'balanced' | 'generous'
  /** Max-width container. */
  maxWidth: 'narrow' | 'comfortable' | 'wide'
}

export interface RadiusSystem {
  pill: number
  card: number
  tile: number
}

export interface MotionSystem {
  level: 'still' | 'subtle' | 'moderate' | 'rich'
  maxImageScale: number
  parallaxAllowed: boolean
  scrollPinningAllowed: boolean
  /** Hard cap on cinematic body inserts. */
  cinematicBudget: number
}

export interface ImageSystem {
  vocabulary: string           // prepended to every Pexels query
  avoid: string[]
  heroTreatment: 'framed' | 'full-bleed' | 'split'
  density: 'none' | 'light' | 'heavy'
}

export type LayoutDensity = 'tight' | 'balanced' | 'generous'

export interface ContrastRules {
  minBodyRatio: number
  minLargeRatio: number
}

export interface DesignSystem {
  colors: ColorSystem
  typography: TypographySystem
  spacing: SpacingSystem
  radius: RadiusSystem
  motion: MotionSystem
  image: ImageSystem
  layoutDensity: LayoutDensity
  contrast: ContrastRules
  /** Component family preferences derived from archetype + ambition. */
  preferredFamilies: string[]
  forbiddenComponents: ComponentId[]
  preferredCinematic: ComponentId[]
}

// ── Stage 3: Page Blueprint ─────────────────────────────────────────

export type CTAStrategy = 'single-strong' | 'soft-multiple' | 'pricing-led' | 'hospitality-soft' | 'lead-form'
export type ProofStrategy = 'testimonials' | 'logos' | 'metrics' | 'editorial-quote' | 'mixed'
export type MediaRhythm = 'image-led' | 'copy-led' | 'balanced'

export interface PageBlueprint {
  homepageObjective: string
  sectionCount: number          // total home body sections excluding chrome
  narrativeArc: string[]        // short labels for each beat
  ctaStrategy: CTAStrategy
  proofStrategy: ProofStrategy
  mediaRhythm: MediaRhythm
  /** Total site page set the director recommends. */
  pages: Array<{ slug: string; title: string; sectionCount: number }>
}

// ── Stage 4: Role Plan ──────────────────────────────────────────────

export type SectionRole =
  | 'hero'
  | 'authority'         // social proof / logos / metrics
  | 'product-story'     // narrative about the offer
  | 'media-gallery'     // visual showcase
  | 'editorial-moment'  // pull quote / message reveal
  | 'feature-detail'    // feature grid
  | 'pricing-conversion'
  | 'faq-objection'
  | 'closing'

export interface RolePlanEntry {
  role: SectionRole
  intent: string
  mediaWanted: boolean
}

export interface RolePlan {
  entries: RolePlanEntry[]
}

// ── Stage 5: Component Match ───────────────────────────────────────

export interface MatchedSection {
  role: SectionRole
  componentId: ComponentId
  intent: string
  mediaWanted: boolean
}

export interface ComponentMatchPlan {
  sections: MatchedSection[]
}

// ── Stage 6: Assembly output (compatible with renderer) ────────────

export type V2Section = {
  id: ComponentId
  content: Record<string, unknown>
  imageQueries?: { primary?: string; secondary?: string; gallery?: string[] }
}

export type V2Page = {
  slug: string
  title?: string
  sections: V2Section[]
}

export interface V2Config {
  theme: Record<string, string>
  pages: V2Page[]
  /** Embedded design system — renderer applies these tokens. */
  designSystem: DesignSystem
  /** Embedded brief + blueprint — useful for debugging / editor UI. */
  brief: Brief
  blueprint: PageBlueprint
}

// ── Stage 7: Visual QA ─────────────────────────────────────────────

export type QAVerdict = 'pass' | 'repaired' | 'fail'

export interface QAReport {
  verdict: QAVerdict
  config: V2Config
  issues: Array<{ category: string; level: 'fix' | 'fail' | 'warn'; message: string; page?: string; section?: string }>
}
