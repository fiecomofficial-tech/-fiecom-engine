import OpenAI from 'openai'
import type { ResolvedConfig } from './orchestrate-assets'
import type { EditOp } from './patches'
import { SECTION_META, type ComponentId } from './registry'
import { THEME_KEYS } from './themes'
import { safeParseJSON, dumpFailure } from './json-safe'
import { safeHeaderValue } from './safe-headers'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  ? safeHeaderValue(process.env.OPENAI_API_KEY)
  : undefined
const client = new OpenAI({ apiKey: OPENAI_API_KEY })
const MODEL = process.env.OPENAI_EDIT_MODEL ?? 'gpt-4.1-nano'
const MAX_TOKENS = Number(process.env.OPENAI_EDIT_MAX_TOKENS ?? 2500)
const BASE44_COMPONENT_IDS: ComponentId[] = [
  'BaselineNavbar',
  'BaselineHero',
  'BaselineLogoBar',
  'BaselineFeatures',
  'BaselineTestimonials',
  'BaselineCTA',
  'BaselinePageHeader',
  'BaselineAboutNarrative',
  'BaselineContact',
  'FeatureList',
  'PricingTiers',
  'FAQAccordion',
  'ContactBlock',
  'ContactForm',
  'NewsletterSignup',
  'LinkList',
  'BlogIndex',
  'JobsList',
  'ChangelogList',
  'TwoColumnText',
]

const REGISTRY_DOC = buildRegistryDoc()

export interface EditResult {
  operations: EditOp[]
  summary: string
}

function buildRegistryDoc(): string {
  const grouped: Record<string, Record<string, string[]>> = { cinematic: {}, block: {} }
  for (const id of BASE44_COMPONENT_IDS) {
    const m = SECTION_META[id]
    const t = (grouped[m.tier] = grouped[m.tier] ?? {})
    ;(t[m.role] = t[m.role] ?? []).push(`  ${id} → ${m.contentNotes}`)
  }
  const tierDoc = (label: string, key: 'cinematic' | 'block') =>
    [
      `=== ${label} ===`,
      ...Object.entries(grouped[key]).map(([role, lines]) => `[${role.toUpperCase()}]\n${lines.join('\n')}`),
    ].join('\n\n')
  return tierDoc('FIECOM TEMPLATE BLOCKS', 'block')
}

function buildSystemPrompt(): string {
  return `You are the EDIT model for an AI website builder. The user gives an
instruction in natural language about an existing generated site; you
emit a minimal sequence of structured patch operations that mutate the
existing config IN PLACE.

DO NOT regenerate the whole site. Emit only the operations needed.

═════════════════════════════════════════════════════════════════════════
SECTION REGISTRY (use ids verbatim — match content shape exactly)
═════════════════════════════════════════════════════════════════════════
${REGISTRY_DOC}

Keep the Fiecom template structure intact. Do not add cinematic heroes,
alternate nav/footer systems, imported template families, fullscreen
media, parallax sections, video sections, or new layout systems.
Internal pages stay clean and utility-focused.

═════════════════════════════════════════════════════════════════════════
AVAILABLE THEME PRESETS
═════════════════════════════════════════════════════════════════════════
${THEME_KEYS.map((k) => `  "${k}"`).join('\n')}

═════════════════════════════════════════════════════════════════════════
OPERATION TYPES (this is the COMPLETE op vocabulary)
═════════════════════════════════════════════════════════════════════════

  set_theme         { value: { preset?, accent?, bg?, ink?, bgAccent?, fontDisplay?, fontBody? } }
  add_page          { value: { slug, title?, sections: [Section] }, after?: <existing slug> }
  remove_page       { page: <slug> }
  rename_page       { page: <slug>, slug: <new slug>, title? }

  add_section       { page, value: Section, at?: number, after?: <existing id on page> }
  remove_section    { page, at?: number, id?: string }   // at OR id (first match)
  move_section      { page, from: number, to: number }
  replace_section   { page, at: number, value: Section } // swap component id + content
  update_content    { page, at: number, path: "tiers.1.price", value: ... }
  update_image      { page, at: number, slot: "primary"|"secondary"|"gallery", index?: number, value: "<pexels query>" }

Where Section = { id: <ComponentId>, content: {...}, imageQueries?: { primary?, secondary?, gallery?:[] } }

═════════════════════════════════════════════════════════════════════════
INDEX RULES (IMPORTANT — operations are applied SEQUENTIALLY)
═════════════════════════════════════════════════════════════════════════
  • "at"/"from"/"to" indices are 0-based positions in the page's sections
    array as it exists AT THE MOMENT the op runs.
  • If you emit multiple removals on the same page, emit them in
    descending order of "at" so earlier indices stay valid.
  • If you add a section, prefer "at" over "after" when you want
    precise placement.

═════════════════════════════════════════════════════════════════════════
EDIT GUIDANCE
═════════════════════════════════════════════════════════════════════════
  • Prefer the smallest set of ops that satisfies the instruction.
  • Never regenerate unchanged pages or sections.
  • Text edits → update_content with a dot-path.
  • Add/remove a section → add_section / remove_section.
  • "Make it darker" → set_theme with a dark preset.
  • "Add a careers page" → add_page with BaselineNavbar + BaselinePageHeader + JobsList + BaselineFooter.
  • "Add a Pricing page link to the nav" → update_content on the
    BaselineNavbar section: path "links.<N>" with a {label, href:"/pricing"} value.
  • When adding new sections that need images, INCLUDE imageQueries
    (2-5 word Pexels search terms).
  • If a request needs a new page slug not currently in the site, make
    sure ALL existing BaselineNavbar sections (every page) gain the link.

═════════════════════════════════════════════════════════════════════════
OUTPUT
═════════════════════════════════════════════════════════════════════════
JSON: { operations: [...], summary: "<one short sentence for the chat UI>" }
`
}

const OP_SCHEMA = {
  type: 'object',
  additionalProperties: true,
  required: ['op'],
  properties: { op: { type: 'string' } },
} as const

const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['operations', 'summary'],
  properties: {
    operations: {
      type: 'array',
      minItems: 0,
      maxItems: 40,
      items: OP_SCHEMA,
    },
    summary: { type: 'string' },
  },
} as const

export async function generateEdit(args: {
  instruction: string
  config: ResolvedConfig
}): Promise<EditResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  const userMessage = [
    `User instruction:\n${args.instruction}`,
    '',
    `Current config (resolved — images already hold URLs, do not change those unless asked):`,
    JSON.stringify(stripImageUrls(args.config)),
  ].join('\n')

  const attempts: Array<{ label: string; extra?: string }> = [
    { label: 'primary' },
    {
      label: 'minimal',
      extra:
        '\n\nPREVIOUS ATTEMPT FAILED — output was truncated or invalid.\n' +
        'EMIT THE FEWEST OPS POSSIBLE:\n' +
        '  • Maximum 10 operations total.\n' +
        '  • No multi-line strings in op values.\n' +
        '  • Keep summary under 120 chars.',
    },
  ]

  let lastRaw = ''
  let lastError = ''
  for (const attempt of attempts) {
    const system = buildSystemPrompt() + (attempt.extra ?? '')
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: attempt.label === 'minimal' ? 0.2 : 0.4,
      max_tokens: attempt.label === 'minimal' ? Math.min(MAX_TOKENS, 1400) : MAX_TOKENS,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'edit_result', strict: false, schema: RESULT_SCHEMA },
      },
    })

    const raw = response.choices[0]?.message?.content ?? ''
    lastRaw = raw
    if (!raw) {
      lastError = 'empty response'
      continue
    }

    const parsed = safeParseJSON<EditResult>(raw)
    if (!parsed.ok || !parsed.value) {
      lastError = `parse failed: ${parsed.error}`
      console.warn(`[fiecom/edit] attempt=${attempt.label} ${lastError} (raw ${raw.length} chars)`)
      continue
    }
    if (parsed.repaired) {
      console.warn(`[fiecom/edit] attempt=${attempt.label} repaired truncated JSON (raw ${raw.length} chars)`)
    }
    const value = parsed.value
    if (!Array.isArray(value.operations)) {
      lastError = 'operations is not an array'
      continue
    }
    return {
      operations: value.operations,
      summary: typeof value.summary === 'string' ? value.summary : 'Applied edits.',
    }
  }

  const dumped = dumpFailure('edit', lastRaw)
  console.error(`[fiecom/edit] all attempts failed (${lastError}); raw saved to ${dumped}`)
  throw new Error(`Edit failed: ${lastError}. Raw response saved to ${dumped}`)
}

/**
 * Replace resolved image URLs with short placeholders before sending to
 * the model — saves tokens and keeps the model focused on content/ops.
 */
function stripImageUrls(config: ResolvedConfig): ResolvedConfig {
  return {
    ...config,
    pages: config.pages.map((p) => ({
      ...p,
      sections: p.sections.map((s, i) => {
        if (!s.images) return { ...s, _index: i } as never
        const placeholder = (n: number) => `<image-${n}>`
        const images: typeof s.images = {}
        if (s.images.primary) images.primary = { ...s.images.primary, url: placeholder(1) }
        if (s.images.secondary) images.secondary = { ...s.images.secondary, url: placeholder(2) }
        if (s.images.gallery) {
          images.gallery = s.images.gallery.map((g, gi) => ({ ...g, url: placeholder(100 + gi) }))
        }
        return { ...s, images, _index: i } as never
      }),
    })),
  }
}
