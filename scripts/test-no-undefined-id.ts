// Regression test: applyCinematicSelection (and the rest of
// strengthenGeneratedConfig) must NEVER emit a section without a valid
// `id`, regardless of the prompt-derived seed or industry.
//
// Root cause this test was added for: `seed >> 4` returned a negative
// int for prompts whose hash had the high bit set; `negative % len`
// is negative in JS; `members[-1]` is undefined; undefined was pushed
// into the substitution pool and surfaced as `{ id: undefined }` in
// the saved JSON.
//
// Run: npx tsx scripts/test-no-undefined-id.ts

import { strengthenGeneratedConfig } from '../lib/composition-guard'
import { COMPONENT_REGISTRY, SECTION_META } from '../lib/registry'
import {
  fallbackSitePlan,
  type CinematicDimension,
  type SitePlan,
} from '../lib/site-plan'

interface TestCase {
  prompt: string
  industry: string
  intensity: CinematicDimension
  // Optional: AI-emitted home sections (simulating composer output). If
  // omitted we feed only the four "safe common" cinematic sections so
  // the rotation logic is forced to substitute.
  aiHomeSections?: string[]
}

const COMMON_4 = [
  'BaselineNavbar', 'BaselineHero',
  'MarqueeBand', 'MessageReveal', 'ImageGallery', 'HorizontalShowcase',
  'BaselineCTA', 'BaselineFooter',
]

// Build a plan that forces the bug to surface: high intensity + the
// industry-keyword-matched family path. Across a sweep of prompts the
// promptSeed eventually produces a high-bit value that would have
// triggered the bug.
function makePlan(tc: TestCase): SitePlan {
  const fallback = fallbackSitePlan(tc.prompt)
  return {
    ...fallback,
    industry: tc.industry,
    intent: { ...fallback.intent, cinematicIntensity: tc.intensity },
  }
}

function makeInput(tc: TestCase) {
  const ids = tc.aiHomeSections ?? COMMON_4
  return {
    pages: [
      {
        slug: 'home',
        sections: ids.map((id) => ({ id, content: {}, imageQueries: {} })),
      },
      {
        slug: 'about',
        sections: [
          { id: 'BaselineNavbar', content: {}, imageQueries: {} },
          { id: 'BaselineAboutNarrative', content: {}, imageQueries: {} },
          { id: 'BaselineFooter', content: {}, imageQueries: {} },
        ],
      },
    ],
  }
}

const CASES: TestCase[] = [
  // Hotel — luxury+showcase (the case where the original bug showed up
  // because the brand name hashed to a high-bit seed).
  { prompt: 'luxury boutique hotel in Bali', industry: 'boutique hotel', intensity: 'high' },
  { prompt: 'Bali Serenity Boutique Hotel', industry: 'boutique hotel', intensity: 'high' },
  { prompt: 'boutique resort in the Swiss Alps', industry: 'boutique resort', intensity: 'high' },
  // Brute-force a wider sweep so we cover many seed buckets, especially
  // ones whose top bit is set (where >> would go negative).
  ...Array.from({ length: 32 }, (_, i) => ({
    prompt: `luxury brand sweep ${'x'.repeat(i)}`,
    industry: 'boutique hotel',
    intensity: 'high' as CinematicDimension,
  })),
  // Other families to cover the keyword router branches.
  { prompt: 'avant-garde fashion atelier', industry: 'fashion atelier', intensity: 'high' },
  { prompt: 'artisan cupcake bakery', industry: 'cupcake bakery', intensity: 'moderate' },
  { prompt: 'developer tooling platform', industry: 'developer tool', intensity: 'restrained' },
  { prompt: 'community event collective', industry: 'community event', intensity: 'moderate' },
]

let failed = 0
let passed = 0
let stillCovered = new Set<string>()

for (const tc of CASES) {
  const input = makeInput(tc)
  const plan = makePlan(tc)
  const out = strengthenGeneratedConfig(input as Parameters<typeof strengthenGeneratedConfig>[0], {
    prompt: tc.prompt,
    plan,
  }) as { pages?: Array<{ slug: string; sections?: Array<{ id?: unknown }> }> }

  // Assertions:
  //   1. Every page section has a non-empty string `id`.
  //   2. Every section.id is registered in BOTH COMPONENT_REGISTRY and SECTION_META.
  for (const page of out.pages ?? []) {
    for (const [i, s] of (page.sections ?? []).entries()) {
      const id = (s as { id?: unknown }).id
      if (typeof id !== 'string' || id.length === 0) {
        console.error(`  FAIL: ${tc.prompt} page=${page.slug} section[${i}].id is ${JSON.stringify(id)}`)
        failed++
        continue
      }
      if (!(id in COMPONENT_REGISTRY)) {
        console.error(`  FAIL: ${tc.prompt} page=${page.slug} section[${i}].id="${id}" not in COMPONENT_REGISTRY`)
        failed++
        continue
      }
      if (!(id in SECTION_META)) {
        console.error(`  FAIL: ${tc.prompt} page=${page.slug} section[${i}].id="${id}" not in SECTION_META`)
        failed++
        continue
      }
      passed++
      stillCovered.add(id)
    }
  }
}

console.log(`\n${passed} section ids passed validation across ${CASES.length} prompts.`)
console.log(`${stillCovered.size} distinct ids appeared across the sweep.`)
if (failed > 0) {
  console.error(`\nREGRESSION: ${failed} sections had invalid ids.`)
  process.exit(1)
}
console.log(`\nOK: no { id: undefined } or unregistered ids escaped the guard.`)
