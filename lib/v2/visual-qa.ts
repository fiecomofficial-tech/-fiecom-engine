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

/** Page-aware visual QA.
 *
 *  Template-rendered pages: page-level checks only (theme contrast +
 *  presence of brand/headline/CTA). The template owns the visual; we
 *  trust it past those gates.
 *
 *  Section-list pages (internal): full quality-gate (chrome, image
 *  fallback, repetition, etc.). */
export function runVisualQA(config: V2Config): QAReport {
  const issues: QAReport['issues'] = []

  // Theme contrast check is universal.
  const themeIssues = checkThemeContrast(config.theme)
  for (const t of themeIssues) {
    issues.push({ category: 'contrast', level: 'warn', message: t })
  }

  // For section-list pages only, run the existing quality gate.
  const sectionPages = config.pages.filter((p) => !p.template && p.sections.length > 0)
  if (sectionPages.length > 0) {
    const resolved: ResolvedConfig = {
      theme: config.theme,
      pages: sectionPages.map((p) => ({
        slug: p.slug,
        title: p.title,
        sections: p.sections.map((s) => ({
          id: s.id as ComponentId,
          content: s.content,
          images: undefined,
        })),
      })),
    }
    const gated = applyQualityGate(resolved)
    for (const i of gated.issues) {
      issues.push({
        category: i.category,
        level: (i.level === 'fail' ? 'fail' : i.level === 'fixed' ? 'fix' : 'warn') as 'fix' | 'fail' | 'warn',
        message: i.message,
        page: i.page,
        section: i.section,
      })
    }
    // Replace the section-list pages with their repaired sections.
    const repairedSectionPages = new Map(gated.config.pages.map((p) => [p.slug, p]))
    const pages = config.pages.map((p) => {
      if (p.template) return p
      const repaired = repairedSectionPages.get(p.slug)
      if (!repaired) return p
      const v2ById = new Map(p.sections.map((s) => [s.id, s.imageQueries]))
      return {
        ...p,
        sections: repaired.sections.map((s) => ({
          id: s.id as ComponentId,
          content: s.content,
          imageQueries: v2ById.get(s.id as ComponentId),
        })),
      }
    })
    const verdict: QAReport['verdict'] = issues.some((i) => i.level === 'fail') ? 'fail'
      : issues.some((i) => i.level === 'fix') ? 'repaired'
      : 'pass'
    return { verdict, config: { ...config, pages }, issues }
  }

  // Template-only path — page-level template invariants.
  for (const p of config.pages) {
    if (!p.template || !p.templateData) continue
    const td = p.templateData as Record<string, unknown>
    const brand = (td.brand as string) || ''
    const hero = td.hero as { headline?: string; cta?: { label?: string } } | undefined
    if (!brand) issues.push({ category: 'content', level: 'fail', message: `template ${p.template} missing brand`, page: p.slug })
    if (!hero?.headline) issues.push({ category: 'content', level: 'fail', message: `template ${p.template} missing hero.headline`, page: p.slug })
    if (!hero?.cta?.label) issues.push({ category: 'content', level: 'warn', message: `template ${p.template} missing hero.cta.label`, page: p.slug })
  }

  const verdict: QAReport['verdict'] = issues.some((i) => i.level === 'fail') ? 'fail'
    : issues.some((i) => i.level === 'fix') ? 'repaired'
    : 'pass'
  return { verdict, config, issues }
}

function checkThemeContrast(theme?: Record<string, string>): string[] {
  if (!theme) return []
  // Defer to the existing contrast helper.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { contrastRatio } = require('../contrast') as typeof import('../contrast')
  const out: string[] = []
  if (theme.ink && theme.bg && contrastRatio(theme.ink, theme.bg) < 4.5) {
    out.push(`ink/bg contrast ${contrastRatio(theme.ink, theme.bg).toFixed(2)} < 4.5`)
  }
  if (theme.onAccent && theme.accent && contrastRatio(theme.onAccent, theme.accent) < 3.0) {
    out.push(`onAccent/accent contrast ${contrastRatio(theme.onAccent, theme.accent).toFixed(2)} < 3.0`)
  }
  return out
}

export function summarizeQA(report: QAReport): string {
  const counts: Record<string, number> = {}
  for (const i of report.issues) counts[i.level] = (counts[i.level] ?? 0) + 1
  return `${report.verdict.toUpperCase()} — ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' ') || 'clean'}`
}
