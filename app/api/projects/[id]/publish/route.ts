import { NextResponse } from 'next/server'
import { publishingErrorResponse } from '@/lib/publishing/api-error'
import { publishProject } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const project = await publishProject(id)
    if (!project) {
      return NextResponse.json({ error: 'project not found', id }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (err) {
    return publishingErrorResponse(err, 'Project publish failed')
  }
}
