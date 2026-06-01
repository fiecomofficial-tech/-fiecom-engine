import { fetchStockCandidates } from './stock-images'
import type { ComponentId } from './registry'
import type { SectionImage } from '@/components/sections/types'
import { SECTION_META } from './registry'

/** Backwards-compat narrow type. Older saved configs (pre-V2) carry an
 *  `intent` field with these values. V2 doesn't write this anymore, but
 *  legacy fixtures may still be read by the renderer. */
export type SiteIntent = {
  energy?: string
  density?: string
  cinematicIntensity?: string
  motionIntensity?: string
  copyTone?: string
  themeHint?: string
}

interface RawSection {
  id: ComponentId
  content: Record<string, unknown>
  imageQueries?: {
    primary?: string
    secondary?: string
    gallery?: string[]
  }
}

interface RawPage {
  slug: string
  title?: string
  sections: RawSection[]
}

type RawConfig =
  | {
      theme?: Record<string, string>
      sections: RawSection[]
      pages?: undefined
      intent?: SiteIntent
    }
  | {
      theme?: Record<string, string>
      pages: RawPage[]
      sections?: undefined
      intent?: SiteIntent
    }

export interface ResolvedSection {
  id: ComponentId
  content: Record<string, unknown>
  images?: {
    primary?: SectionImage
    secondary?: SectionImage
    gallery?: SectionImage[]
  }
}

export interface ResolvedPage {
  slug: string
  title?: string
  sections: ResolvedSection[]
}

export interface ResolvedConfig {
  theme?: Record<string, string>
  pages: ResolvedPage[]
  intent?: SiteIntent
}

const imageCache = new Map<string, SectionImage | null>()

type Slot = 'primary' | 'secondary' | 'gallery'

function videoAllowed(id: ComponentId, slot: Slot): boolean {
  void id
  void slot
  return false
}

function cacheKeyFor(query: string, orientation: string, video: boolean): string {
  return JSON.stringify({ q: query, o: orientation, v: video })
}

/**
 * Resolve every section's media queries across all pages in one batch.
 * Cinematic slots (heroes, story chapters, closing CTA) try Pexels Videos
 * first and fall back to a photo; everything else stays as still imagery.
 * Accepts both legacy `{ sections }` and `{ pages: [...] }` shapes.
 */
export async function orchestrateAssets(config: RawConfig): Promise<ResolvedConfig> {
  const pages: RawPage[] =
    'pages' in config && Array.isArray(config.pages)
      ? config.pages
      : [{ slug: 'home', sections: config.sections ?? [] }]

  // Collect every unique (query, orientation, video) combo across pages.
  const queries = new Set<string>()
  for (const p of pages) {
    for (const s of p.sections) {
      const q = s.imageQueries
      if (!q) continue
      if (q.primary)
        queries.add(
          cacheKeyFor(q.primary, orientFor(s.id, 'primary'), videoAllowed(s.id, 'primary')),
        )
      if (q.secondary)
        queries.add(
          cacheKeyFor(q.secondary, orientFor(s.id, 'secondary'), videoAllowed(s.id, 'secondary')),
        )
      if (q.gallery) {
        for (const g of q.gallery) {
          queries.add(cacheKeyFor(g, orientFor(s.id, 'gallery'), false))
        }
      }
    }
  }

  const map = new Map<string, SectionImage>()
  await Promise.all(
    [...queries].map(async (key) => {
      if (imageCache.has(key)) {
        const cached = imageCache.get(key)
        if (cached) map.set(key, cached)
        return
      }
      const { q, o, v } = JSON.parse(key) as {
        q: string
        o: 'landscape' | 'portrait' | 'squarish'
        v: boolean
      }
      let candidates = await fetchStockCandidates([q], {
        orientation: o,
        maxQueries: 1,
        video: v,
      })
      if (candidates.length === 0) {
        // Fallback: broaden to a generic atmospheric query so we never
        // hand the frontend an empty media slot.
        const fallbackQueries = ['cinematic atmosphere', 'editorial texture', 'ambient light']
        for (const fq of fallbackQueries) {
          console.warn(`[orchestrate-assets] no media for "${q}", falling back to "${fq}"`)
          candidates = await fetchStockCandidates([fq], {
            orientation: o,
            maxQueries: 1,
            video: false,
          })
          if (candidates.length > 0) break
        }
      }
      const top = candidates[0]
      if (top) {
        const img: SectionImage = {
          url: top.url,
          alt: top.description ?? q,
          attributionAuthor: top.attributionAuthor,
          attributionUrl: top.attributionUrl,
          videoUrl: top.videoUrl,
        }
        imageCache.set(key, img)
        map.set(key, img)
      } else {
        console.warn(`[orchestrate-assets] no media resolved for "${q}" even after fallback`)
        imageCache.set(key, null)
      }
    }),
  )

  const resolvedPages: ResolvedPage[] = pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    sections: p.sections.map((s) => {
      const resolved = resolveSection(s, map)
      const count =
        (resolved.images?.primary ? 1 : 0) +
        (resolved.images?.secondary ? 1 : 0) +
        (resolved.images?.gallery?.length ?? 0)
      console.log(`[orchestrate-assets] page=${p.slug} section=${s.id} media=${count}`)
      return resolved
    }),
  }))

  return { theme: config.theme, pages: resolvedPages, intent: config.intent }
}

function resolveSection(s: RawSection, map: Map<string, SectionImage>): ResolvedSection {
  const out: ResolvedSection = { id: s.id, content: s.content }
  const q = s.imageQueries
  if (!q) return out
  const images: NonNullable<ResolvedSection['images']> = {}
  if (q.primary) {
    const img = map.get(
      cacheKeyFor(q.primary, orientFor(s.id, 'primary'), videoAllowed(s.id, 'primary')),
    )
    if (img) images.primary = img
  }
  if (q.secondary) {
    const img = map.get(
      cacheKeyFor(q.secondary, orientFor(s.id, 'secondary'), videoAllowed(s.id, 'secondary')),
    )
    if (img) images.secondary = img
  }
  if (q.gallery) {
    const gallery: SectionImage[] = []
    for (const g of q.gallery) {
      const img = map.get(cacheKeyFor(g, orientFor(s.id, 'gallery'), false))
      if (img) gallery.push(img)
    }
    if (gallery.length) images.gallery = gallery
  }
  if (Object.keys(images).length) out.images = images
  return out
}

function orientFor(id: ComponentId, slot: 'primary' | 'secondary' | 'gallery') {
  void slot
  return SECTION_META[id].orientation
}
