'use client'

import { usePathname } from 'next/navigation'

export function usePreviewHref(href?: string, fallback = '#contact'): string {
  const pathname = usePathname() ?? '/'
  return resolvePreviewHref(pathname, href, fallback)
}

export function usePreviewHrefResolver(): (href?: string, fallback?: string) => string {
  const pathname = usePathname() ?? '/'
  return (href?: string, fallback = '#contact') => resolvePreviewHref(pathname, href, fallback)
}

function resolvePreviewHref(pathname: string, href?: string, fallback = '#contact'): string {
  const value = href && href.length ? href : fallback
  if (
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    /^https?:\/\//.test(value)
  ) {
    return value
  }
  if (!value.startsWith('/')) return value

  const previewMatch = pathname.match(/^(\/preview\/[^/]+)(?:\/.*)?$/)
  const basePath = previewMatch?.[1] ?? ''
  if (!basePath) return value
  return value === '/' ? basePath : `${basePath}${value}`
}
