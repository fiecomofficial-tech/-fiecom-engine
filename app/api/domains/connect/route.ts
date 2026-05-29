import { NextResponse } from 'next/server'
import { publishingErrorResponse } from '@/lib/publishing/api-error'
import { connectCustomDomain } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const projectId = typeof body?.projectId === 'string' ? body.projectId : ''
    const hostname = typeof body?.hostname === 'string' ? body.hostname : ''
    if (!projectId || !hostname) {
      return NextResponse.json(
        { error: 'projectId and hostname are required' },
        { status: 400 },
      )
    }

    const status = await connectCustomDomain({ projectId, hostname })
    if (!status) {
      return NextResponse.json({ error: 'project not found', projectId }, { status: 404 })
    }

    return NextResponse.json({ status }, { status: 201 })
  } catch (err) {
    return publishingErrorResponse(err, 'Domain connection failed', 400)
  }
}
