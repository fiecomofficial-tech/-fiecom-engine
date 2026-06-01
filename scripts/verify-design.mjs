/**
 * Design director end-to-end verification.
 *
 * Steps:
 *   1. POST 5 prompts to the running dev server (must be on :3000).
 *   2. For each preview, fetch the saved config + the rendered HTML.
 *   3. Capture a 1440x900 desktop screenshot of the homepage AND a
 *      390x844 mobile screenshot. Save under /tmp/fiecom-shots/.
 *   4. Print a per-case report: archetype-driven choices visible in
 *      the saved config + visual differences across cases.
 *
 * Requires:
 *   • dev server already running on http://localhost:3000
 *   • puppeteer-core + system Chrome at /Applications/Google Chrome.app
 */

import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const HOST = 'http://localhost:3000'
const STORE_DIR = '/Users/florianviester/fiecom-template/fiecom-engine/generated'
const SHOT_DIR = '/tmp/fiecom-shots'

const CASES = [
  { key: 'base44-saas',     prompt: 'A B2B SaaS platform called Northline for distributed engineering teams. Real-time collaboration, async-first.' },
  { key: 'lovable-startup', prompt: 'A new AI-powered website builder called Vapor that lets non-developers ship modern marketing sites in minutes.' },
  { key: 'fashion',         prompt: 'A small fashion atelier called Maison Vire making minimalist wool outerwear in Paris. Editorial, quiet luxury.' },
  { key: 'hospitality',     prompt: 'A boutique cliffside hotel in Bali called Anak Karang with eight suites overlooking the ocean.' },
  { key: 'restaurant',      prompt: 'A neighborhood Italian restaurant in Brooklyn called Forma with a chef-led seasonal menu and a wood oven.' },
]

fs.mkdirSync(SHOT_DIR, { recursive: true })

async function postOne(c) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: c.prompt }),
  })
  if (!res.ok) throw new Error(`generate failed for ${c.key}: ${res.status}`)
  const data = await res.json()
  if (!data.id) throw new Error(`no id for ${c.key}: ${JSON.stringify(data)}`)
  return data.id
}

function loadConfig(id) {
  const file = path.join(STORE_DIR, `${id}.json`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function summarize(cfg) {
  const home = (cfg.pages || []).find((p) => p.slug === 'home')
  const homeIds = home ? home.sections.map((s) => s.id) : []
  const heroId = homeIds[1] // after navbar
  const families = new Set()
  for (const id of homeIds) {
    if (id.startsWith('Baseline')) families.add('baseline')
    else if (id.startsWith('Spylt')) families.add('spylt')
    else if (id.startsWith('Truus')) families.add('truus')
    else if (id.startsWith('Flow')) families.add('flow')
    else if (id.startsWith('Zentry')) families.add('zentry')
    else if (id.startsWith('Hero')) families.add('alt-hero')
    else families.add(id) // cinematic singletons (MessageReveal, ImageGallery, etc.)
  }
  let totalImages = 0
  for (const p of cfg.pages || []) {
    for (const s of p.sections) {
      const im = s.images || {}
      if (im.primary?.url) totalImages++
      if (im.secondary?.url) totalImages++
      if (Array.isArray(im.gallery)) totalImages += im.gallery.filter((g) => g?.url).length
    }
  }
  return {
    theme: cfg.theme?.preset,
    homeSections: homeIds.length,
    heroId,
    homeFlow: homeIds.join(' > '),
    families: [...families],
    totalImages,
    pages: (cfg.pages || []).map((p) => p.slug),
  }
}

console.log('=== Generating 5 cases ===')
const results = []
for (const c of CASES) {
  process.stdout.write(`  ${c.key.padEnd(18)} ... `)
  const start = Date.now()
  try {
    const id = await postOne(c)
    const cfg = loadConfig(id)
    const summary = summarize(cfg)
    results.push({ ...c, id, cfg, summary, elapsedMs: Date.now() - start })
    console.log(`id=${id}  theme=${summary.theme}  hero=${summary.heroId}  sections=${summary.homeSections}  (${Date.now() - start}ms)`)
  } catch (err) {
    console.log(`FAILED: ${err.message}`)
    results.push({ ...c, error: err.message })
  }
}

const successful = results.filter((r) => r.id)
if (successful.length === 0) {
  console.error('No generations succeeded.')
  process.exit(1)
}

console.log('\n=== Capturing screenshots ===')
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
})
for (const r of successful) {
  const url = `${HOST}/preview/${r.id}`
  const desktop = path.join(SHOT_DIR, `${r.key}-desktop.png`)
  const mobile = path.join(SHOT_DIR, `${r.key}-mobile.png`)
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    // Give animations + images a moment to settle.
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: desktop, fullPage: false })

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true })
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1000))
    await page.screenshot({ path: mobile, fullPage: false })
    r.desktopShot = desktop
    r.mobileShot = mobile
    console.log(`  ${r.key.padEnd(18)} desktop=${desktop}  mobile=${mobile}`)
  } catch (err) {
    console.log(`  ${r.key.padEnd(18)} screenshot FAILED: ${err.message}`)
  } finally {
    await page.close()
  }
}
await browser.close()

console.log('\n=== Cross-case differentiation report ===')
const themeSet = new Set(successful.map((r) => r.summary.theme))
const heroSet = new Set(successful.map((r) => r.summary.heroId))
const flowSet = new Set(successful.map((r) => r.summary.homeFlow))
const sectionCountSpread = (() => {
  const ns = successful.map((r) => r.summary.homeSections)
  return Math.max(...ns) - Math.min(...ns)
})()
const familyVariety = successful.reduce((acc, r) => {
  for (const f of r.summary.families) acc.add(f)
  return acc
}, new Set())

console.log(`unique themes:           ${themeSet.size} (${[...themeSet].join(', ')})`)
console.log(`unique heroes:           ${heroSet.size} (${[...heroSet].join(', ')})`)
console.log(`unique homepage flows:   ${flowSet.size} of ${successful.length}`)
console.log(`section count spread:    ${sectionCountSpread} sections`)
console.log(`family diversity:        ${familyVariety.size} families across all cases`)

console.log('\n=== Per-case homepage flow ===')
for (const r of successful) {
  console.log(`  ${r.key.padEnd(18)} (${r.summary.theme}) — ${r.summary.homeFlow}`)
}

const allDifferent =
  themeSet.size >= 3 &&
  heroSet.size >= 2 &&
  flowSet.size === successful.length &&
  sectionCountSpread >= 2

console.log('')
if (allDifferent) {
  console.log('PASS — cases differ visibly in theme, hero, flow, and section count.')
  process.exit(0)
} else {
  console.log('WARN — differentiation is below target:')
  if (themeSet.size < 3) console.log(`  themes only ${themeSet.size} (target >= 3)`)
  if (heroSet.size < 2) console.log(`  heroes only ${heroSet.size} (target >= 2)`)
  if (flowSet.size !== successful.length) console.log(`  some flows repeat (${flowSet.size} unique of ${successful.length})`)
  if (sectionCountSpread < 2) console.log(`  section count spread only ${sectionCountSpread} (target >= 2)`)
  process.exit(2)
}
