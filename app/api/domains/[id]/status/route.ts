import { NextResponse } from 'next/server'
import { publishingErrorResponse } from '@/lib/publishing/api-error'
import { getDomainStatus } from '@/lib/publishing/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const status = await getDomainStatus(id)
    if (!status) {
      return NextResponse.json({ error: 'domain not found', id }, { status: 404 })
    }
    return NextResponse.json({ status })
  } catch (err) {
    return publishingErrorResponse(err, 'Domain status lookup failed')
  }
}
