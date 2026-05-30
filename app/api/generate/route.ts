import { NextResponse } from 'next/server'
import { generatePreviewConfig } from '@/lib/openai'
import { orchestrateAssets } from '@/lib/orchestrate-assets'
import { savePreview } from '@/lib/preview-store'
import { createProject, DEV_USER_ID } from '@/lib/publishing/service'
import { safeHeaderValue } from '@/lib/safe-headers'

const ALLOWED_ORIGIN = 'https://fio-cinematic-core.base44.app'

function corsHeaders(origin: string) {
  const safeOrigin = safeHeaderValue(origin) || ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    Vary: safeHeaderValue('Origin'),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || ALLOWED_ORIGIN
  try {
    const body = await request.json()
    const prompt = body?.prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400, headers: corsHeaders(origin) },
      )
    }

    // Stage 1+2: planner → composer (returns Baseline-shaped config with imageQueries).
    const raw = await generatePreviewConfig({
      prompt,
      preferences: body.preferences || {},
      uploads: body.uploads || {},
    })

    // Stage 3: resolve every section's media queries via Pexels.
    const resolved = await orchestrateAssets(
      raw as unknown as Parameters<typeof orchestrateAssets>[0],
    )

    const id = await savePreview(resolved)
    const previewUrl = `/preview/${id}`
    const project = await createProject({
      userId: DEV_USER_ID,
      name: typeof body.name === 'string' ? body.name : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      generatedConfig: resolved,
      previewId: id,
      previewUrl,
    })

    return NextResponse.json(
      { id, url: previewUrl, projectId: project.id, previewUrl, project },
      { status: 200, headers: corsHeaders(origin) },
    )
  } catch (err) {
    console.error('[api/generate] error:', err)
    return NextResponse.json(
      {
        error: 'Generation failed',
        details: err instanceof Error ? err.message : 'Unknown server error',
      },
      { status: 500, headers: corsHeaders(origin) },
    )
  }
}
