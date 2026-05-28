export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ margin: 0, opacity: 0.6 }}>Published site</p>
      <h1 style={{ marginTop: 8 }}>Test Site</h1>
      <p>Slug: {slug}</p>
    </main>
  )
}