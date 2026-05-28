import { NextResponse } from 'next/server'
import { loadPreview, savePreview } from '@/lib/preview-store'
import { generateEdit } from '@/lib/openai-edit'
import { applyOps, applyResolvedImages, type EditOp, type PendingImage } from '@/lib/patches'
import { fetchStockCandidates } from '@/lib/stock-images'
import { SECTION_META } from '@/lib/registry'
import type { ResolvedConfig } from '@/lib/orchestrate-assets'
import type { SectionImage } from '@/components/sections/types'

const ALLOWED_ORIGIN = 'https://fio-cinematic-core.base44.app'

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) })
}

interface EditBody {
  previewId: string
  instruction: string
  /** Optional: skip the model and apply these ops directly. Used in tests. */
  operations?: EditOp[]
  /** Optional: skip the model and apply these ops + summary. */
  summary?: string
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  try {
    const body = (await request.json()) as EditBody
    if (!body?.previewId) {
      return jsonError('previewId is required', 400, origin)
    }
    if (!body.operations && !body.instruction) {
      return jsonError('instruction or operations is required', 400, origin)
    }

    // Load current config
    const current = (await loadPreview(body.previewId)) as ResolvedConfig | null
    if (!current) return jsonError('preview not found', 404, origin)
    // Back-compat: legacy fixtures still stored as { theme, sections }
    const normalized: ResolvedConfig = normalize(current as never)

    // Decide ops: model-generated or caller-provided
    let operations: EditOp[]
    let summary: string
    if (body.operations) {
      operations = body.operations
      summary = body.summary ?? `Applied ${operations.length} operations.`
    } else {
      const result = await generateEdit({
        instruction: body.instruction,
        config: normalized,
      })
      operations = result.operations
      summary = result.summary
    }

    // Apply ops against the working config
    const { config: patched, pending } = applyOps(normalized, operations)

    // Resolve any new image queries the patch enqueued
    const resolvedMap = await resolvePending(pending)
    const finalConfig = applyResolvedImages(patched, pending, resolvedMap)

    // Save as a new revision
    const newId = await savePreview(finalConfig)

    console.log(
      `[fiecom/edit] previewId=${body.previewId} → newId=${newId} ops=${operations.length} pendingImages=${pending.length}`,
    )

    return NextResponse.json(
      {
        previewId: newId,
        url: `/preview/${newId}`,
        operationsApplied: operations.length,
        pendingImagesResolved: pending.length,
        summary,
        operations,
      },
      { status: 200, headers: corsHeaders(origin) },
    )
  } catch (err) {
    console.error('[api/edit] error:', err)
    return jsonError(
      err instanceof Error ? err.message : 'Edit failed',
      500,
      origin,
    )
  }
}

function jsonError(message: string, status: number, origin: string) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders(origin) })
}

function normalize(stored: ResolvedConfig & { sections?: unknown }): ResolvedConfig {
  if (Array.isArray(stored.pages)) return stored
  if (Array.isArray((stored as { sections?: unknown }).sections)) {
    return {
      theme: stored.theme,
      pages: [{ slug: 'home', sections: (stored as never as { sections: never }).sections }],
    }
  }
  return { theme: stored.theme, pages: [] }
}

async function resolvePending(
  pending: PendingImage[],
): Promise<Map<PendingImage, SectionImage | null>> {
  const out = new Map<PendingImage, SectionImage | null>()
  if (pending.length === 0) return out

  // Dedupe by (query, orientation, video) so identical queries hit the API once.
  type Key = string
  const groups = new Map<Key, PendingImage[]>()
  const keyFor = (p: PendingImage): Key => {
    const o = SECTION_META[p.componentId]?.orientation ?? 'landscape'
    return JSON.stringify({ q: p.query, o, v: false })
  }
  for (const p of pending) {
    const k = keyFor(p)
    const arr = groups.get(k) ?? []
    arr.push(p)
    groups.set(k, arr)
  }

  await Promise.all(
    [...groups.entries()].map(async ([k, list]) => {
      const { q, o, v } = JSON.parse(k) as {
        q: string
        o: 'landscape' | 'portrait' | 'squarish'
        v: boolean
      }
      const candidates = await fetchStockCandidates([q], {
        orientation: o,
        maxQueries: 1,
        video: v,
      })
      const top = candidates[0]
      const img: SectionImage | null = top
        ? {
            url: top.url,
            alt: top.description ?? q,
            attributionAuthor: top.attributionAuthor,
            attributionUrl: top.attributionUrl,
            videoUrl: top.videoUrl,
          }
        : null
      for (const p of list) out.set(p, img)
    }),
  )

  return out
}
