/**
 * Edit-operation schema and executor for AI-chat-driven incremental
 * updates to an existing generated config. Operations are applied
 * sequentially against the current working state — indices in later
 * ops must account for shifts caused by earlier ops in the batch.
 *
 * Images: new/replaced sections come in with `imageQueries`; unchanged
 * sections keep their already-resolved `images`. The executor returns
 * the list of pending image-resolve jobs so the caller can run one
 * batch through orchestrate-assets.
 */

import type { ResolvedConfig, ResolvedPage, ResolvedSection } from './orchestrate-assets'
import type { ComponentId } from './registry'
import { COMPONENT_REGISTRY } from './registry'
import type { SectionImage } from '@/components/sections/types'

interface ImageQueries {
  primary?: string
  secondary?: string
  gallery?: string[]
}

interface RawSection {
  id: ComponentId
  content: Record<string, unknown>
  imageQueries?: ImageQueries
}

interface RawPage {
  slug: string
  title?: string
  sections: RawSection[]
}

interface ThemePatch {
  preset?: string
  accent?: string
  bg?: string
  ink?: string
  bgAccent?: string
  fontDisplay?: string
  fontBody?: string
}

export type EditOp =
  | { op: 'set_theme'; value: ThemePatch }
  | { op: 'add_page'; value: RawPage; after?: string }
  | { op: 'remove_page'; page: string }
  | { op: 'rename_page'; page: string; slug: string; title?: string }
  | { op: 'add_section'; page: string; value: RawSection; at?: number; after?: string }
  | { op: 'remove_section'; page: string; at?: number; id?: string }
  | { op: 'move_section'; page: string; from: number; to: number }
  | { op: 'replace_section'; page: string; at: number; value: RawSection }
  | { op: 'update_content'; page: string; at: number; path: string; value: unknown }
  | {
      op: 'update_image'
      page: string
      at: number
      slot: 'primary' | 'secondary' | 'gallery'
      index?: number
      value: string
    }

export interface PendingImage {
  pageSlug: string
  sectionIndex: number
  slot: 'primary' | 'secondary' | 'gallery'
  /** For gallery only: the index inside the gallery array */
  galleryIndex?: number
  query: string
  componentId: ComponentId
}

interface ApplyResult {
  config: ResolvedConfig
  pending: PendingImage[]
}

export function applyOps(input: ResolvedConfig, ops: EditOp[]): ApplyResult {
  const config = clone(input)
  const pending: PendingImage[] = []

  for (const op of ops) {
    switch (op.op) {
      case 'set_theme': {
        const patch = stripUndefined(op.value as unknown as Record<string, unknown>)
        config.theme = { ...(config.theme ?? {}), ...(patch as Record<string, string>) }
        break
      }

      case 'add_page': {
        const newPage = adoptRawPage(op.value, pending)
        const idx = op.after
          ? config.pages.findIndex((p) => p.slug === op.after) + 1
          : config.pages.length
        config.pages.splice(idx, 0, newPage)
        break
      }

      case 'remove_page': {
        const idx = config.pages.findIndex((p) => p.slug === op.page)
        if (idx >= 0) config.pages.splice(idx, 1)
        break
      }

      case 'rename_page': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (page) {
          page.slug = op.slug
          if (op.title !== undefined) page.title = op.title
        }
        break
      }

      case 'add_section': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        const section = adoptRawSection(op.value, page.slug, -1, pending)
        let insertAt = page.sections.length
        if (typeof op.at === 'number') insertAt = clamp(op.at, 0, page.sections.length)
        else if (op.after) {
          const idx = page.sections.findIndex((s) => s.id === op.after)
          if (idx >= 0) insertAt = idx + 1
        }
        page.sections.splice(insertAt, 0, section)
        // Fix up sectionIndex for any pending images we just enqueued
        // (we passed -1 above; rewrite to insertAt).
        for (const p of pending) {
          if (p.pageSlug === page.slug && p.sectionIndex === -1) {
            p.sectionIndex = insertAt
          }
        }
        break
      }

      case 'remove_section': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        let idx = -1
        if (typeof op.at === 'number') idx = op.at
        else if (op.id) idx = page.sections.findIndex((s) => s.id === op.id)
        if (idx >= 0 && idx < page.sections.length) page.sections.splice(idx, 1)
        break
      }

      case 'move_section': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        const from = clamp(op.from, 0, page.sections.length - 1)
        const to = clamp(op.to, 0, page.sections.length - 1)
        if (from === to) break
        const [moved] = page.sections.splice(from, 1)
        page.sections.splice(to, 0, moved)
        break
      }

      case 'replace_section': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        if (op.at < 0 || op.at >= page.sections.length) break
        const section = adoptRawSection(op.value, page.slug, op.at, pending)
        page.sections[op.at] = section
        break
      }

      case 'update_content': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        const section = page.sections[op.at]
        if (!section) break
        section.content = setByPath(section.content, op.path, op.value)
        break
      }

      case 'update_image': {
        const page = config.pages.find((p) => p.slug === op.page)
        if (!page) break
        const sIdx = op.at
        if (sIdx < 0 || sIdx >= page.sections.length) break
        const section = page.sections[sIdx]
        pending.push({
          pageSlug: page.slug,
          sectionIndex: sIdx,
          slot: op.slot,
          galleryIndex: op.index,
          query: op.value,
          componentId: section.id as ComponentId,
        })
        break
      }
    }
  }

  return { config, pending }
}

/**
 * Apply already-resolved images into the config in the slots indicated
 * by the pending list. The caller (orchestrator) is responsible for
 * resolving each query into a SectionImage; this just stitches them in.
 */
export function applyResolvedImages(
  config: ResolvedConfig,
  pending: PendingImage[],
  resolved: Map<PendingImage, SectionImage | null>,
): ResolvedConfig {
  for (const p of pending) {
    const img = resolved.get(p)
    if (!img) continue
    const page = config.pages.find((pg) => pg.slug === p.pageSlug)
    if (!page) continue
    const section = page.sections[p.sectionIndex]
    if (!section) continue
    section.images = section.images ?? {}
    if (p.slot === 'gallery') {
      const arr = section.images.gallery ?? []
      const idx = typeof p.galleryIndex === 'number' ? p.galleryIndex : arr.length
      arr[idx] = img
      section.images.gallery = arr
    } else {
      section.images[p.slot] = img
    }
  }
  return config
}

// ── helpers ──────────────────────────────────────────────────────────

function adoptRawPage(raw: RawPage, pending: PendingImage[]): ResolvedPage {
  return {
    slug: raw.slug,
    title: raw.title,
    sections: raw.sections.map((s, i) => adoptRawSection(s, raw.slug, i, pending)),
  }
}

function adoptRawSection(
  raw: RawSection,
  pageSlug: string,
  sectionIndex: number,
  pending: PendingImage[],
): ResolvedSection {
  if (!COMPONENT_REGISTRY[raw.id]) {
    // Unknown id — skip enqueue but keep the structure so the patch
    // doesn't silently drop content. Render layer will warn.
  }
  const out: ResolvedSection = { id: raw.id, content: raw.content ?? {} }
  const q = raw.imageQueries
  if (q) {
    if (q.primary) {
      pending.push({
        pageSlug,
        sectionIndex,
        slot: 'primary',
        query: q.primary,
        componentId: raw.id,
      })
    }
    if (q.secondary) {
      pending.push({
        pageSlug,
        sectionIndex,
        slot: 'secondary',
        query: q.secondary,
        componentId: raw.id,
      })
    }
    if (q.gallery) {
      q.gallery.forEach((g, gi) => {
        pending.push({
          pageSlug,
          sectionIndex,
          slot: 'gallery',
          galleryIndex: gi,
          query: g,
          componentId: raw.id,
        })
      })
    }
  }
  return out
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(o)) if (o[k] !== undefined) out[k] = o[k]
  return out as Partial<T>
}

/**
 * Set a value at a dot/bracket path inside a content object. Path
 * segments can be field names or numeric indices.
 *   "tiers.1.price" → content.tiers[1].price
 *   "links.0.label" → content.links[0].label
 * Creates missing objects/arrays along the way.
 */
function setByPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const segs = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
  if (!segs.length) return target
  const out = clone(target)
  let cursor: any = out
  for (let i = 0; i < segs.length - 1; i++) {
    const k = segs[i]
    const nextIsIndex = /^\d+$/.test(segs[i + 1])
    if (cursor[k] === undefined || cursor[k] === null) {
      cursor[k] = nextIsIndex ? [] : {}
    }
    cursor = cursor[k]
  }
  cursor[segs[segs.length - 1]] = value
  return out
}
