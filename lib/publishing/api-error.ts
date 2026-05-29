import { NextResponse } from 'next/server'

export function publishingErrorResponse(
  err: unknown,
  fallback: string,
  status = 500,
): NextResponse {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : fallback },
    { status },
  )
}
