import publishing from '@/data/publishing.json'

type PublishedSection = {
  id?: string
  type?: string
  component?: string
  title?: string
  eyebrow?: string
  subtitle?: string
  body?: string
  copy?: string
  text?: string
  cta?: string
  image?: string
  props?: Record<string, unknown>
  [key: string]: unknown
}

type PublishedPage = {
  slug: string
  title?: string
  sections?: PublishedSection[]
}

type PublishedConfig = {
  theme?: Record<string, unknown>
  pages?: PublishedPage[]
  sections?: PublishedSection[]
}

type PublishedProject = {
  name: string
  slug: string
  generatedConfig: PublishedConfig
}

function getText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function renderSection(section: PublishedSection, index: number) {
  const props = section.props ?? {}
  const type = getText(section.type) ?? getText(section.component) ?? 'section'
  const eyebrow = getText(section.eyebrow) ?? getText(props.eyebrow)
  const title = getText(section.title) ?? getText(props.title) ?? `${type} section`
  const subtitle = getText(section.subtitle) ?? getText(props.subtitle)

  const body =
    getText(section.body) ??
    getText(section.copy) ??
    getText(section.text) ??
    getText(props.body) ??
    getText(props.copy) ??
    getText(props.text)

  const cta = getText(section.cta) ?? getText(props.cta)
  const image = getText(section.image) ?? getText(props.image)

  return (
    <section
      key={section.id ?? `${type}-${index}`}
      style={{
        minHeight: index === 0 ? '72vh' : 'auto',
        padding: '96px 32px',
        borderTop: index === 0 ? '0' : '1px solid rgba(255,255,255,0.12)',
        display: 'grid',
        gridTemplateColumns: image
          ? 'minmax(0, 1fr) minmax(280px, 0.8fr)'
          : '1fr',
        gap: 40,
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: 880 }}>
        <p
          style={{
            margin: '0 0 16px',
            opacity: 0.64,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: 12,
          }}
        >
          {eyebrow ?? type}
        </p>

        <h2
          style={{
            margin: 0,
            fontSize:
              index === 0
                ? 'clamp(48px, 8vw, 112px)'
                : 'clamp(34px, 5vw, 72px)',
            lineHeight: 0.92,
            letterSpacing: '-0.06em',
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: '28px 0 0',
              maxWidth: 680,
              fontSize: 22,
              lineHeight: 1.35,
              opacity: 0.78,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        {body ? (
          <p
            style={{
              margin: '24px 0 0',
              maxWidth: 640,
              fontSize: 16,
              lineHeight: 1.8,
              opacity: 0.72,
            }}
          >
            {body}
          </p>
        ) : null}

        {cta ? (
          <div
            style={{
              display: 'inline-flex',
              marginTop: 32,
              padding: '14px 18px',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 999,
            }}
          >
            {cta}
          </div>
        ) : null}
      </div>

      {image ? (
        <div
          style={{
            minHeight: 420,
            borderRadius: 32,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
          }}
        />
      ) : null}
    </section>
  )
}

export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const projects = publishing.projects as PublishedProject[]
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Site not found</h1>
      </main>
    )
  }

  const homePage =
    project.generatedConfig.pages?.find((page) => page.slug === 'home') ??
    project.generatedConfig.pages?.[0]

  const sections =
    homePage?.sections ?? project.generatedConfig.sections ?? []

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#f5f1ea',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {sections.length > 0 ? (
        sections.map(renderSection)
      ) : (
        <section
          style={{
            minHeight: '100vh',
            padding: 32,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <p style={{ margin: 0, opacity: 0.56 }}>
              Published site
            </p>

            <h1
              style={{
                margin: '12px 0 0',
                fontSize: 'clamp(56px, 9vw, 124px)',
                lineHeight: 0.9,
              }}
            >
              {project.name}
            </h1>

            <p style={{ marginTop: 24, opacity: 0.72 }}>
              No sections published yet.
            </p>
          </div>
        </section>
      )}
    </main>
  )
}