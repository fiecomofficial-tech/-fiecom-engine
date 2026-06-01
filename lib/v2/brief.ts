/**
 * Stage 1 — extract the design brief from a raw prompt.
 *
 * Strategy:
 *   • Try an AI call (structured JSON output, GPT-4.1-mini).
 *   • If the AI fails or returns garbage, fall back to a deterministic
 *     keyword classifier so the pipeline always produces a usable brief.
 *   • The brief is the SINGLE INPUT to every downstream stage — keep it
 *     small, opinionated, and free of nullables. Downstream code should
 *     never branch on "did the AI return X" — it should branch on the
 *     normalized fields.
 */

import type OpenAI from 'openai'
import { safeParseJSON } from '../json-safe'
import type {
  Brief,
  ConversionGoal,
  ContentDepth,
  VisualAmbition,
} from './types'

const CONVERSION_GOALS: ConversionGoal[] = ['lead', 'signup', 'booking', 'reservation', 'inquiry', 'subscription', 'browse']
const CONTENT_DEPTHS: ContentDepth[] = ['minimal', 'moderate', 'rich']
const VISUAL_AMBITIONS: VisualAmbition[] = ['restrained', 'polished', 'cinematic', 'editorial']

const KNOWN_ARCHETYPES = [
  'saas', 'ai-startup', 'fintech', 'creative-studio', 'fashion', 'hospitality',
  'restaurant', 'wellness', 'architecture', 'ecommerce', 'portfolio', 'product-launch',
  'b2b', 'health', 'education', 'event',
] as const

const BRIEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['brand', 'businessType', 'archetype', 'targetCustomer', 'offer', 'tone', 'conversionGoal', 'contentDepth', 'visualAmbition'],
  properties: {
    brand: { type: 'string' },
    businessType: { type: 'string' },
    archetype: { type: 'string', enum: KNOWN_ARCHETYPES as readonly string[] },
    targetCustomer: { type: 'string' },
    offer: { type: 'string' },
    tone: { type: 'string' },
    conversionGoal: { type: 'string', enum: CONVERSION_GOALS },
    contentDepth: { type: 'string', enum: CONTENT_DEPTHS },
    visualAmbition: { type: 'string', enum: VISUAL_AMBITIONS },
  },
} as const

function briefSystemPrompt(): string {
  return `You are a brand strategist. Read the brief and return a STRUCTURED design brief as JSON.

Rules:
- archetype: one of [${KNOWN_ARCHETYPES.join(', ')}]. Pick the ONE that best matches.
  • "lodge", "villa", "resort", "boutique stay" → hospitality
  • "atelier", "label", "knitwear", "workwear", "couture", "lookbook" → fashion
  • "agency", "studio", "creative collective", "branding studio" → creative-studio
  • "SaaS", "platform", "CRM", "devtool", "API" → saas
  • "AI app", "AI-powered", "LLM", "agent", "copilot" → ai-startup
  • "skincare", "candle", "fragrance", "brand line" → ecommerce
  • "course", "bootcamp", "school" → education
  • "clinic", "therapy", "doctor", "medical" → health
- targetCustomer: ONE specific audience, 4-10 words.
- offer: ONE sentence describing what they sell or provide.
- tone: 2-4 words describing the voice (e.g. "warm sensory", "blunt technical").
- conversionGoal: pick from [${CONVERSION_GOALS.join(', ')}].
- contentDepth: "minimal" if the brief is short and broad, "moderate" if specific, "rich" if it includes operational detail.
- visualAmbition:
  • "restrained" → SaaS, fintech, classic B2B, health
  • "polished" → AI startups, e-commerce, education
  • "cinematic" → hospitality, luxury hotels, large architecture, immersive brand
  • "editorial" → fashion, creative studio, fashion-led commerce, portfolio
- brand: extract from "called X" / "named X" / quoted name; else infer one capitalized noun from the prompt.

Return ONLY the JSON.`
}

interface ExtractOptions {
  client?: OpenAI
  model?: string
  preferences?: Record<string, unknown>
}

export async function extractBrief(prompt: string, opts: ExtractOptions = {}): Promise<Brief> {
  if (opts.client) {
    try {
      const ai = await extractBriefAI(prompt, opts.client, opts.model ?? 'gpt-4.1-mini', opts.preferences)
      if (ai) return ai
    } catch (err) {
      console.warn(`[v2/brief] AI extract failed (${err instanceof Error ? err.message : err}); falling back`)
    }
  }
  return fallbackBrief(prompt, opts.preferences)
}

async function extractBriefAI(
  prompt: string,
  client: OpenAI,
  model: string,
  preferences?: Record<string, unknown>,
): Promise<Brief | null> {
  const userMsg = preferences && Object.keys(preferences).length
    ? `Brief:\n${prompt}\n\nPreferences:\n${JSON.stringify(preferences)}`
    : `Brief:\n${prompt}`
  const response = await client.chat.completions.create({
    model,
    temperature: 0.4,
    max_tokens: 700,
    messages: [
      { role: 'system', content: briefSystemPrompt() },
      { role: 'user', content: userMsg },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'design_brief', strict: false, schema: BRIEF_SCHEMA },
    },
  })
  const raw = response.choices[0]?.message?.content ?? ''
  const parsed = safeParseJSON<Record<string, unknown>>(raw)
  if (!parsed.ok || !parsed.value) return null
  return normalizeBrief({ ...parsed.value, prompt }, prompt, preferences)
}

function normalizeBrief(raw: Record<string, unknown> & { prompt: string }, prompt: string, prefs?: Record<string, unknown>): Brief {
  const brand = sanitizeBrand((prefs?.brand as string) ?? (raw.brand as string)) ?? guessBrand(prompt)
  const archetype = (KNOWN_ARCHETYPES as readonly string[]).includes(raw.archetype as string)
    ? (raw.archetype as string)
    : coarseArchetype(prompt)
  const conversionGoal = CONVERSION_GOALS.includes(raw.conversionGoal as ConversionGoal)
    ? (raw.conversionGoal as ConversionGoal)
    : defaultConversionGoal(archetype)
  const contentDepth = CONTENT_DEPTHS.includes(raw.contentDepth as ContentDepth)
    ? (raw.contentDepth as ContentDepth)
    : defaultContentDepth(prompt)
  const visualAmbition = VISUAL_AMBITIONS.includes(raw.visualAmbition as VisualAmbition)
    ? (raw.visualAmbition as VisualAmbition)
    : defaultVisualAmbition(archetype)
  return {
    prompt,
    brand,
    businessType: nonEmpty(raw.businessType) ?? archetype,
    archetype,
    targetCustomer: nonEmpty(raw.targetCustomer) ?? 'visitors who want a clear next step',
    offer: nonEmpty(raw.offer) ?? prompt.slice(0, 140),
    tone: nonEmpty(raw.tone) ?? defaultTone(archetype),
    conversionGoal,
    contentDepth,
    visualAmbition,
  }
}

// ── Deterministic fallback ─────────────────────────────────────────

export function fallbackBrief(prompt: string, prefs?: Record<string, unknown>): Brief {
  const archetype = coarseArchetype(prompt)
  const brand = sanitizeBrand(prefs?.brand as string) ?? guessBrand(prompt)
  return {
    prompt,
    brand,
    businessType: archetype,
    archetype,
    targetCustomer: defaultCustomer(archetype),
    offer: defaultOffer(archetype, brand),
    tone: defaultTone(archetype),
    conversionGoal: defaultConversionGoal(archetype),
    contentDepth: defaultContentDepth(prompt),
    visualAmbition: defaultVisualAmbition(archetype),
  }
}

/** Expanded keyword classifier — wider than the previous classify.ts so
 *  lodge/workwear/knitwear etc. land in the right archetype. */
function coarseArchetype(prompt: string): string {
  const p = prompt.toLowerCase()
  const has = (re: RegExp) => re.test(p)

  // AI startup wins over premium-saas only when AI/LLM lang is present.
  if (has(/\b(ai|llm|gpt|agent|copilot|machine learning|prompt)\b/i) &&
      has(/\b(startup|platform|tool|app|builder|saas)\b/i)) return 'ai-startup'

  if (has(/\b(saas|crm|devtool|api|platform|workspace|productivity tool|software)\b/i)) return 'saas'
  if (has(/\b(fintech|bank|wealth|investment|brokerage|payment|insurance|crypto|trading)\b/i)) return 'fintech'

  // Hospitality — widened.
  if (has(/\b(hotel|resort|villa|retreat|stay|lodge|cabin|chalet|inn|guesthouse|riad|hostel|spa|hospitality|boutique stay|cliffside|seaside)\b/i)) return 'hospitality'

  // Restaurant — widened.
  if (has(/\b(restaurant|cafe|coffee|bakery|patisserie|chocolate|chef|bistro|trattoria|brasserie|brewery|winery|wine bar|kitchen|tasting menu|izakaya|ramen|pizzeria)\b/i)) return 'restaurant'

  // Fashion — drastically widened: any apparel/fabric category.
  if (has(/\b(fashion|atelier|couture|menswear|womenswear|lookbook|collection|label|knitwear|workwear|outerwear|loungewear|cashmere|silk|wool|denim|tailoring|millinery|leathergoods|handbag)\b/i)) return 'fashion'

  // Wellness.
  if (has(/\b(wellness|sauna|breathwork|yoga|mindfulness|meditation|retreat (centre|center))\b/i)) return 'wellness'

  // Architecture.
  if (has(/\b(architecture|architect|interior|spatial design|landscape architect)\b/i)) return 'architecture'

  // Creative studio / agency.
  if (has(/\b(creative studio|design studio|design agency|brand (studio|agency)|motion studio|film studio|gallery|art project|art collective)\b/i)) return 'creative-studio'

  // Portfolio.
  if (has(/\b(portfolio|personal site)\b/i)) return 'portfolio'

  // Ecommerce — widened.
  if (has(/\b(skincare|fragrance|candle|coffee brand|cosmetic brand|apparel brand|clothing brand|d2c|dtc|product brand)\b/i)) return 'ecommerce'

  // Health.
  if (has(/\b(clinic|doctor|therapy|therapist|dental|dentist|medical|physiotherapy|psychiatry|psychologist|preventive medicine)\b/i)) return 'health'

  // Education.
  if (has(/\b(bootcamp|course|school|academy|cohort|curriculum|workshop series)\b/i)) return 'education'

  // Event.
  if (has(/\b(conference|festival|meetup|summit|symposium|hackathon|workshop)\b/i)) return 'event'

  // Product launch.
  if (has(/\b(launching|product launch|new product|now available|pre[- ]order)\b/i)) return 'product-launch'

  return 'b2b'
}

function defaultConversionGoal(archetype: string): ConversionGoal {
  switch (archetype) {
    case 'saas':
    case 'ai-startup':
    case 'product-launch': return 'signup'
    case 'fintech': return 'signup'
    case 'hospitality': return 'booking'
    case 'restaurant': return 'reservation'
    case 'wellness':
    case 'health': return 'booking'
    case 'fashion':
    case 'ecommerce': return 'browse'
    case 'creative-studio':
    case 'architecture':
    case 'portfolio': return 'inquiry'
    case 'education': return 'signup'
    case 'event': return 'signup'
    default: return 'lead'
  }
}

function defaultContentDepth(prompt: string): ContentDepth {
  const len = prompt.trim().split(/\s+/).length
  if (len < 14) return 'minimal'
  if (len < 30) return 'moderate'
  return 'rich'
}

function defaultVisualAmbition(archetype: string): VisualAmbition {
  switch (archetype) {
    case 'saas':
    case 'fintech':
    case 'b2b':
    case 'health': return 'restrained'
    case 'ai-startup':
    case 'ecommerce':
    case 'product-launch':
    case 'education':
    case 'event':
    case 'wellness': return 'polished'
    case 'hospitality': return 'cinematic'
    case 'fashion':
    case 'creative-studio':
    case 'architecture':
    case 'portfolio': return 'editorial'
    case 'restaurant': return 'editorial' // serif headline restaurants — editorial-warm
    default: return 'polished'
  }
}

function defaultTone(archetype: string): string {
  switch (archetype) {
    case 'saas': return 'blunt technical'
    case 'ai-startup': return 'optimistic technical'
    case 'fintech': return 'calm authoritative'
    case 'hospitality': return 'sensory atmospheric'
    case 'restaurant': return 'warm conversational'
    case 'fashion': return 'editorial sparse'
    case 'creative-studio': return 'sparse confident'
    case 'architecture': return 'spatial precise'
    case 'ecommerce': return 'sensory intentional'
    case 'portfolio': return 'personal editorial'
    case 'wellness': return 'calm restorative'
    case 'health': return 'reassuring human'
    case 'education': return 'ambitious clear'
    case 'event': return 'communal energetic'
    case 'product-launch': return 'direct decisive'
    default: return 'clear professional'
  }
}

function defaultCustomer(archetype: string): string {
  switch (archetype) {
    case 'saas': return 'engineering teams'
    case 'ai-startup': return 'modern product teams'
    case 'fintech': return 'self-directed investors'
    case 'hospitality': return 'design-conscious travelers'
    case 'restaurant': return 'neighborhood diners'
    case 'fashion': return 'considered shoppers'
    case 'creative-studio': return 'brands looking for clarity'
    case 'architecture': return 'private clients with vision'
    case 'ecommerce': return 'shoppers who value craft'
    case 'portfolio': return 'editors and partners'
    case 'wellness': return 'people looking for rest'
    case 'health': return 'patients seeking calm care'
    case 'education': return 'working professionals leveling up'
    case 'event': return 'community attendees'
    default: return 'serious buyers'
  }
}

function defaultOffer(archetype: string, brand: string): string {
  switch (archetype) {
    case 'saas': return `${brand} is a modern workspace built for momentum.`
    case 'ai-startup': return `${brand} turns prompts into shipped product.`
    case 'fintech': return `${brand} is a precise place to manage your money.`
    case 'hospitality': return `${brand} is a place worth traveling to.`
    case 'restaurant': return `${brand} serves food made with care.`
    case 'fashion': return `${brand} makes considered, lasting pieces.`
    case 'creative-studio': return `${brand} helps brands say something true.`
    case 'architecture': return `${brand} designs spaces that hold up.`
    case 'ecommerce': return `${brand} makes products you want to keep.`
    case 'portfolio': return `${brand}'s selected work and process.`
    case 'wellness': return `${brand} is a calm place to reset.`
    case 'health': return `${brand} provides care that listens.`
    case 'education': return `${brand} prepares you for the next role.`
    case 'event': return `${brand} brings the community together.`
    default: return `${brand} delivers focused, useful work.`
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function nonEmpty(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined
}

function sanitizeBrand(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const cleaned = v.trim().replace(/[^\w& -]/g, '').slice(0, 28)
  return cleaned.length >= 2 ? cleaned : undefined
}

function guessBrand(prompt: string): string {
  const quoted = prompt.match(/["'“]([^"'”]{2,40})["'”]/)
  if (quoted) return sanitizeBrand(quoted[1]) ?? 'Fiecom'
  const named = prompt.match(/\b(?:called|named|brand)\s+([A-Z][A-Za-z0-9& -]{1,32})/)
  if (named) return sanitizeBrand(named[1]) ?? 'Fiecom'
  const cap = prompt.match(/\b([A-Z][a-zA-Z]{2,16}(?:\s+[A-Z][a-zA-Z]{2,16})?)\b/)
  if (cap) return sanitizeBrand(cap[1]) ?? 'Fiecom'
  return 'Fiecom'
}

export function describeBrief(b: Brief): string {
  return [
    `archetype=${b.archetype}`,
    `business="${b.businessType}"`,
    `customer="${b.targetCustomer}"`,
    `offer="${b.offer}"`,
    `tone="${b.tone}"`,
    `goal=${b.conversionGoal}`,
    `depth=${b.contentDepth}`,
    `ambition=${b.visualAmbition}`,
  ].join('  ')
}
