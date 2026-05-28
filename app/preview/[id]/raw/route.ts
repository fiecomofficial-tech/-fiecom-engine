import { NextResponse } from 'next/server'
import { loadPreview } from '@/lib/preview-store'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const raw = await loadPreview(id)
  if (raw === null) {
    return NextResponse.json({ error: 'preview not found', id }, { status: 404 })
  }
  return NextResponse.json(
    { raw },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    },
  )
}
