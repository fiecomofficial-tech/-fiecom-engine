import { notFound } from 'next/navigation'
import React from 'react'
import { loadPreview } from './preview-store'
import { COMPONENT_REGISTRY, type ComponentId } from './registry'
import type { ResolvedConfig, ResolvedSection, ResolvedPage } from './orchestrate-assets'
import { resolveTheme, type ThemeTokens } from './themes'
import { contrastRatio } from './contrast'
import { applyQualityGate, summarizeIssues } from './quality-gate'
import { TEMPLATE_REGISTRY } from './v2/templates'
import type { TemplateData } from '@/components/templates/types'

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
        /* Renderer-safe pass — hard guarantees regardless of section CSS.
           Prevents horizontal scroll, runaway image zoom, and unbreakable
           text from blowing past the viewport on small screens. */
        [data-architecture="fiecom"] { overflow-x: hidden; max-width: 100vw; }
        [data-architecture="fiecom"] section { overflow-x: clip; max-width: 100vw; }
        [data-architecture="fiecom"] img,
        [data-architecture="fiecom"] video {
          max-width: 100%;
          height: auto;
        }
        /* Cap any composed scale/zoom transforms applied to media — no
           amount of section animation should blow an image past 103%. */
        [data-architecture="fiecom"] img[style*="scale"],
        [data-architecture="fiecom"] video[style*="scale"] {
          transform: scale(min(1.03, var(--fie-img-scale, 1))) !important;
        }
        [data-architecture="fiecom"] h1,
        [data-architecture="fiecom"] h2,
        [data-architecture="fiecom"] h3,
        [data-architecture="fiecom"] h4 {
          /* Wrap on whitespace; only break a word as last resort. Never
             break in the middle of a word (kills char-split heroes). */
          overflow-wrap: break-word;
        }
        [data-architecture="fiecom"] p {
          overflow-wrap: break-word;
        }

        /* ────────────────────────────────────────────────────────────
           Mobile responsiveness for V2 full-page templates.

           Every V2 template owns its own grid layout via inline styles.
           Below 760px every multi-column grid (except fixed-row gallery
           grids) collapses to a single column. Fixed-row lookbook grids
           (e.g. Fashion 12-col × 360px rows) collapse to auto rows. Big
           wordmark footers shrink so they don't blow past the viewport.

           The rules use attribute selectors against inline style values
           with !important so they win against component inline styles.
           Scope: [data-architecture="fiecom-template"] only — section
           pages (data-architecture="fiecom") keep their own behavior.
           ──────────────────────────────────────────────────────────── */
        @media (max-width: 760px) {
          /* Generic grids: stack to a single column when no rows are
             explicitly defined. Catches hero splits, dish/room/work
             grids, pricing tiers, metrics row, footer columns. */
          [data-architecture="fiecom-template"] [style*="grid-template-columns"]:not([style*="grid-template-rows"]) {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          /* Fashion lookbook — the 12-col × 360px-row grid collapses
             to a stack with auto-sized rows. */
          [data-architecture="fiecom-template"] [style*="grid-template-rows: repeat(2, 360px)"] {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
            grid-auto-flow: row !important;
            gap: 16px !important;
          }
          [data-architecture="fiecom-template"] [style*="grid-template-rows: repeat(2, 360px)"] > * {
            grid-column: span 1 !important;
            grid-row: auto !important;
            min-height: 320px !important;
          }
          /* Studio staggered "translateY" on every second project card
             stops on mobile so cards align cleanly in a single column. */
          [data-architecture="fiecom-template"] [style*="translateY(48px)"] {
            transform: none !important;
          }
          /* Studio capabilities — release the desktop sticky behavior
             so the intro stays at the top in the stacked layout. */
          [data-architecture="fiecom-template"] [style*="position: sticky"] {
            position: static !important;
          }
          /* Big serif wordmark in Fashion / Studio / Restaurant
             footers — clamp() already handles most cases, but a few
             explicit pixel sizes need clamping below 760px. */
          [data-architecture="fiecom-template"] footer p[style*="font-size: 40px"],
          [data-architecture="fiecom-template"] footer p[style*="font-size: 28px"] {
            font-size: 28px !important;
          }
          /* Section padding compaction: anything paying 32px+ side
             padding gets a tighter 22px so content has breathing room
             without spilling. Keeps hero side margins consistent. */
          [data-architecture="fiecom-template"] section[style*="padding"] {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }
          [data-architecture="fiecom-template"] footer[style*="padding"] {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }
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

  // Belt-and-suspenders: the gate also runs at generation time, but old
  // previews predate the gate and the editor flow can mutate sections —
  // re-run defensively so preview/published render the same stable output.
  const preGate: ResolvedConfig = {
    theme: raw.theme,
    pages: Array.isArray(raw.pages)
      ? raw.pages
      : Array.isArray(raw.sections)
        ? [{ slug: 'home', sections: raw.sections } as ResolvedPage]
        : [],
    intent: (raw as ResolvedConfig).intent,
  }
  const gated = applyQualityGate(preGate)
  if (gated.issues.length > 0) {
    console.log(`[fiecom/quality] render-time gate: ${summarizeIssues(gated.issues)}`)
  }

  const theme = resolveTheme(gated.config.theme as never)
  const pages: ResolvedPage[] = gated.config.pages
  if (pages.length === 0) notFound()

  const target =
    pages.find((p) => p.slug === (slug ?? 'home')) ??
    (slug ? null : pages[0])
  if (!target) notFound()

  console.log(
    `[fiecom/render] preview=${id} page=${target.slug} ${target.template ? `template=${target.template}` : `sections=${target.sections.map((s) => s.id).join(',')}`}`,
  )

  const register = BASE44_REGISTER

  // ── Template-rendered page (V2 home pages) ─────────────────────────
  // The template owns the entire page: nav, hero, body, footer.
  // We skip the fiecom architecture wrapper to avoid double chrome and
  // padding-top conflicts.
  if (target.template && target.templateData) {
    const Template = TEMPLATE_REGISTRY[target.template]
    if (Template) {
      return (
        <>
          <ThemeStyle theme={theme} register={register} />
          <main
            data-architecture="fiecom-template"
            data-template={target.template}
            style={{ width: '100%', position: 'relative', overflowX: 'hidden' }}
          >
            <Template data={target.templateData as unknown as TemplateData} />
          </main>
        </>
      )
    }
    console.warn(`[fiecom/render] unknown template "${target.template}" — falling back to section render`)
  }

  // ── Section-list page (internal pages: about, contact, pricing, …) ──
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
