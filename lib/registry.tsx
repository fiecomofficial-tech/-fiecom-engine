// PHASE-3: alternate cinematic heroes re-enabled. Composer prompt gates
// them to slug === 'home' AND brand category (visual brands only).
import HeroCinematic from '@/components/sections/HeroCinematic'
import HeroEditorial from '@/components/sections/HeroEditorial'
import BaselineNavbar from '@/components/baseline/BaselineNavbar'
import BaselineFooter from '@/components/baseline/BaselineFooter'
import BaselineHero from '@/components/baseline/BaselineHero'
import BaselineFeatures from '@/components/baseline/BaselineFeatures'
import BaselineLogoBar from '@/components/baseline/BaselineLogoBar'
import BaselineTestimonials from '@/components/baseline/BaselineTestimonials'
import BaselineCTA from '@/components/baseline/BaselineCTA'
import BaselinePageHeader from '@/components/baseline/BaselinePageHeader'
import BaselineAboutNarrative from '@/components/baseline/BaselineAboutNarrative'
import BaselineContact from '@/components/baseline/BaselineContact'
// PHASE-2 ALLOWLIST: 4 cinematic sections re-enabled as homepage-only
// enhancements. Composer prompt is what gates them to slug === 'home';
// registry just exposes them. Other cinematic sections (Sticky*, Hero*,
// FeatureBento, Stats, Timeline, etc.) remain hidden.
import HorizontalShowcase from '@/components/sections/HorizontalShowcase'
import MessageReveal from '@/components/sections/MessageReveal'
import MarqueeBand from '@/components/sections/MarqueeBand'
import ImageGallery from '@/components/sections/ImageGallery'
// PHASE-4: new editorial sections — overflow-safe, no scroll-jacking,
// no global scroll corruption. Each is a self-contained section.
import EditorialQuote from '@/components/sections/EditorialQuote'
import AsymmetricGrid from '@/components/sections/AsymmetricGrid'
import StickyNarrative from '@/components/sections/StickyNarrative'
import PricingTiers from '@/components/sections/PricingTiers'
import FAQAccordion from '@/components/sections/FAQAccordion'
import ContactBlock from '@/components/sections/ContactBlock'
import ContactForm from '@/components/blocks/ContactForm'
import NewsletterSignup from '@/components/blocks/NewsletterSignup'
import LogoCloud from '@/components/blocks/LogoCloud'
import FeatureList from '@/components/blocks/FeatureList'
import MetricRow from '@/components/blocks/MetricRow'
import DataTable from '@/components/blocks/DataTable'
import LinkList from '@/components/blocks/LinkList'
import PageHeader from '@/components/blocks/PageHeader'
import BlogIndex from '@/components/blocks/BlogIndex'
import JobsList from '@/components/blocks/JobsList'
import ChangelogList from '@/components/blocks/ChangelogList'
import TwoColumnText from '@/components/blocks/TwoColumnText'
// PHASE-3: imported cinematic template sections re-enabled. All are
// HOMEPAGE-ONLY and gated by intent.cinematicIntensity in
// composition-guard. Each has overflow:hidden + sticky/pin containment.
import {
  FlowEvent,
  FlowFooter,
  FlowHero,
  FlowOnDemand,
  FlowPartyTools,
  FlowTutors,
  FlowWhatWeDo,
  FlowWhoWeAre,
  SpyltBenefit,
  SpyltBottomBanner,
  SpyltFlavor,
  SpyltFooter,
  SpyltHero,
  SpyltMessage,
  SpyltNutrition,
  SpyltTestimonials,
  TruusDoubleMarquee,
  TruusFooter,
  TruusHorizontalWords,
  TruusMotionCards,
  TruusServiceCards,
  TruusShowreel,
  TruusVimeoHero,
  ZentryAbout,
  ZentryContact,
  ZentryFeatures,
  ZentryFooter,
  ZentryHero,
  ZentryStory,
} from '@/components/sections/ImportedTemplateSections'
import type { SectionData } from '@/components/sections/types'
import type { ComponentType } from 'react'
import type {
  CTAData,
  ContactData,
  FeaturesData,
  FooterData,
  HeroData,
  LogoBarData,
  NavData,
  PageHeaderData,
  TestimonialsData,
} from '@/components/baseline/types'

type RegistryComponent = ComponentType<{ data: SectionData }>

function adaptBaseline<T>(
  Component: ComponentType<{ data: T }>,
  map: (data: SectionData) => T,
): RegistryComponent {
  return function BaselineAdapter({ data }: { data: SectionData }) {
    return <Component data={map(data)} />
  }
}

const content = <T,>(data: SectionData): T =>
  data.content as T

const BaselineNavbarSection = adaptBaseline<NavData>(BaselineNavbar, (data) => content<NavData>(data))
const BaselineFooterSection = adaptBaseline<FooterData>(BaselineFooter, (data) => content<FooterData>(data))
const BaselineHeroSection = adaptBaseline<HeroData>(BaselineHero, (data) => ({
  ...content<HeroData>(data),
  image: data.images?.primary,
}))
const BaselineLogoBarSection = adaptBaseline<LogoBarData>(BaselineLogoBar, (data) => content<LogoBarData>(data))
const BaselineFeaturesSection = adaptBaseline<FeaturesData>(BaselineFeatures, (data) => {
  const c = content<Record<string, unknown>>(data)
  const rawItems = (Array.isArray(c.items) ? c.items : c.features) as Array<Record<string, unknown>> | undefined
  const images = data.images?.gallery ?? []
  return {
    eyebrow: c.eyebrow as string | undefined,
    headline: String(c.headline ?? ''),
    accent: c.accent as string | undefined,
    items: (rawItems ?? []).slice(0, 3).map((item, i) => ({
      eyebrow: item.eyebrow as string | undefined,
      title: String(item.title ?? ''),
      body: String(item.body ?? ''),
      image: images[i],
    })),
  }
})
const BaselineTestimonialsSection = adaptBaseline<TestimonialsData>(BaselineTestimonials, (data) => {
  const c = content<Record<string, unknown>>(data)
  const rawItems = (Array.isArray(c.items) ? c.items : c.testimonials) as Array<Record<string, unknown>> | undefined
  return {
    eyebrow: c.eyebrow as string | undefined,
    headline: String(c.headline ?? ''),
    items: (rawItems ?? []).slice(0, 3).map((item) => ({
      quote: String(item.quote ?? ''),
      name: String(item.name ?? item.author ?? ''),
      role: [item.role, item.org].filter(Boolean).join(', ') || undefined,
    })),
  }
})
const BaselineCTASection = adaptBaseline<CTAData>(BaselineCTA, (data) => content<CTAData>(data))
const BaselinePageHeaderSection = adaptBaseline<PageHeaderData>(BaselinePageHeader, (data) => content<PageHeaderData>(data))
const BaselineContactSection = adaptBaseline<ContactData>(BaselineContact, (data) => {
  const c = content<Record<string, unknown>>(data)
  return {
    header: {
      eyebrow: c.eyebrow as string | undefined,
      headline: String(c.headline ?? c.formTitle ?? 'Contact'),
      body: c.body as string | undefined,
    },
    formTitle: c.formTitle as string | undefined,
    formBody: c.formBody as string | undefined,
    details: (Array.isArray(c.details) ? c.details : []) as ContactData['details'],
    recipientEmail: String(c.recipientEmail ?? 'hello@example.com'),
  }
})

export const COMPONENT_REGISTRY: Record<string, RegistryComponent> = {
  // Chrome
  BaselineNavbar: BaselineNavbarSection,
  BaselineFooter: BaselineFooterSection,
  // Baseline foundation
  BaselineHero: BaselineHeroSection,
  BaselineFeatures: BaselineFeaturesSection,
  BaselineLogoBar: BaselineLogoBarSection,
  BaselineTestimonials: BaselineTestimonialsSection,
  BaselineCTA: BaselineCTASection,
  BaselinePageHeader: BaselinePageHeaderSection,
  BaselineAboutNarrative,
  BaselineContact: BaselineContactSection,
  // Cinematic homepage allowlist (composer gates to slug === 'home')
  MessageReveal,
  MarqueeBand,
  ImageGallery,
  HorizontalShowcase,
  EditorialQuote,
  AsymmetricGrid,
  StickyNarrative,
  // Alternate cinematic heroes (composer gates to slug === 'home' + visual brand)
  HeroCinematic,
  HeroEditorial,
  // Imported cinematic template sections (homepage only)
  ZentryHero,
  ZentryAbout,
  ZentryFeatures,
  ZentryStory,
  ZentryContact,
  ZentryFooter,
  FlowHero,
  FlowEvent,
  FlowWhoWeAre,
  FlowOnDemand,
  FlowTutors,
  FlowWhatWeDo,
  FlowPartyTools,
  FlowFooter,
  SpyltHero,
  SpyltMessage,
  SpyltFlavor,
  SpyltNutrition,
  SpyltBenefit,
  SpyltTestimonials,
  SpyltBottomBanner,
  SpyltFooter,
  TruusVimeoHero,
  TruusHorizontalWords,
  TruusMotionCards,
  TruusShowreel,
  TruusServiceCards,
  TruusDoubleMarquee,
  TruusFooter,
  // Functional blocks (Baseline-compatible spacing/typography)
  PricingTiers,
  FAQAccordion,
  LogoCloud,
  FeatureList,
  MetricRow,
  DataTable,
  LinkList,
  PageHeader,
  BlogIndex,
  JobsList,
  ChangelogList,
  TwoColumnText,
  NewsletterSignup,
  ContactBlock,
  ContactForm,
}

export type ComponentId = keyof typeof COMPONENT_REGISTRY
export const COMPONENT_IDS = Object.keys(COMPONENT_REGISTRY) as ComponentId[]

interface SectionMeta {
  primary: number
  secondary?: number
  gallery?: number
  orientation: 'landscape' | 'portrait' | 'squarish'
  contentNotes: string
  role:
    | 'chrome'
    | 'hero'
    | 'feature'
    | 'storytelling'
    | 'social'
    | 'commerce'
    | 'closing'
    | 'utility'
    | 'app'
  /**
   * "cinematic" → uses GSAP/ScrollTrigger motion sections; visual-impact
   * tier. "block" → simpler functional UI (forms, tables, link lists,
   * KPI rows). The AI picks the tier per task.
   */
  tier: 'cinematic' | 'block'
  /**
   * Slots eligible for a cinematic video background. The orchestrator
   * will try Pexels Videos for these slots and fall back to a photo
   * automatically when no good clip is available. Galleries/utility
   * sections stay as still images.
   */
  videoSlots?: Array<'primary' | 'secondary'>
}

export const SECTION_META: Record<ComponentId, SectionMeta> = {
  // ── Baseline tier — clean modern website foundation ────────────────
  // These are the new default sections, ported from the reference repo
  // (the Fiecom template — Lovable / Framer AI). They produce real-looking websites.
  // Cinematic sections layer ON TOP of baseline for the homepage; they
  // never replace it.
  BaselineNavbar: {
    primary: 0,
    orientation: 'landscape',
    role: 'chrome',
    tier: 'block',
    contentNotes:
      '{ brand:string, links:[{label,href} x3-5 — point at /<slug> for real sub-pages], cta?:{label,href? default "/contact"} }',
  },
  BaselineFooter: {
    primary: 0,
    orientation: 'landscape',
    role: 'chrome',
    tier: 'block',
    contentNotes:
      '{ brand:string, tagline?:string (one short sentence), columns:[{title, links:[{label,href?} x3-5]} x2-4], legal?, meta?:[{label,href?} x2-3 — Privacy/Terms/etc.] }',
  },
  BaselineHero: {
    primary: 1,
    orientation: 'portrait',
    role: 'hero',
    tier: 'block',
    contentNotes:
      '{ eyebrow? (short pill — "New — feature launch" style), headline (3-7 words), accent? (1-3 words rendered as serif italic suffix — optional), body (1-2 sentences), cta:{label,href?}, secondaryCta?:{label,href?} } — clean text-left + framed image-right hero, like Lovable/Framer AI/Replit AI',
  },
  BaselineFeatures: {
    primary: 0,
    gallery: 3,
    orientation: 'landscape',
    role: 'feature',
    tier: 'block',
    contentNotes:
      '{ eyebrow (1-3 words), headline (3-8 words), accent? (trailing muted fragment), features:[{eyebrow? ("01 — Planning"), title, body} x3] } — 3-card grid with framed image per card',
  },
  BaselineLogoBar: {
    primary: 0,
    orientation: 'landscape',
    role: 'social',
    tier: 'block',
    contentNotes:
      '{ eyebrow? (short note "Trusted by teams ..."), clients:[{name} x4-6] } — wordmark grid on muted band',
  },
  BaselineTestimonials: {
    primary: 0,
    orientation: 'landscape',
    role: 'social',
    tier: 'block',
    contentNotes:
      '{ eyebrow (1-2 words "Customers"), headline (3-8 words), testimonials:[{quote, author, role?, org?} x3] }',
  },
  BaselineCTA: {
    primary: 0,
    orientation: 'landscape',
    role: 'closing',
    tier: 'block',
    contentNotes:
      '{ eyebrow? ("Get started"), headline (3-6 words), accent? (serif italic suffix), body (one sentence), cta:{label,href?}, secondaryCta?:{label,href?} } — inverted dark CTA card with soft accent glow',
  },
  BaselinePageHeader: {
    primary: 0,
    orientation: 'landscape',
    role: 'hero',
    tier: 'block',
    contentNotes:
      '{ eyebrow? (1-2 words — page name), headline (3-8 words), accent? (serif italic fragment), body (one sentence stating page intent) } — internal pages MUST open with this',
  },
  BaselineAboutNarrative: {
    primary: 1,
    orientation: 'landscape',
    role: 'storytelling',
    tier: 'block',
    contentNotes:
      '{ eyebrow ("About <brand>" — REQUIRED), headline (3-7 words, REQUIRED — e.g. "Our mission is to make great work feel inevitable"), accent? (1-3 words rendered as serif italic suffix), body (origin story 2-3 sentences, REQUIRED), pillarEyebrow? ("Core pillars"), pillarHeadline? (one sentence), pillars:[{title (one phrase), body (one sentence)} x3], statsEyebrow?, stats?:[{value:string ("2022","12k+"), label:string} x3] } — ENTIRE About page body; owns its own h1; do NOT pair with BaselinePageHeader.',
  },
  BaselineContact: {
    primary: 0,
    orientation: 'landscape',
    role: 'closing',
    tier: 'block',
    contentNotes:
      '{ eyebrow ("Contact" — REQUIRED), headline (3-7 words, REQUIRED — e.g. "Let\'s build something together"), formTitle? ("Get in touch"), formBody? (one short sentence), details:[{label ("Email"/"Phone"/"Office"), value, href? (mailto: or tel:)} x2-4], recipientEmail (real or placeholder), subjectTemplate? } — ENTIRE Contact page body; owns its own h1; do NOT pair with BaselinePageHeader.',
  },

  PricingTiers: {
    primary: 0,
    orientation: 'landscape',
    role: 'commerce',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline, body?, tiers:[{name, price, period?, description?, features:[string x3-6], featured?:boolean, cta:{label,href?}} x2-3] }',
  },
  FAQAccordion: {
    primary: 0,
    orientation: 'landscape',
    role: 'social',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline, body?, faqs:[{q, a} x4-8] }',
  },
  ContactBlock: {
    primary: 0,
    orientation: 'landscape',
    role: 'closing',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline (1-3 short lines), body, cta:{label, href? (default "mailto:")}, details:[{label, value, href?} x3-5] }',
  },

  // ── Cinematic homepage allowlist (HOME PAGE ONLY) ──────────────────
  // The composer MUST only place these on pages where slug === 'home'.
  // Internal pages stay strictly Baseline-only.
  MessageReveal: {
    primary: 0,
    orientation: 'landscape',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ firstLine (~6 words), accent (1-2 words for rotated badge), secondLine (~6 words), body (one sentence) } — HOME ONLY',
  },
  MarqueeBand: {
    primary: 0,
    orientation: 'landscape',
    role: 'feature',
    tier: 'cinematic',
    contentNotes:
      '{ items:[string x4-8 short phrases], tone:"invert"|"normal" } — HOME ONLY',
  },
  ImageGallery: {
    primary: 0,
    gallery: 9,
    orientation: 'portrait',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline, body?, captions:[{title, year?} x9] } — HOME ONLY, visual brands only',
  },
  HorizontalShowcase: {
    primary: 0,
    gallery: 6,
    orientation: 'portrait',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline (editorial), body (one sentence), cards:[{title, caption?} x6] } — HOME ONLY, visual brands only',
  },
  EditorialQuote: {
    primary: 0,
    orientation: 'landscape',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow? (1-2 words), quote (single sentence, 12-24 words, no quote marks — they are added), attribution (real-feeling name or descriptor), attributionRole? (one-line title) } — HOME ONLY. Single oversized pull-quote on calm background. Use as a quiet beat between two visual sections.',
  },
  AsymmetricGrid: {
    primary: 0,
    gallery: 3,
    orientation: 'portrait',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline (4-7 words editorial), body (one sentence), tiles:[{title? (short label), caption? (one short sentence)} x4 — tile[2] is the text tile, others are image overlays] } — HOME ONLY, visual brands. 4-tile 12-col asymmetric grid (tall + wide + text + square).',
  },
  StickyNarrative: {
    primary: 0,
    gallery: 3,
    orientation: 'landscape',
    role: 'storytelling',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow (1-2 words), headline (4-8 words), chapters:[{title (one phrase), body (2-3 sentences), meta? ("Chapter 01" or year)} x2-3] } — HOME ONLY. Pinned headline column left, image+chapter cards scrolling right. CSS sticky (no scroll-jacking).',
  },

  // ── Alternate cinematic heroes (HOME PAGE ONLY, visual brands) ─────
  HeroCinematic: {
    primary: 1,
    orientation: 'landscape',
    role: 'hero',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow, headline (1-4 words, char-split), subhead (1-2 words), body (1-2 sentences), cta:{label,href?} } — HOME ONLY, replaces BaselineHero on visual brands',
  },
  HeroEditorial: {
    primary: 1,
    orientation: 'landscape',
    role: 'hero',
    tier: 'cinematic',
    contentNotes:
      '{ eyebrow (short uppercase), headline (1-3 words uppercase), body (3-5 short newline-separated lines) } — HOME ONLY, replaces BaselineHero on editorial brands',
  },

  // ── Imported cinematic template families (HOME PAGE ONLY) ──────────
  // All have overflow:hidden + sticky/pin containment. Use sparingly:
  // 1-2 sections from any one family is enough; do NOT chain a whole
  // family together. They are independent inserts.
  ZentryHero: { primary: 1, orientation: 'landscape', role: 'hero', tier: 'cinematic', contentNotes: '{ eyebrow?, headline (2-4 words), subhead?, body, cta:{label,href?} } — HOME ONLY' },
  ZentryAbout: { primary: 1, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ eyebrow, headline (editorial), body } — HOME ONLY' },
  ZentryFeatures: { primary: 0, gallery: 5, orientation: 'landscape', role: 'feature', tier: 'cinematic', contentNotes: '{ eyebrow, headline?, body?, features:[{title, body?} x5] } — HOME ONLY' },
  ZentryStory: { primary: 1, secondary: 1, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ eyebrow, headline (large poetic), body } — HOME ONLY' },
  ZentryContact: { primary: 0, gallery: 3, orientation: 'portrait', role: 'closing', tier: 'cinematic', contentNotes: '{ eyebrow, headline (large CTA), cta:{label,href?} } — HOME ONLY' },
  ZentryFooter: { primary: 0, orientation: 'landscape', role: 'chrome', tier: 'cinematic', contentNotes: '{ brand, links:[{label,href?} x3-4], cta?, legal? } — HOME ONLY' },
  FlowHero: { primary: 0, orientation: 'landscape', role: 'hero', tier: 'cinematic', contentNotes: '{ headline (1 word), eyebrow? as orbit badge, body } — HOME ONLY' },
  FlowEvent: { primary: 0, gallery: 5, orientation: 'portrait', role: 'storytelling', tier: 'cinematic', contentNotes: '{ eyebrow?, headline (1 word), body, cards:[{title,heading?,category?,meta?} x4-5] } — HOME ONLY' },
  FlowWhoWeAre: { primary: 0, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ headline, body, statement? } — HOME ONLY' },
  FlowOnDemand: { primary: 1, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ eyebrow, headline/body (large paragraph), badge? } — HOME ONLY' },
  FlowTutors: { primary: 0, gallery: 4, orientation: 'portrait', role: 'social', tier: 'cinematic', contentNotes: '{ headline, body, people:[{title,role?} x4], stats?:[{value,label?} x4] } — HOME ONLY' },
  FlowWhatWeDo: { primary: 0, gallery: 3, orientation: 'squarish', role: 'feature', tier: 'cinematic', contentNotes: '{ headline, body, cards:[{title} x3] } — HOME ONLY' },
  FlowPartyTools: { primary: 0, orientation: 'landscape', role: 'utility', tier: 'cinematic', contentNotes: '{ headline, body?, items:[{title,href?} x4-6] } — HOME ONLY' },
  FlowFooter: { primary: 0, orientation: 'landscape', role: 'closing', tier: 'cinematic', contentNotes: '{ brand?, headline/giant, cta:{label,href?}, legal? } — HOME ONLY' },
  SpyltHero: { primary: 1, orientation: 'landscape', role: 'hero', tier: 'cinematic', contentNotes: '{ headline, subhead/accent, body, cta:{label,href?} } — HOME ONLY' },
  SpyltMessage: { primary: 0, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ firstLine, accent, secondLine, body } — HOME ONLY' },
  SpyltFlavor: { primary: 0, gallery: 6, orientation: 'squarish', role: 'commerce', tier: 'cinematic', contentNotes: '{ headline, cards:[{title} x4-6], cta:{label,href?} } — HOME ONLY' },
  SpyltNutrition: { primary: 1, orientation: 'landscape', role: 'feature', tier: 'cinematic', contentNotes: '{ headline, accent, body, stats:[{label,value} x3-5] } — HOME ONLY' },
  SpyltBenefit: { primary: 1, orientation: 'landscape', role: 'feature', tier: 'cinematic', contentNotes: '{ eyebrow/body, features:[{title} x4] } — HOME ONLY' },
  SpyltTestimonials: { primary: 0, gallery: 7, orientation: 'portrait', role: 'social', tier: 'cinematic', contentNotes: '{ testimonials:[{author?, quote?} x5-7] } — HOME ONLY' },
  SpyltBottomBanner: { primary: 1, orientation: 'landscape', role: 'closing', tier: 'cinematic', contentNotes: '{ headline, accent/subhead, body, cta:{label,href?} } — HOME ONLY' },
  SpyltFooter: { primary: 1, orientation: 'landscape', role: 'chrome', tier: 'cinematic', contentNotes: '{ brand?, headline/giant, tagline/body?, legal? } — HOME ONLY' },
  TruusVimeoHero: { primary: 1, orientation: 'landscape', role: 'hero', tier: 'cinematic', contentNotes: '{ headline (long editorial sentence) } — HOME ONLY' },
  TruusHorizontalWords: { primary: 0, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ headline/phrase (short sentence), body } — HOME ONLY' },
  TruusMotionCards: { primary: 0, gallery: 4, orientation: 'portrait', role: 'storytelling', tier: 'cinematic', contentNotes: '{ headline, subhead, body, cards:[{title?} x4] } — HOME ONLY' },
  TruusShowreel: { primary: 1, orientation: 'landscape', role: 'storytelling', tier: 'cinematic', contentNotes: '{ headline, subhead/body } — HOME ONLY' },
  TruusServiceCards: { primary: 0, orientation: 'landscape', role: 'feature', tier: 'cinematic', contentNotes: '{ headline, cards:[{title, services:[string x4-7]} x5] } — HOME ONLY' },
  TruusDoubleMarquee: { primary: 0, orientation: 'landscape', role: 'social', tier: 'cinematic', contentNotes: '{ headline, clients:[{name} x6-10] } — HOME ONLY' },
  TruusFooter: { primary: 0, orientation: 'landscape', role: 'chrome', tier: 'cinematic', contentNotes: '{ brand, giant?, tagline/body, columns:[{title,links:[{label,href?}]} x2-4], cta?, legal? } — HOME ONLY' },

  // ── Functional block tier ──────────────────────────────────────────
  ContactForm: {
    primary: 0,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow, headline, body?, fields?:[{name, label, type?:"text"|"email"|"tel"|"select"|"textarea", options?:[string], required?:boolean, placeholder?:string} x3-6] (default name/email/budget/message), submitLabel?, recipientEmail?, subjectTemplate? }',
  },
  NewsletterSignup: {
    primary: 0,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, body?, placeholder?, cta?:{label} }',
  },
  LogoCloud: {
    primary: 0,
    orientation: 'landscape',
    role: 'social',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline? (small note), clients:[{name, feature?:boolean} x6-12] }',
  },
  FeatureList: {
    primary: 0,
    orientation: 'landscape',
    role: 'feature',
    tier: 'block',
    contentNotes:
      '{ eyebrow, headline, body?, features:[{title, body, meta?} x5-10] }',
  },
  MetricRow: {
    primary: 0,
    orientation: 'landscape',
    role: 'app',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline?, metrics:[{value:string, label, delta?, trend?:"up"|"down"|"flat"} x3-4] }',
  },
  DataTable: {
    primary: 0,
    orientation: 'landscape',
    role: 'app',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, body?, columns:[{key, label, align?:"left"|"right"|"center", width?:string}], rows:[Record<string,string> x4-10] }',
  },
  LinkList: {
    primary: 0,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, groups:[{title, links:[{label, description?, href?, meta?} x3-6]} x2-4] }',
  },
  PageHeader: {
    primary: 0,
    orientation: 'landscape',
    role: 'hero',
    tier: 'block',
    contentNotes:
      '{ eyebrow? (1-2 words), headline (1-3 words, never repeats nav label literally), body (one short sentence, sets the page intent) }',
  },
  BlogIndex: {
    primary: 0,
    gallery: 6,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, body?, posts:[{title, excerpt?, date, category?, author?, href?, readingMinutes?} x4-9] }',
  },
  JobsList: {
    primary: 0,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, body?, groups:[{team, jobs:[{role, location?, type?, description?, href?} x2-5]} x2-4] }',
  },
  ChangelogList: {
    primary: 0,
    orientation: 'landscape',
    role: 'utility',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, body?, entries:[{date (YYYY-MM-DD), version?, title, body, tag?:"new"|"fix"|"improvement"|"breaking"} x6-12] }',
  },
  TwoColumnText: {
    primary: 0,
    orientation: 'landscape',
    role: 'storytelling',
    tier: 'block',
    contentNotes:
      '{ eyebrow?, headline, paragraphs:[{heading?, body} x3-6] }',
  },
}
