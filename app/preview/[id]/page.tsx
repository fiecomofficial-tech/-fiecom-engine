import { renderPreviewPage } from '@/lib/render-preview'

export default async function PreviewRootPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return renderPreviewPage({ id })
}

export const dynamic = 'force-dynamic'
