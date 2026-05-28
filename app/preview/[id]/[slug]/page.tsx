import { renderPreviewPage } from '@/lib/render-preview'

export default async function PreviewSubPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>
}) {
  const { id, slug } = await params
  return renderPreviewPage({ id, slug })
}

export const dynamic = 'force-dynamic'
