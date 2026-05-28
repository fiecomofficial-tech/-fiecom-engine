import { NextResponse } from 'next/server'
import { getDomainStatus } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const status = await getDomainStatus(id)
  if (!status) {
    return NextResponse.json({ error: 'domain not found', id }, { status: 404 })
  }
  return NextResponse.json({ status })
}
