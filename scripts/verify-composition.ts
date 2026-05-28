// Verification of the Fiecom-template-first generation contract.
// Run: npx tsx scripts/verify-composition.ts
import { strengthenGeneratedConfig } from '../lib/composition-guard'
import type {
  CinematicDimension,
  DensityDimension,
  EnergyDimension,
  PagePacing,
  PagePlan,
  SitePlan,
} from '../lib/site-plan'

type Section = {
  id: string
  content?: Record<string, unknown>
  imageQueries?: { primary?: string; secondary?: string; gallery?: string[] }
}

type Page = { slug: string; title?: string; sections: Section[] }

const issues: string[] = []

function check(cond: boolean, msg: string) {
  if (!cond) issues.push(msg)
}

function makePlan(opts: {
  brand: string
  industry: string
  energy?: EnergyDimension
  density?: DensityDimension
  cinematicIntensity: CinematicDimension
  pages?: Array<{ slug: string; title: string; pacing?: PagePacing; sectionCount?: number }>
}): SitePlan {
  const pages: PagePlan[] = (opts.pages ?? [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About' },
    { slug: 'contact', title: 'Contact' },
  ]).map((p) => ({
    slug: p.slug,
    title: p.title,
    purpose: 'test',
    storyBeat: 'test',
    pacing: p.pacing ?? (p.slug === 'home' ? 'balanced' : 'tight'),
    sectionCount: p.sectionCount ?? (p.slug === 'home' ? 8 : 4),
  }))

  return {
    brand: opts.brand,
    industry: opts.industry,
    intent: {
      energy: opts.energy ?? 'editorial',
      density: opts.density ?? 'balanced',
      cinematicIntensity: opts.cinematicIntensity,
      motionIntensity: 'subtle',
      copyTone: 'test',
      themeHint: 'editorial-cream',
    },
    storyArc: 'test',
    pages,
    navOrder: pages.map((p) => p.title),
  }
}

const noisyComposerOutput = {
  theme: { preset: 'editorial-cream' },
  pages: [
    {
      slug: 'home',
      sections: [
        { id: 'StickyNavbar', content: {} },
        { id: 'HeroCinematic', content: { headline: 'Old hero', subhead: 'drama' }, imageQueries: { primary: 'old cinematic hero' } },
        { id: 'StatsCounter', content: {} },
        { id: 'FeatureBento', content: {} },
        { id: 'MessageReveal', content: { firstLine: 'A sharper story', accent: 'now', secondLine: 'built on the baseline' } },
        { id: 'BaselineFeatures', content: { headline: 'Composer features', features: [{ title: 'One', body: 'First' }, { title: 'Two', body: 'Second' }, { title: 'Three', body: 'Third' }] } },
        { id: 'HorizontalShowcase', content: { headline: 'Showcase', cards: [{ title: 'A' }, { title: 'B' }] }, imageQueries: { gallery: ['gallery one', 'gallery two'] } },
        { id: 'ImageGallery', content: { headline: 'Gallery' }, imageQueries: { gallery: ['image one', 'image two'] } },
        { id: 'ClosingCTA', content: {} },
        { id: 'FooterRich', content: {} },
      ],
    },
    {
      slug: 'about',
      sections: [
        { id: 'StickyNavbar', content: {} },
        { id: 'HeroEditorial', content: { headline: 'Old internal hero' } },
        { id: 'ImageGallery', content: {} },
        { id: 'BaselineAboutNarrative', content: { body: 'About body', pillars: [{ title: 'Care', body: 'Detail' }] } },
        { id: 'FooterRich', content: {} },
      ],
    },
    {
      slug: 'contact',
      sections: [
        { id: 'PageHeader', content: { headline: 'Contact' } },
        { id: 'ContactForm', content: {} },
      ],
    },
  ],
}

const BASELINE_HOME = [
  'BaselineNavbar',
  'BaselineHero',
  'BaselineLogoBar',
  'BaselineFeatures',
  'BaselineTestimonials',
  'BaselineCTA',
  'BaselineFooter',
]

const EXPECTED_HOME: Record<CinematicDimension, string[]> = {
  restrained: BASELINE_HOME,
  moderate: BASELINE_HOME,
  high: BASELINE_HOME,
  extreme: BASELINE_HOME,
}

function ids(page?: Page): string[] {
  return page?.sections.map((s) => s.id) ?? []
}

function assertSame(label: string, actual: string[], expected: string[]) {
  check(
    actual.join('|') === expected.join('|'),
    `${label}: expected ${expected.join(' > ')}, got ${actual.join(' > ')}`,
  )
}

console.log('# Fiecom template homepage contract')
for (const cinematicIntensity of Object.keys(EXPECTED_HOME) as CinematicDimension[]) {
  const plan = makePlan({
    brand: 'Fiecom',
    industry: 'website system',
    cinematicIntensity,
  })
  const cleaned = strengthenGeneratedConfig(noisyComposerOutput, { prompt: cinematicIntensity, plan }) as { pages: Page[] }
  const home = cleaned.pages.find((p) => p.slug === 'home')
  const homeIds = ids(home)

  assertSame(cinematicIntensity, homeIds, EXPECTED_HOME[cinematicIntensity])
  check(!homeIds.includes('HeroCinematic'), `${cinematicIntensity}: old cinematic hero leaked into home`)
  check(!homeIds.includes('ClosingCTA'), `${cinematicIntensity}: old closing CTA leaked into home`)
  check(!homeIds.includes('StickyNavbar'), `${cinematicIntensity}: old nav leaked into home`)
  check(!homeIds.includes('FooterRich'), `${cinematicIntensity}: old footer leaked into home`)

  console.log(`  ${cinematicIntensity.padEnd(10)} ${homeIds.join(' > ')}`)
}

console.log('\n# Internal page contract')
const internalPlan = makePlan({
  brand: 'Fiecom',
  industry: 'website system',
  cinematicIntensity: 'extreme',
  pages: [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About' },
    { slug: 'pricing', title: 'Pricing' },
    { slug: 'work', title: 'Work' },
    { slug: 'contact', title: 'Contact' },
  ],
})
const cleanedInternal = strengthenGeneratedConfig(noisyComposerOutput, {
  prompt: 'internal pages',
  plan: internalPlan,
}) as { pages: Page[] }

const expectedInternal: Record<string, string[]> = {
  about: ['BaselineNavbar', 'BaselinePageHeader', 'BaselineAboutNarrative', 'BaselineFooter'],
  pricing: ['BaselineNavbar', 'BaselinePageHeader', 'PricingTiers', 'FAQAccordion', 'BaselineFooter'],
  work: ['BaselineNavbar', 'BaselinePageHeader', 'TwoColumnText', 'LinkList', 'BaselineFooter'],
  contact: ['BaselineNavbar', 'BaselinePageHeader', 'BaselineContact', 'BaselineFooter'],
}

for (const [slug, expected] of Object.entries(expectedInternal)) {
  const page = cleanedInternal.pages.find((p) => p.slug === slug)
  const pageIds = ids(page)
  assertSame(slug, pageIds, expected)
  check(!pageIds.some((id) => ['HeroCinematic', 'HeroEditorial', 'MessageReveal', 'ImageGallery', 'HorizontalShowcase', 'MarqueeBand'].includes(id)), `${slug}: cinematic section leaked into internal page`)
  console.log(`  ${slug.padEnd(8)} ${pageIds.join(' > ')}`)
}

console.log('\n# Missing page scaffold')
check(
  cleanedInternal.pages.some((p) => p.slug === 'pricing') &&
    cleanedInternal.pages.some((p) => p.slug === 'work'),
  'planned internal pages were not scaffolded',
)

if (issues.length === 0) {
  console.log('\nOK: Fiecom template composition contract holds.')
} else {
  console.log(`\nFAIL: ${issues.length} hard issues`)
  for (const issue of issues) console.log(`  - ${issue}`)
  process.exit(1)
}
