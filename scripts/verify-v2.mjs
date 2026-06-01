/**
 * Fiecom V2 verification. Generate 5 sites (one per archetype that the
 * user asked to see), capture desktop + mobile screenshots, and report
 * per-site design-system summary.
 */

import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const HOST = 'http://localhost:3000'
const STORE_DIR = '/Users/florianviester/fiecom-template/fiecom-engine/generated'
const SHOT_DIR = '/Users/florianviester/fiecom-template/fiecom-engine/.fiecom-shots'

const CASES = [
  { key: 'v2-saas',         prompt: 'A B2B SaaS platform called Northline for distributed engineering teams. Real-time collaboration, async-first.' },
  { key: 'v2-fashion',      prompt: 'Maison Vire — a Parisian atelier making minimalist wool outerwear, quiet luxury.' },
  { key: 'v2-hospitality',  prompt: 'Anak Karang — a boutique cliffside hotel in Bali with eight suites overlooking the ocean.' },
  { key: 'v2-restaurant',   prompt: 'Forma — a neighborhood Italian restaurant in Brooklyn with a chef-led seasonal menu and a wood oven.' },
  { key: 'v2-studio',       prompt: 'Kindred — a creative design studio specializing in brand identity and motion design.' },
]

fs.mkdirSync(SHOT_DIR, { recursive: true })

async function post(c) {
  const r = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: c.prompt }),
  })
  if (!r.ok) throw new Error(`generate ${c.key}: ${r.status}`)
  const d = await r.json()
  if (!d.id) throw new Error(`no id ${c.key}: ${JSON.stringify(d)}`)
  return d.id
}

function loadConfig(id) {
  return JSON.parse(fs.readFileSync(path.join(STORE_DIR, `${id}.json`), 'utf8'))
}

function summarize(cfg) {
  const ds = cfg.designSystem ?? {}
  const home = (cfg.pages || []).find((p) => p.slug === 'home')
  const homeIds = home ? home.sections.map((s) => s.id) : []
  return {
    ambition: cfg.brief?.visualAmbition,
    archetype: cfg.brief?.archetype,
    palette: ds?.colors?.mode ? `${ds.colors.mode}(${ds.colors.bg}/${ds.colors.ink}/${ds.colors.accent})` : 'n/a',
    display: ds?.typography?.display?.family,
    body: ds?.typography?.body?.family,
    voice: ds?.typography?.voice,
    motion: ds?.motion?.level,
    cinematicBudget: ds?.motion?.cinematicBudget,
    treatment: ds?.image?.heroTreatment,
    homeSections: homeIds.length,
    hero: homeIds[1],
    flow: homeIds.join(' > '),
  }
}

console.log('=== Generating 5 V2 cases ===')
const ok = []
for (const c of CASES) {
  process.stdout.write(`  ${c.key.padEnd(18)} ... `)
  const start = Date.now()
  try {
    const id = await post(c)
    const cfg = loadConfig(id)
    const s = summarize(cfg)
    ok.push({ ...c, id, cfg, summary: s })
    console.log(`id=${id.slice(0, 8)} archetype=${s.archetype} ambition=${s.ambition} hero=${s.hero} sec=${s.homeSections}  (${Date.now() - start}ms)`)
  } catch (err) {
    console.log(`FAIL: ${err.message}`)
  }
}

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
    console.log(`  ${r.key.padEnd(18)} ok`)
  } catch (err) {
    console.log(`  ${r.key.padEnd(18)} FAIL: ${err.message}`)
  } finally {
    await page.close()
  }
}
await browser.close()

console.log('\n=== Cross-case differentiation ===')
const themes = new Set(ok.map((r) => r.summary.palette))
const heroes = new Set(ok.map((r) => r.summary.hero))
const flows = new Set(ok.map((r) => r.summary.flow))
const voices = new Set(ok.map((r) => r.summary.voice))
const ambitions = new Set(ok.map((r) => r.summary.ambition))
console.log(`unique palettes:    ${themes.size} / ${ok.length}`)
console.log(`unique heroes:      ${heroes.size} / ${ok.length}`)
console.log(`unique typography:  ${voices.size} / ${ok.length}`)
console.log(`unique ambitions:   ${ambitions.size} / ${ok.length}`)
console.log(`unique flows:       ${flows.size} / ${ok.length}`)

console.log('\n=== Per-case design summary ===')
for (const r of ok) {
  const s = r.summary
  console.log(`  ${r.key.padEnd(18)} archetype=${s.archetype}  ambition=${s.ambition}`)
  console.log(`                    palette=${s.palette}`)
  console.log(`                    typo=${s.display}/${s.body} voice=${s.voice}`)
  console.log(`                    motion=${s.motion} budget=${s.cinematicBudget} treatment=${s.treatment}`)
  console.log(`                    hero=${s.hero}`)
  console.log(`                    flow: ${s.flow}`)
  console.log(`                    shot: ${r.desktopShot}`)
}

console.log('')
console.log(themes.size >= 4 && heroes.size >= 3 && voices.size >= 3
  ? 'PASS — sites diverge across palette, hero, and typography.'
  : 'WARN — differentiation below target')
