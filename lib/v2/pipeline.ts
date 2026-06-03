/**
 * Fiecom V2 pipeline orchestrator — template-first.
 *
 *   prompt → BRIEF → DESIGN SYSTEM → BLUEPRINT → PICK TEMPLATE →
 *   ASSEMBLE (template owns the home page) → VISUAL QA → V2Config.
 *
 * Section-list assembly is preserved for internal pages (about,
 * contact, pricing, etc.). The home page is rendered by a full-page
 * template component; no section iteration on the homepage path.
 */

import type OpenAI from 'openai'
import { extractBrief, describeBrief } from './brief'
import { buildDesignSystem, describeDesignSystem } from './design-system'
import { buildBlueprint, describeBlueprint } from './blueprint'
import { assembleSite } from './assembly'
import { runVisualQA, summarizeQA } from './visual-qa'
import { pickTemplate } from './templates'
import type { V2Config, QAReport, ComponentMatchPlan } from './types'

export interface RunOptions {
  client?: OpenAI
  model?: string
  preferences?: Record<string, unknown>
}

export interface PipelineResult {
  config: V2Config
  qa: QAReport
}

export async function runV2Pipeline(prompt: string, opts: RunOptions = {}): Promise<PipelineResult> {
  console.log(`[v2/pipeline] prompt: ${prompt}`)

  const brief = await extractBrief(prompt, { client: opts.client, model: opts.model, preferences: opts.preferences })
  console.log(`[v2/brief] ${describeBrief(brief)}`)

  const designSystem = buildDesignSystem(brief)
  console.log(`[v2/design-system] ${describeDesignSystem(designSystem)}`)

  const blueprint = buildBlueprint(brief, designSystem)
  console.log(`[v2/blueprint] ${describeBlueprint(blueprint)}`)

  const templateId = pickTemplate(brief)
  console.log(`[v2/template] ${templateId}`)

  // Role plan / component match are no longer used for the home page
  // — the template owns the page. Pass an empty match plan through to
  // the assembler so the back-compat signature stays intact.
  const emptyMatch: ComponentMatchPlan = { sections: [] }
  const config = assembleSite(brief, designSystem, blueprint, emptyMatch)

  const qa = runVisualQA(config)
  console.log(`[v2/qa] ${summarizeQA(qa)}`)

  return { config: qa.config, qa }
}

export type { V2Config, QAReport } from './types'
