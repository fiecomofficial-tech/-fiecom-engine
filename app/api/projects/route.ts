import { NextResponse } from 'next/server'
import { createProject, DEV_USER_ID, listProjectsForUser } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = await listProjectsForUser(DEV_USER_ID)
  return NextResponse.json({ projects })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const project = await createProject({
      userId: DEV_USER_ID,
      name: typeof body?.name === 'string' ? body.name : undefined,
      slug: typeof body?.slug === 'string' ? body.slug : undefined,
      generatedConfig: body?.generatedConfig,
      previewId: typeof body?.previewId === 'string' ? body.previewId : undefined,
      previewUrl: typeof body?.previewUrl === 'string' ? body.previewUrl : undefined,
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Project creation failed' },
      { status: 400 },
    )
  }
}
