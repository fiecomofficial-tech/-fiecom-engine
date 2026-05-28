/**
 * Post-parse validation + sanitization of model output. Goal: never
 * crash the renderer because of a malformed/truncated section. We
 * silently drop invalid sections and clip oversized fields, returning
 * a list of issues for logging.
 */

import { COMPONENT_REGISTRY, type ComponentId } from './registry'

interface Issue {
  level: 'warn' | 'drop'
  message: string
}

export interface ValidationResult<T> {
  value: T
  issues: Issue[]
  /** Whether the result has at least one renderable page+section */
  renderable: boolean
}

const LIMITS = {
  maxPages: 6,
  maxSectionsPerPage: 12,
  maxStringLen: 420,
  maxArrayLen: 8,
}

interface RawSection {
  id?: unknown
  content?: unknown
  imageQueries?: unknown
}

interface RawPage {
  slug?: unknown
  title?: unknown
  sections?: unknown
}

interface RawConfig {
  theme?: unknown
  pages?: unknown
  sections?: unknown
}

export function validateGeneratedConfig(input: unknown): ValidationResult<RawConfig> {
  const issues: Issue[] = []
  if (!input || typeof input !== 'object') {
    return { value: { pages: [] }, issues: [{ level: 'drop', message: 'root is not an object' }], renderable: false }
  }
  const raw = input as RawConfig

  // Normalize legacy single-page shape.
  let pages: RawPage[]
  if (Array.isArray(raw.pages)) {
    pages = raw.pages as RawPage[]
  } else if (Array.isArray(raw.sections)) {
    pages = [{ slug: 'home', sections: raw.sections }]
  } else {
    issues.push({ level: 'drop', message: 'no pages or sections field' })
    pages = []
  }

  if (pages.length > LIMITS.maxPages) {
    issues.push({ level: 'warn', message: `clipped pages to ${LIMITS.maxPages}` })
    pages = pages.slice(0, LIMITS.maxPages)
  }

  const cleanPages = pages
    .map((p, i) => cleanPage(p, i, issues))
    .filter((p): p is Required<Pick<RawPage, 'slug' | 'sections'>> & RawPage => !!p)

  // Ensure exactly one "home" page exists; if missing, rename first.
  if (cleanPages.length > 0 && !cleanPages.some((p) => p.slug === 'home')) {
    cleanPages[0].slug = 'home'
    issues.push({ level: 'warn', message: 'first page renamed to home' })
  }

  const out: RawConfig = {
    theme: raw.theme,
    pages: cleanPages,
  }
  return {
    value: out,
    issues,
    renderable: cleanPages.length > 0 && cleanPages.some((p) => Array.isArray(p.sections) && p.sections.length > 0),
  }
}

function cleanPage(p: RawPage, idx: number, issues: Issue[]): RawPage | null {
  if (!p || typeof p !== 'object') {
    issues.push({ level: 'drop', message: `page[${idx}] not an object` })
    return null
  }
  const slug = typeof p.slug === 'string' && p.slug.length > 0 ? slugify(p.slug) : null
  if (!slug) {
    issues.push({ level: 'drop', message: `page[${idx}] missing slug` })
    return null
  }
  const title = typeof p.title === 'string' ? clipString(p.title) : undefined
  if (!Array.isArray(p.sections)) {
    issues.push({ level: 'drop', message: `page "${slug}" missing sections array` })
    return null
  }
  let sections = (p.sections as RawSection[]).map((s, si) => cleanSection(s, slug, si, issues)).filter((s): s is RawSection => !!s)
  if (sections.length > LIMITS.maxSectionsPerPage) {
    issues.push({ level: 'warn', message: `page "${slug}" clipped sections to ${LIMITS.maxSectionsPerPage}` })
    sections = sections.slice(0, LIMITS.maxSectionsPerPage)
  }
  if (sections.length === 0) {
    issues.push({ level: 'drop', message: `page "${slug}" has no valid sections` })
    return null
  }
  return { slug, title, sections }
}

function cleanSection(s: RawSection, pageSlug: string, idx: number, issues: Issue[]): RawSection | null {
  if (!s || typeof s !== 'object') {
    issues.push({ level: 'drop', message: `${pageSlug}.section[${idx}] not an object` })
    return null
  }
  const id = typeof s.id === 'string' ? s.id : ''
  if (!(id in COMPONENT_REGISTRY)) {
    issues.push({ level: 'drop', message: `${pageSlug}.section[${idx}] unknown id "${id}"` })
    return null
  }
  const content = clipDeep(s.content ?? {})
  const imageQueries = s.imageQueries && typeof s.imageQueries === 'object'
    ? clipDeep(s.imageQueries)
    : undefined
  return { id: id as ComponentId, content, imageQueries }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
}

function clipString(s: string): string {
  return s.length > LIMITS.maxStringLen ? s.slice(0, LIMITS.maxStringLen) + '…' : s
}

function clipDeep(value: unknown): unknown {
  if (typeof value === 'string') return clipString(value)
  if (Array.isArray(value)) {
    const arr = value.slice(0, LIMITS.maxArrayLen).map(clipDeep)
    return arr
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = clipDeep(v)
    }
    return out
  }
  return value
}
