import { notFound } from 'next/navigation'
import React from 'react'
import { loadPreview } from './preview-store'
import { COMPONENT_REGISTRY, type ComponentId } from './registry'
import type { ResolvedConfig, ResolvedSection, ResolvedPage } from './orchestrate-assets'
import { resolveTheme, type ThemeTokens } from './themes'
import { contrastRatio } from './contrast'

interface VisualRegister {
  sectionGapPx: number
}

const BASE44_REGISTER: VisualRegister = {
  sectionGapPx: 0,
}

function readableOn(bg: string, ink: string, onAccent: string): string {
  const inkContrast = contrastRatio(ink, bg)
  const onAccentContrast = contrastRatio(onAccent, bg)
  return onAccentContrast > inkContrast ? onAccent : ink
}

export type PreviewConfig = ResolvedConfig

function ThemeStyle({ theme, register }: { theme: ThemeTokens; register: VisualRegister }) {
  void register
  // Heroes/closings render on top of imagery — we always force a light
  // foreground there because the overlay below darkens the photo, and a
  // dark text on a dark vignette is the most common contrast bug.
  const photoText = '#f4ead8'
  const photoOverlay =
    'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.78) 100%)'
  const imageVignette =
    'linear-gradient(180deg, rgba(8,8,12,0.28) 0%, rgba(8,8,12,0.68) 55%, rgba(8,8,12,0.96) 100%)'
  // Some sections render text on top of `bg-deep` / `bg-accent` panels
  // which can be dark in a light theme. Pick whichever of ink/onAccent
  // contrasts better with that surface so we never get dark-on-dark.
  const inkOnDeep = readableOn(theme.bgDeep, theme.ink, theme.onAccent)
  const inkOnAccentBg = readableOn(theme.bgAccent, theme.ink, theme.onAccent)

  return (
    <>
      <style>{`
        :root {
          --fie-bg: ${theme.bg};
          --fie-bg-accent: ${theme.bgAccent};
          --fie-bg-deep: ${theme.bgDeep};
          --fie-surface: ${theme.surface};
          --fie-surface-edge: ${theme.surfaceEdge};
          --fie-ink: ${theme.ink};
          --fie-ink-2: ${theme.ink2};
          --fie-mute: ${theme.mute};
          --fie-accent: ${theme.accent};
          --fie-on-accent: ${theme.onAccent};
          --fie-photo-text: ${photoText};
          --fie-photo-overlay: ${photoOverlay};
          --fie-image-vignette: ${imageVignette};
          --fie-ink-on-deep: ${inkOnDeep};
          --fie-ink-on-accent-bg: ${inkOnAccentBg};
          --fie-font-display: "${theme.fontDisplay}", serif;
          --fie-font-body: "${theme.fontBody}", system-ui, sans-serif;
          --fie-font-serif: "Instrument Serif", Georgia, serif;
          --fie-section-gap: 0px;
          --fie-max-width: 1200px;
        }
      `}</style>
    </>
  )
}

function deriveSectionId(s: ResolvedSection, i: number): string {
  if (typeof s.content?.anchor === 'string' && s.content.anchor) return String(s.content.anchor)
  const idMap: Partial<Record<ComponentId, string>> = {
    StickyNavbar: 'top',
    BaselineNavbar: 'top',
    BaselineHero: 'home',
    BaselineFeatures: 'features',
    BaselineLogoBar: 'clients',
    BaselineTestimonials: 'testimonials',
    BaselineCTA: 'start',
    BaselinePageHeader: 'top',
    BaselineAboutNarrative: 'about',
    BaselineContact: 'contact',
    BaselineFooter: 'footer',
    HeroCinematic: 'home',
    HeroEditorial: 'home',
    StickyChapters: 'about',
    HorizontalShowcase: 'work',
    ImageGallery: 'gallery',
    FeatureBento: 'features',
    StatsCounter: 'numbers',
    PricingTiers: 'pricing',
    FAQAccordion: 'faq',
    TestimonialCarousel: 'testimonials',
    TimelineScroll: 'story',
    MessageReveal: 'manifesto',
    MarqueeBand: `marquee-${i}`,
    ProcessSteps: 'process',
    CTABanner: `cta-${i}`,
    ContactBlock: 'contact',
    ClosingCTA: 'start',
    FooterRich: 'footer',
    ContactForm: 'contact',
    NewsletterSignup: 'newsletter',
    LogoCloud: 'clients',
    FeatureList: 'capabilities',
    MetricRow: 'metrics',
    DataTable: 'compare',
    LinkList: 'index',
    PageHeader: 'top',
  }
  return idMap[s.id as ComponentId] ?? `section-${i}`
}

interface RenderArgs {
  id: string
  slug?: string
}

export async function renderPreviewPage({ id, slug }: RenderArgs): Promise<React.ReactElement> {
  const raw = (await loadPreview(id)) as
    | (PreviewConfig & { sections?: ResolvedSection[] })
    | null
  if (raw === null) notFound()
  return renderConfigPage({ raw, id, slug })
}

export async function renderConfigPage({
  raw,
  id,
  slug,
}: RenderArgs & {
  raw: PreviewConfig & { sections?: ResolvedSection[] }
}): Promise<React.ReactElement> {
  // PHASE-1 RECOVERY: legacy `architecture: 'fiecom-reference'` JSON
  // shape (produced by the deleted reference-generator) renders as a
  // stale-preview notice. Old links should be regenerated.
  const legacyArch = (raw as unknown as { architecture?: unknown }).architecture
  if (typeof legacyArch === 'string' && legacyArch === 'fiecom-reference') {
    return (
      <main style={{ padding: '4rem', fontFamily: 'system-ui', maxWidth: 720 }}>
        <h1 style={{ fontSize: 24 }}>Preview from the legacy renderer</h1>
        <p style={{ marginTop: 16, lineHeight: 1.55 }}>
          This preview was generated by the old <code>fiecom-reference</code>{' '}
          renderer, which was retired during Phase 1 recovery. Regenerate the
          site from the prompt to render it through the Baseline pipeline.
        </p>
      </main>
    )
  }

  const theme = resolveTheme(raw.theme as never)
  // Backwards-compat: older fixtures saved before multi-page support
  // stored `{ theme, sections: [...] }`. Wrap as a single-page config.
  const pages: ResolvedPage[] = Array.isArray(raw.pages)
    ? raw.pages
    : Array.isArray(raw.sections)
      ? [{ slug: 'home', sections: raw.sections }]
      : []
  if (pages.length === 0) notFound()

  const target =
    pages.find((p) => p.slug === (slug ?? 'home')) ??
    (slug ? null : pages[0])
  if (!target) notFound()

  console.log(
    `[fiecom/render] preview=${id} page=${target.slug} sections=${target.sections.map((s) => s.id).join(',')}`,
  )

  const register = BASE44_REGISTER

  return (
    <>
      <ThemeStyle theme={theme} register={register} />
      {/* Mirror the Fiecom template Layout.jsx: pt-24 reserves space for
          the fixed Navbar so body content doesn't slide underneath it. */}
      <main
        data-architecture="fiecom"
        className="pt-24"
        style={{ width: '100%', position: 'relative' }}
      >
        {target.sections.map((s, i) => {
          const C = COMPONENT_REGISTRY[s.id as ComponentId]
          if (!C) {
            console.warn(`[fiecom/render] unknown component id "${s.id}"`)
            return null
          }
          const sid = deriveSectionId(s, i)
          // Chrome (navbar/footer) should never get the visual-register
          // inter-section gap — it lives outside the editorial rhythm.
          const isChrome =
            s.id === 'StickyNavbar' || s.id === 'FooterRich' ||
            s.id === 'BaselineNavbar' || s.id === 'BaselineFooter'
          const gap = isChrome || i === 0 ? 0 : BASE44_REGISTER.sectionGapPx
          return (
            <div
              key={`${s.id}-${i}`}
              id={sid}
              style={{
                scrollMarginTop: 80,
                marginBlockStart: `${gap}px`,
              }}
            >
              <C data={{ content: s.content, images: s.images }} />
            </div>
          )
        })}
      </main>
    </>
  )
}

export type { PreviewConfig as PreviewConfigShape }
