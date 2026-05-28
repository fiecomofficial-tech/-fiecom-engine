/**
 * Stock media fetcher backed by Pexels (photos + videos). Returns
 * `ImageCandidate` shapes so the existing orchestrator/edit pipeline
 * keeps working unchanged. Some candidates may include a `videoUrl`
 * (and matching poster) when the caller asked for video — sections
 * that opt in render the video with an image fallback.
 *
 * Failures (missing key, network, rate limit) resolve as empty arrays.
 * Results are cached in-process and on disk under `.cache/pexels` so
 * repeated queries across requests/dev reloads don't hit the API.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export interface ImageCandidate {
  providerId: string
  provider: 'pexels'
  /** Image URL — always present, used as poster when videoUrl is set */
  url: string
  fullUrl?: string
  width: number
  height: number
  dominantColor?: string
  description?: string
  attributionUrl?: string
  attributionAuthor?: string
  /** Optional MP4 URL for cinematic backgrounds */
  videoUrl?: string
  videoWidth?: number
  videoHeight?: number
}

const PEXELS_PHOTO_ENDPOINT = 'https://api.pexels.com/v1/search'
const PEXELS_VIDEO_ENDPOINT = 'https://api.pexels.com/videos/search'
const PER_QUERY = 8

const photoCache = new Map<string, ImageCandidate[]>()
const videoCache = new Map<string, ImageCandidate[]>()

const CACHE_DIR = path.join(process.cwd(), '.cache', 'pexels')
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

function diskKey(kind: 'p' | 'v', query: string, orientation: string): string {
  const h = crypto.createHash('sha1').update(`${kind}::${query}::${orientation}`).digest('hex')
  return path.join(CACHE_DIR, `${kind}-${h}.json`)
}

function readDiskCache(file: string): ImageCandidate[] | null {
  try {
    const stat = fs.statSync(file)
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null
    return JSON.parse(fs.readFileSync(file, 'utf8')) as ImageCandidate[]
  } catch {
    return null
  }
}

function writeDiskCache(file: string, value: ImageCandidate[]): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(value))
  } catch {
    /* best-effort */
  }
}

function pexelsKey(): string | undefined {
  return process.env.PEXELS_API_KEY
}

async function searchPexelsPhotos(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish',
  signal?: AbortSignal,
): Promise<ImageCandidate[]> {
  const key = pexelsKey()
  if (!key) {
    console.warn('[stock-images] PEXELS_API_KEY is not set — no media will be fetched')
    return []
  }
  console.log(`[stock-images] query="${query}" orientation=${orientation}`)

  const cacheKey = `${query}::${orientation}`
  const mem = photoCache.get(cacheKey)
  if (mem) return mem

  const disk = readDiskCache(diskKey('p', query, orientation))
  if (disk) {
    photoCache.set(cacheKey, disk)
    return disk
  }

  const url = new URL(PEXELS_PHOTO_ENDPOINT)
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(PER_QUERY))
  url.searchParams.set(
    'orientation',
    orientation === 'squarish' ? 'square' : orientation,
  )
  url.searchParams.set('size', 'large')

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: key },
      signal,
    })
    if (!res.ok) {
      console.warn(`[stock-images] pexels photo ${res.status} for "${query}"`)
      return []
    }
    const data = (await res.json()) as PexelsPhotoResponse
    const candidates: ImageCandidate[] = (data.photos ?? []).map((p) => ({
      providerId: String(p.id),
      provider: 'pexels' as const,
      url: p.src.landscape ?? p.src.large ?? p.src.large2x ?? p.src.original,
      fullUrl: p.src.original,
      width: p.width,
      height: p.height,
      dominantColor: p.avg_color,
      description: p.alt ?? undefined,
      attributionUrl: p.url,
      attributionAuthor: p.photographer,
    }))
    photoCache.set(cacheKey, candidates)
    writeDiskCache(diskKey('p', query, orientation), candidates)
    console.log(`[stock-images] resolved "${query}" → ${candidates.length} photos, first url=${candidates[0]?.url ?? 'none'}`)
    return candidates
  } catch (err) {
    console.warn(
      `[stock-images] pexels photo failed for "${query}":`,
      err instanceof Error ? err.message : 'unknown',
    )
    return []
  }
}

async function searchPexelsVideos(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish',
  signal?: AbortSignal,
): Promise<ImageCandidate[]> {
  const key = pexelsKey()
  if (!key) return []

  const cacheKey = `${query}::${orientation}`
  const mem = videoCache.get(cacheKey)
  if (mem) return mem

  const disk = readDiskCache(diskKey('v', query, orientation))
  if (disk) {
    videoCache.set(cacheKey, disk)
    return disk
  }

  const url = new URL(PEXELS_VIDEO_ENDPOINT)
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(PER_QUERY))
  url.searchParams.set(
    'orientation',
    orientation === 'squarish' ? 'square' : orientation,
  )
  url.searchParams.set('size', 'medium')

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: key },
      signal,
    })
    if (!res.ok) {
      console.warn(`[stock-images] pexels video ${res.status} for "${query}"`)
      return []
    }
    const data = (await res.json()) as PexelsVideoResponse
    const candidates: ImageCandidate[] = []
    for (const v of data.videos ?? []) {
      // Pick the smallest mp4 file that's still >= 720p height (or fallback)
      const files = (v.video_files ?? [])
        .filter((f) => f.file_type === 'video/mp4' && f.link)
        .sort((a, b) => (a.height ?? 0) - (b.height ?? 0))
      const file =
        files.find((f) => (f.height ?? 0) >= 720 && (f.height ?? 0) <= 1080) ??
        files[0]
      if (!file) continue
      candidates.push({
        providerId: String(v.id),
        provider: 'pexels',
        url: v.image,
        fullUrl: v.image,
        width: v.width,
        height: v.height,
        description: v.user?.name ? `${v.user.name} on Pexels` : undefined,
        attributionUrl: v.url,
        attributionAuthor: v.user?.name,
        videoUrl: file.link,
        videoWidth: file.width ?? v.width,
        videoHeight: file.height ?? v.height,
      })
    }
    videoCache.set(cacheKey, candidates)
    writeDiskCache(diskKey('v', query, orientation), candidates)
    return candidates
  } catch (err) {
    console.warn(
      `[stock-images] pexels video failed for "${query}":`,
      err instanceof Error ? err.message : 'unknown',
    )
    return []
  }
}

interface FetchOptions {
  orientation?: 'landscape' | 'portrait' | 'squarish'
  maxQueries?: number
  timeoutMs?: number
  /** When true, attempts a video search and falls back to photos */
  video?: boolean
}

export async function fetchStockCandidates(
  queries: string[],
  options: FetchOptions = {},
): Promise<ImageCandidate[]> {
  const {
    orientation = 'landscape',
    maxQueries = 4,
    timeoutMs = 8000,
    video = false,
  } = options

  const sliced = queries.filter((q) => q && q.trim()).slice(0, maxQueries)
  if (sliced.length === 0) return []

  const controllers = sliced.map(() => new AbortController())
  const timers = controllers.map((c) => setTimeout(() => c.abort(), timeoutMs))

  try {
    const results = await Promise.all(
      sliced.map(async (q, i) => {
        const signal = controllers[i].signal
        if (video) {
          const vids = await searchPexelsVideos(q, orientation, signal)
          if (vids.length > 0) return vids
          // Fall back to photo when no good video is available
          return searchPexelsPhotos(q, orientation, signal)
        }
        return searchPexelsPhotos(q, orientation, signal)
      }),
    )
    return results.flat()
  } finally {
    timers.forEach(clearTimeout)
  }
}

/* ----- Pexels response shapes (minimal) ----- */

interface PexelsPhotoResponse {
  photos: Array<{
    id: number
    width: number
    height: number
    avg_color?: string
    alt?: string | null
    url: string
    photographer: string
    src: {
      original: string
      large: string
      large2x?: string
      landscape?: string
    }
  }>
}

interface PexelsVideoResponse {
  videos: Array<{
    id: number
    width: number
    height: number
    image: string
    url: string
    user?: { name: string }
    video_files?: Array<{
      file_type: string
      link: string
      width?: number
      height?: number
    }>
  }>
}
