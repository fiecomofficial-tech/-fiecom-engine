import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { orchestrateAssets } from '@/lib/orchestrate-assets'
import { savePreview } from '@/lib/preview-store'
import { createProject, DEV_USER_ID } from '@/lib/publishing/service'
import { safeHeaderValue } from '@/lib/safe-headers'
import { applyQualityGate, summarizeIssues } from '@/lib/quality-gate'
import { runV2Pipeline } from '@/lib/v2/pipeline'

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  ? safeHeaderValue(process.env.OPENAI_API_KEY)
  : undefined
const aiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : undefined
const BRIEF_MODEL = process.env.OPENAI_BRIEF_MODEL ?? process.env.OPENAI_PLANNER_MODEL ?? 'gpt-4.1-mini'

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

    // Fiecom V2 — design-system-first pipeline. Brief → Design System →
    // Blueprint → Role Plan → Component Match → Assembly → Visual QA.
    // The composition-guard shape library is bypassed on the home page.
    const { config: v2Config } = await runV2Pipeline(prompt, {
      client: aiClient,
      model: BRIEF_MODEL,
      preferences: body.preferences || {},
    })

    // Resolve every section's media via Pexels.
    const resolved = await orchestrateAssets(
      v2Config as unknown as Parameters<typeof orchestrateAssets>[0],
    )

    // Final quality gate (image-fill fallbacks, scale-strip, contrast).
    // V2 visual QA already ran on the unresolved config; this catches
    // anything orchestrate-assets left empty.
    const gated = applyQualityGate(resolved)
    console.log(`[fiecom/quality] post-resolve: ${summarizeIssues(gated.issues)}`)

    // Save with the V2 design system + brief + blueprint embedded so
    // future renderers / editor UIs can read them.
    const persistConfig = {
      ...gated.config,
      designSystem: v2Config.designSystem,
      brief: v2Config.brief,
      blueprint: v2Config.blueprint,
    }
    const id = await savePreview(persistConfig)
    const previewUrl = `/preview/${id}`
    const project = await createProject({
      userId: DEV_USER_ID,
      name: typeof body.name === 'string' ? body.name : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      generatedConfig: persistConfig,
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
