#!/usr/bin/env node
// Smoke test for lib/json-safe + lib/validate. Run with:
//   npx tsx scripts/test-json-safe.mjs
// Exits non-zero on any failed expectation.

import { safeParseJSON } from '../lib/json-safe.ts'
import { validateGeneratedConfig } from '../lib/validate.ts'

let failed = 0
function check(label, cond, detail) {
  const ok = !!cond
  console.log(`${ok ? '✓' : '✗'}  ${label}${detail ? '   ' + detail : ''}`)
  if (!ok) failed++
}

// 1) Well-formed
{
  const raw = '{"theme":{"preset":"editorial-cream"},"pages":[{"slug":"home","sections":[{"id":"HeroEditorial","content":{"headline":"Hi"}}]}]}'
  const r = safeParseJSON(raw)
  check('parse: well-formed', r.ok && !r.repaired)
  const v = validateGeneratedConfig(r.value)
  check('validate: well-formed', v.renderable && v.value.pages.length === 1)
}

// 2) Fenced
{
  const raw = '```json\n{"theme":{"preset":"warm-sand"},"pages":[{"slug":"home","sections":[{"id":"HeroEditorial","content":{}}]}]}\n```'
  const r = safeParseJSON(raw)
  check('parse: ```json fence stripped', r.ok && !r.repaired && r.value.theme.preset === 'warm-sand')
}

// 3) Prose prefix
{
  const raw = 'Here is the config:\n{"pages":[{"slug":"home","sections":[{"id":"HeroEditorial","content":{}}]}]}'
  const r = safeParseJSON(raw)
  check('parse: prose prefix stripped', r.ok && r.value.pages?.length === 1)
}

// 4) Truncated mid-string deep inside a nested section
{
  const truncated =
    '{"theme":{"preset":"editorial-cream"},"pages":[' +
    '{"slug":"home","sections":[' +
    '{"id":"HeroEditorial","content":{"headline":"Done","body":"Complete sentence."}},' +
    '{"id":"FAQAccordion","content":{"headline":"FAQ","faqs":[{"q":"Q1?","a":"A1."},{"q":"Q2?","a":"Truncated answ'
  const r = safeParseJSON(truncated)
  check('parse: truncated mid-string repaired', r.ok && r.repaired)
  const v = validateGeneratedConfig(r.value)
  check('validate: repaired keeps at least the hero', v.renderable && v.value.pages?.[0]?.sections?.length >= 1, `sections=${v.value.pages?.[0]?.sections?.length}`)
}

// 5) Truncated between two pages (entire later page is partial)
{
  const truncated =
    '{"theme":{"preset":"warm-sand"},"pages":[' +
    '{"slug":"home","sections":[{"id":"HeroEditorial","content":{}}]},' +
    '{"slug":"work","sections":[{"id":"PageHeader","content":'
  const r = safeParseJSON(truncated)
  check('parse: truncated mid-second-page repaired', r.ok && r.repaired)
  const v = validateGeneratedConfig(r.value)
  check('validate: keeps the first page', v.renderable && v.value.pages?.length >= 1)
}

// 6) Validator drops invalid section id
{
  const v = validateGeneratedConfig({
    theme: { preset: 'editorial-cream' },
    pages: [
      {
        slug: 'home',
        sections: [
          { id: 'HeroEditorial', content: { headline: 'OK' } },
          { id: 'ThisDoesNotExist', content: { headline: 'Drop me' } },
          { id: 'FooterRich', content: { brand: 'Studio' } },
        ],
      },
    ],
  })
  check(
    'validate: unknown id dropped',
    v.renderable && v.value.pages[0].sections.length === 2,
    `kept ${v.value.pages[0].sections.length} sections`,
  )
}

// 7) Validator clips oversized arrays and strings
{
  const longStr = 'x'.repeat(5000)
  const features = Array.from({ length: 80 }, (_, i) => ({ title: 't' + i, body: 'b' + i }))
  const v = validateGeneratedConfig({
    pages: [
      {
        slug: 'home',
        sections: [
          {
            id: 'FeatureBento',
            content: { headline: longStr, features },
          },
        ],
      },
    ],
  })
  const section = v.value.pages[0].sections[0]
  check('validate: string clipped', section.content.headline.length <= 1201)
  check('validate: array clipped', section.content.features.length <= 30, `got ${section.content.features.length}`)
}

// 8) Legacy single-page shape upgraded to pages[]
{
  const v = validateGeneratedConfig({
    sections: [{ id: 'HeroEditorial', content: {} }],
  })
  check('validate: legacy {sections} → wrapped as home', v.renderable && v.value.pages?.[0]?.slug === 'home')
}

// 9) Completely broken input
{
  const r = safeParseJSON('not json at all')
  check('parse: nonsense returns ok:false', !r.ok)
}

console.log('')
if (failed === 0) {
  console.log('All checks passed.')
  process.exit(0)
} else {
  console.log(`${failed} check(s) FAILED.`)
  process.exit(1)
}
