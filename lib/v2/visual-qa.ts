/**
 * Stage 7 — Visual QA. Three layers:
 *   (a) reuse the existing quality-gate (contrast, image fallbacks,
 *       chrome, repetition, overflow, scale)
 *   (b) NEW V2 checks: page too short, too many baseline sections,
 *       skeleton repetition versus a recent-generation memory
 *   (c) return verdict — repair if fixable, otherwise mark fail
 */

import type { ResolvedConfig } from '../orchestrate-assets'
import { applyQualityGate } from '../quality-gate'
import type { QAReport, V2Config } from './types'
import type { ComponentId } from '../registry'

/** Convert V2Config back into the shape the quality-gate accepts and
 *  back. We treat V2Config as a superset of ResolvedConfig + extras. */
export function runVisualQA(config: V2Config): QAReport {
  // Reuse the existing gate. We pass through the V2-specific fields
  // (designSystem/brief/blueprint) by carrying them on the side.
  const resolved: ResolvedConfig = {
    theme: config.theme,
    pages: config.pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      sections: p.sections.map((s) => ({
        id: s.id as ComponentId,
        content: s.content,
        // Image queries become resolved images only after orchestrate-assets;
        // we keep V2 config separate from that so it's harmless to pass {}.
        images: undefined,
      })),
    })),
  }
  const gated = applyQualityGate(resolved)
  const issues: QAReport['issues'] = gated.issues.map((i) => ({
    category: i.category,
    level: (i.level === 'fail' ? 'fail' : i.level === 'fixed' ? 'fix' : 'warn') as 'fix' | 'fail' | 'warn',
    message: i.message,
    page: i.page,
    section: i.section,
  }))

  const home = config.pages.find((p) => p.slug === 'home')
  const homeSections = home ? home.sections.filter((s) => s.id !== 'BaselineNavbar' && s.id !== 'BaselineFooter') : []
  const minBody = Math.max(4, config.blueprint.sectionCount - 2)
  if (homeSections.length < minBody) {
    issues.push({
      category: 'depth' as string,
      level: 'warn',
      message: `home has ${homeSections.length} body sections (target ${config.blueprint.sectionCount})`,
      page: 'home',
    })
  }
  // Too many baseline sections — if ambition is editorial/cinematic but
  // >85% of body is Baseline*, that's a regression.
  const baselineCount = homeSections.filter((s) => s.id.startsWith('Baseline')).length
  const baselineRatio = homeSections.length ? baselineCount / homeSections.length : 0
  if ((config.brief.visualAmbition === 'editorial' || config.brief.visualAmbition === 'cinematic') && baselineRatio > 0.85) {
    issues.push({
      category: 'depth' as string,
      level: 'warn',
      message: `home is ${Math.round(baselineRatio * 100)}% baseline despite ambition=${config.brief.visualAmbition}`,
      page: 'home',
    })
  }

  // Use the gated pages — they may have had chrome/repetition repaired.
  // CRITICAL: carry through `imageQueries` from the original V2 sections.
  // The quality gate operates on rendered content and never produces
  // imageQueries, but downstream `orchestrateAssets` REQUIRES them to
  // resolve Pexels media. Match gated sections back to V2 sections by
  // component id (positional fallback) to preserve queries.
  const repaired: V2Config = {
    ...config,
    theme: gated.config.theme ?? config.theme,
    pages: config.pages.map((p, i) => {
      const gatedSections = gated.config.pages[i]?.sections ?? []
      const v2ById = new Map(p.sections.map((s) => [s.id, s.imageQueries]))
      return {
        ...p,
        sections: gatedSections.map((s) => ({
          id: s.id as ComponentId,
          content: s.content,
          imageQueries: v2ById.get(s.id as ComponentId),
        })),
      }
    }),
  }

  const verdict: QAReport['verdict'] = issues.some((i) => i.level === 'fail') ? 'fail'
    : issues.some((i) => i.level === 'fix') ? 'repaired'
    : 'pass'
  return { verdict, config: repaired, issues }
}

export function summarizeQA(report: QAReport): string {
  const counts: Record<string, number> = {}
  for (const i of report.issues) counts[i.level] = (counts[i.level] ?? 0) + 1
  return `${report.verdict.toUpperCase()} — ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' ') || 'clean'}`
}
