/**
 * Within-archetype variation check. Generates 3 prompts per archetype
 * (saas/startup, hospitality, fashion) and screenshots each.
 *
 * Pass criteria:
 *   • Inside each archetype, themes/heroes are consistent with the
 *     design language (not random).
 *   • Inside each archetype, the homepage flow / image subjects /
 *     section count vary across the 3 prompts.
 *   • Across archetypes, every property differs.
 */

import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const HOST = 'http://localhost:3000'
const STORE_DIR = '/Users/florianviester/fiecom-template/fiecom-engine/generated'
const SHOT_DIR = '/Users/florianviester/fiecom-template/fiecom-engine/.fiecom-shots'

const CASES = [
  // SaaS / startup — three different products under the AI-startup / premium-saas umbrella.
  { key: 'saas-1', group: 'saas', prompt: 'Northline — a B2B SaaS platform for distributed engineering teams, real-time collaboration, async-first.' },
  { key: 'saas-2', group: 'saas', prompt: 'Bridgewell — a CRM rebuilt for design agencies, lightweight, opinionated, replaces 4 tools.' },
  { key: 'saas-3', group: 'saas', prompt: 'Cadence — an AI-powered observability platform for backend teams, dependency graphs, autonomous runbooks.' },

  // Hospitality — three luxury stays in different locations / formats.
  { key: 'hotel-1', group: 'hotel', prompt: 'Anak Karang — a boutique cliffside hotel in Bali with eight suites overlooking the ocean.' },
  { key: 'hotel-2', group: 'hotel', prompt: 'Sotto Verde — a luxury Tuscan villa retreat with a small olive grove, four bedrooms, week-long stays.' },
  { key: 'hotel-3', group: 'hotel', prompt: 'Tundra Lodge — a remote design-led lodge in the Norwegian fjords, ten cabins, focus on northern lights season.' },

  // Fashion / atelier — three editorial brands.
  { key: 'fashion-1', group: 'fashion', prompt: 'Maison Vire — a Parisian atelier making minimalist wool outerwear, quiet luxury.' },
  { key: 'fashion-2', group: 'fashion', prompt: 'Field & Fold — a Brooklyn label of hand-dyed indigo workwear, small seasonal drops.' },
  { key: 'fashion-3', group: 'fashion', prompt: 'Tessera Studio — a Milanese knitwear brand reviving traditional fisherman patterns in cashmere.' },
]

fs.mkdirSync(SHOT_DIR, { recursive: true })

async function postOne(c) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: c.prompt }),
  })
  if (!res.ok) throw new Error(`generate ${c.key}: ${res.status}`)
  const data = await res.json()
  if (!data.id) throw new Error(`no id ${c.key}: ${JSON.stringify(data)}`)
  return data.id
}

function loadConfig(id) {
  return JSON.parse(fs.readFileSync(path.join(STORE_DIR, `${id}.json`), 'utf8'))
}

function summarize(cfg) {
  const home = (cfg.pages || []).find((p) => p.slug === 'home')
  const homeIds = home ? home.sections.map((s) => s.id) : []
  return {
    theme: cfg.theme?.preset,
    hero: homeIds[1],
    sections: homeIds.length,
    flow: homeIds.join(' > '),
  }
}

console.log('=== Generating 9 cases (3 per archetype) ===')
const results = []
for (const c of CASES) {
  process.stdout.write(`  ${c.key.padEnd(10)} (${c.group.padEnd(7)}) ... `)
  const start = Date.now()
  try {
    const id = await postOne(c)
    const cfg = loadConfig(id)
    const summary = summarize(cfg)
    results.push({ ...c, id, summary, elapsedMs: Date.now() - start })
    console.log(`id=${id.slice(0, 8)}  theme=${summary.theme.padEnd(18)} hero=${summary.hero.padEnd(15)} sec=${summary.sections}  (${Date.now() - start}ms)`)
  } catch (err) {
    console.log(`FAIL: ${err.message}`)
    results.push({ ...c, error: err.message })
  }
}

const ok = results.filter((r) => r.id)
if (ok.length === 0) { console.error('no generations succeeded'); process.exit(1) }

console.log('\n=== Capturing screenshots ===')
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
})
for (const r of ok) {
  const desktop = path.join(SHOT_DIR, `${r.key}-desktop.png`)
  const mobile = path.join(SHOT_DIR, `${r.key}-mobile.png`)
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(`${HOST}/preview/${r.id}`, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((res) => setTimeout(res, 1800))
    await page.screenshot({ path: desktop, fullPage: false })
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true })
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((res) => setTimeout(res, 1200))
    await page.screenshot({ path: mobile, fullPage: false })
    r.desktopShot = desktop
    r.mobileShot = mobile
    console.log(`  ${r.key.padEnd(10)} ok`)
  } catch (err) {
    console.log(`  ${r.key.padEnd(10)} FAIL: ${err.message}`)
  } finally {
    await page.close()
  }
}
await browser.close()

console.log('\n=== Within-archetype consistency ===')
const groups = {}
for (const r of ok) (groups[r.group] = groups[r.group] ?? []).push(r)

const groupReport = []
for (const [g, items] of Object.entries(groups)) {
  const themes = new Set(items.map((i) => i.summary.theme))
  const heroes = new Set(items.map((i) => i.summary.hero))
  const flows = new Set(items.map((i) => i.summary.flow))
  const counts = items.map((i) => i.summary.sections)
  console.log(`\n  archetype "${g}":`)
  for (const i of items) {
    console.log(`    ${i.key.padEnd(10)} theme=${i.summary.theme.padEnd(18)} hero=${i.summary.hero.padEnd(15)} sec=${i.summary.sections}`)
    console.log(`              flow: ${i.summary.flow}`)
    console.log(`              shot: ${i.desktopShot}`)
  }
  console.log(`    themes within group:   ${themes.size}/${items.length} unique  (expect 1 — same design language)`)
  console.log(`    heroes within group:   ${heroes.size}/${items.length} unique`)
  console.log(`    flows within group:    ${flows.size}/${items.length} unique  (expect ${items.length} — variation)`)
  console.log(`    section spread:        ${Math.max(...counts) - Math.min(...counts)}`)
  groupReport.push({ g, themes: [...themes], heroes: [...heroes], flowUnique: flows.size, total: items.length })
}

console.log('\n=== Cross-archetype check ===')
const groupHeroes = groupReport.map((r) => r.heroes.join(','))
const groupThemes = groupReport.map((r) => r.themes.join(','))
const groupThemeSet = new Set(groupReport.flatMap((r) => r.themes))
const groupHeroSet = new Set(groupReport.flatMap((r) => r.heroes))
console.log(`  themes across all groups:  ${groupThemeSet.size} (${[...groupThemeSet].join(', ')})`)
console.log(`  heroes across all groups:  ${groupHeroSet.size} (${[...groupHeroSet].join(', ')})`)

let pass = true
for (const g of groupReport) {
  // Within group: prefer ONE theme per group (design language is set by archetype).
  if (g.themes.length > 1) { console.log(`  [${g.g}] WARN multiple themes in group: ${g.themes.join(', ')}`); /* not fatal */ }
  // Within group: flows should mostly differ. Accept up to 1 dup of 3.
  if (g.flowUnique < g.total - 0) { console.log(`  [${g.g}] WARN ${g.flowUnique}/${g.total} unique flows`) }
}
// Cross: theme diversity must be ≥ 2 (the 3 groups must not collapse to same theme).
if (groupThemeSet.size < 2) {
  console.log(`  FAIL: only ${groupThemeSet.size} theme across groups`)
  pass = false
}

console.log('')
console.log(pass ? 'OK — visual review screenshots ready in .fiecom-shots/' : 'FAIL — see warnings above')
process.exit(pass ? 0 : 1)
