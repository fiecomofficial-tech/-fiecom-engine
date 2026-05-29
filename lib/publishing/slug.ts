export const ROOT_DOMAIN = 'fiecom.com'
export const PUBLISHING_DOMAIN = `sites.${ROOT_DOMAIN}`
export const VERCEL_APP_HOST = 'fiecom-engine.vercel.app'

const RESERVED_SUBDOMAINS = new Set([
  'api',
  'app',
  'dashboard',
  'fiecom',
  'mail',
  'preview',
  'sites',
  'www',
])

export function normalizeSlug(input: string | undefined | null): string {
  const slug = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  if (!slug) return 'untitled-site'
  if (RESERVED_SUBDOMAINS.has(slug)) return `${slug}-site`
  return slug.slice(0, 63).replace(/-+$/g, '') || 'untitled-site'
}

export function normalizeHostname(input: string | undefined | null): string {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/\.$/, '')

  if (!raw) return ''
  if (raw.startsWith('[')) return raw
  return raw.replace(/:\d+$/, '')
}

export function getRequestHostname(input: string | undefined | null): string {
  return normalizeHostname(input)
}

export function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  )
}

export function isAppHost(hostname: string): boolean {
  return (
    isLocalhost(hostname) ||
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname === PUBLISHING_DOMAIN ||
    hostname === VERCEL_APP_HOST
  )
}

export function subdomainForSlug(slug: string): string {
  return `${normalizeSlug(slug)}.${PUBLISHING_DOMAIN}`
}

export function publicUrlForHostname(hostname: string): string {
  return `https://${normalizeHostname(hostname)}`
}
