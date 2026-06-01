/**
 * Fiecom V2 pipeline orchestrator.
 *
 *   prompt → BRIEF → DESIGN SYSTEM → BLUEPRINT → ROLE PLAN →
 *   COMPONENT MATCH → ASSEMBLY → VISUAL QA → V2Config.
 *
 * The composition-guard shape library is bypassed entirely on the home
 * page. Each stage logs a one-line summary to stdout so the dev log is
 * readable during generation.
 */

import type OpenAI from 'openai'
import { extractBrief, describeBrief } from './brief'
import { buildDesignSystem, describeDesignSystem } from './design-system'
import { buildBlueprint, planRoles, describeBlueprint, describeRolePlan } from './blueprint'
import { matchComponents, describeMatch } from './match'
import { assembleSite } from './assembly'
import { runVisualQA, summarizeQA } from './visual-qa'
import type { V2Config, QAReport } from './types'

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

  const rolePlan = planRoles(brief, designSystem, blueprint)
  console.log(`[v2/roles] ${describeRolePlan(rolePlan)}`)

  const match = matchComponents(brief, designSystem, rolePlan)
  console.log(`[v2/match] ${describeMatch(match)}`)

  const config = assembleSite(brief, designSystem, blueprint, match)

  const qa = runVisualQA(config)
  console.log(`[v2/qa] ${summarizeQA(qa)}`)

  return { config: qa.config, qa }
}

export type { V2Config, QAReport } from './types'
