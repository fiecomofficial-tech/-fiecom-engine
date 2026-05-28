import { NextResponse } from 'next/server'
import { getProjectWithDomains } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const project = await getProjectWithDomains(id)
  if (!project) {
    return NextResponse.json({ error: 'project not found', id }, { status: 404 })
  }
  return NextResponse.json({ project })
}
