import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { renderConfigPage, type PreviewConfigShape } from '@/lib/render-preview'
import { getRequestHostname } from '@/lib/publishing/slug'
import { resolvePublishedProjectByHostname } from '@/lib/publishing/service'
import type { ResolvedSection } from '@/lib/orchestrate-assets'

export const dynamic = 'force-dynamic'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const [{ path }, headerList] = await Promise.all([params, headers()])
  const hostname = getRequestHostname(
    headerList.get('x-fiecom-host') ??
      headerList.get('x-forwarded-host') ??
      headerList.get('host'),
  )
  const project = await resolvePublishedProjectByHostname(hostname)
  if (!project) notFound()

  const slug = path && path.length > 0 ? path.join('/') : undefined
  return renderConfigPage({
    raw: project.generatedConfig as PreviewConfigShape & { sections?: ResolvedSection[] },
    id: project.id,
    slug,
  })
}
