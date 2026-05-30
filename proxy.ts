import { NextResponse, type NextRequest } from 'next/server'
import { getRequestHostname, isAppHost } from './lib/publishing/slug'
import { safeHeaderValue } from './lib/safe-headers'

export function proxy(request: NextRequest) {
  const hostname = getRequestHostname(
    request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
  )

  if (!hostname || isAppHost(hostname)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = `/tenant${url.pathname === '/' ? '' : url.pathname}`

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-fiecom-host', safeHeaderValue(hostname))

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|preview|tenant|.*\\..*).*)'],
}
