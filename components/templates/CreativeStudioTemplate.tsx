'use client'

/**
 * Creative Studio Template — editorial-noir homepage for design,
 * branding, and art studios. Index-style nav, oversized type hero,
 * selected-work grid, manifesto/quote, capability rows, contact band.
 * Owns the whole page. No baseline sections.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { TemplateData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function CreativeStudioTemplate({ data }: { data: TemplateData }) {
  const t = data.tokens
  return (
    <div
      data-template="creative-studio"
      style={{
        '--t-bg': t.bg,
        '--t-ink': t.ink,
        '--t-ink2': t.ink2,
        '--t-accent': t.accent,
        '--t-on-accent': t.onAccent,
        '--t-bg-accent': t.bgAccent,
        '--t-bg-deep': t.bgDeep,
        '--t-surface': t.surface,
        '--t-surface-edge': t.surfaceEdge,
        '--t-mute': t.mute,
        '--t-display': `"${t.fontDisplay}", "Fraunces", Georgia, serif`,
        '--t-body': `"${t.fontBody}", system-ui, sans-serif`,
        background: 'var(--t-bg)',
        color: 'var(--t-ink)',
        fontFamily: 'var(--t-body)',
      } as React.CSSProperties}
    >
      <StudioNav data={data} />
      <StudioHero data={data} />
      {data.marquee && data.marquee.length > 0 && <StudioDisciplineStrip data={data} />}
      <StudioWorkGrid data={data} />
      {data.editorialQuote && <StudioManifesto data={data} />}
      <StudioCapabilities data={data} />
      {data.testimonials && data.testimonials.length > 0 && <StudioVoice data={data} />}
      <StudioContact data={data} />
      <StudioFooter data={data} />
    </div>
  )
}

// ── Nav — index numbers + brand wordmark + inquiry pill ─────────────

function StudioNav({ data }: { data: TemplateData }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'saturate(140%) blur(14px)',
      background: 'color-mix(in srgb, var(--t-bg) 78%, transparent)',
      borderBottom: '1px solid var(--t-surface-edge)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, textDecoration: 'none', color: 'var(--t-ink)' }}>
          <span style={{ fontFamily: 'var(--t-display)', fontSize: 22, letterSpacing: '-0.01em' }}>{data.brand}</span>
          <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>— Studio</span>
        </a>
        <nav style={{ display: 'flex', gap: 28 }}>
          {data.navLinks.slice(0, 5).map((l, i) => (
            <a key={l.label} href={l.href} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, fontSize: 13, color: 'var(--t-ink)', textDecoration: 'none' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--t-ink2)' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ letterSpacing: '-0.005em' }}>{l.label}</span>
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {data.navCta && (
            <a href={data.navCta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'var(--t-ink)', color: 'var(--t-bg)', textDecoration: 'none', borderRadius: 999 }}>
              {data.navCta.label}
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero — oversized serif statement + featured project tile ────────

function StudioHero({ data }: { data: TemplateData }) {
  const h = data.hero
  return (
    <section style={{ padding: '96px 28px 64px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {h.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
            style={{ margin: 0, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
            {h.eyebrow}
          </motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, ease, delay: 0.08 }}
          style={{ margin: '32px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(3rem, 10vw, 9rem)', lineHeight: 0.95, letterSpacing: '-0.035em', maxWidth: '18ch' }}>
          {h.headline}
        </motion.h1>
        <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 56, alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: 'var(--t-ink2)', maxWidth: '40ch' }}>
              {h.body}
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href={h.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'var(--t-ink)', color: 'var(--t-bg)', textDecoration: 'none', borderRadius: 999 }}>
                {h.cta.label} <ArrowUpRight size={14} />
              </a>
              {h.secondaryCta && (
                <a href={h.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 26px', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', border: '1px solid var(--t-surface-edge)', borderRadius: 999 }}>
                  {h.secondaryCta.label}
                </a>
              )}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, ease, delay: 0.18 }}
            style={{ position: 'relative', aspectRatio: '5/4', overflow: 'hidden', background: 'var(--t-bg-deep)' }}>
            <Img image={h.image} fill priority sizes="(min-width: 1400px) 740px, 50vw" fallback="editorial" />
            <div style={{ position: 'absolute', left: 18, bottom: 16, fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 13, color: '#f4ead8', letterSpacing: '0.02em', mixBlendMode: 'difference' }}>
              Featured · 2026
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Discipline strip — auto-marquee of services / clients ───────────

function StudioDisciplineStrip({ data }: { data: TemplateData }) {
  const items = data.marquee!.concat(data.marquee!)
  return (
    <section style={{ padding: '22px 0', borderTop: '1px solid var(--t-surface-edge)', borderBottom: '1px solid var(--t-surface-edge)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'studio-marquee 42s linear infinite' }}>
        {items.map((m, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 14, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink)', opacity: 0.85 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: 'var(--t-accent)' }} />
            {m}
          </span>
        ))}
      </div>
      <style>{`@keyframes studio-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </section>
  )
}

// ── Selected work grid — large editorial project tiles ──────────────

function StudioWorkGrid({ data }: { data: TemplateData }) {
  const projects = data.features.slice(0, 4)
  if (projects.length === 0) return null
  return (
    <section style={{ padding: '120px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16, marginBottom: 56 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>Selected Work</p>
            <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', letterSpacing: '-0.025em' }}>
              The studio at work.
            </h2>
          </div>
          <a href="#" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', borderBottom: '1px solid var(--t-ink)' }}>
            Browse archive →
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28 }}>
          {projects.map((p, i) => (
            <article key={p.title + i} style={{ display: 'flex', flexDirection: 'column', gap: 18, transform: i % 2 === 1 ? 'translateY(48px)' : undefined }}>
              <div style={{ position: 'relative', aspectRatio: i % 2 === 0 ? '5/4' : '4/5', background: 'var(--t-bg-deep)', overflow: 'hidden' }}>
                <Img image={p.image} fill sizes="(min-width: 1400px) 680px, 50vw" fallback="editorial" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <div>
                  {p.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{p.eyebrow}</p>}
                  <h3 style={{ margin: '8px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.015em' }}>{p.title}</h3>
                  <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--t-ink2)', maxWidth: '46ch' }}>{p.body}</p>
                </div>
                <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
                  {String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Manifesto — editorial pull-quote on accent background ───────────

function StudioManifesto({ data }: { data: TemplateData }) {
  const q = data.editorialQuote!
  return (
    <section style={{ padding: '160px 28px', background: 'var(--t-bg-deep)', color: '#f4ead8', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 40, left: 40, fontFamily: 'var(--t-display)', fontSize: 220, lineHeight: 0.8, opacity: 0.08, letterSpacing: '-0.06em' }}>“</div>
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.6 }}>The studio believes</p>
        <p style={{ margin: '36px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.2rem, 4.4vw, 4rem)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {q.quote}
        </p>
        {q.attribution && (
          <p style={{ margin: '40px 0 0', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.7 }}>
            — {q.attribution}{q.attributionRole ? `, ${q.attributionRole}` : ''}
          </p>
        )}
      </div>
    </section>
  )
}

// ── Capabilities — index-style 2-column list ───────────────────────

function StudioCapabilities({ data }: { data: TemplateData }) {
  const items = data.featureDetails && data.featureDetails.length > 0
    ? data.featureDetails
    : DEFAULT_CAPABILITIES
  return (
    <section style={{ padding: '120px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 0.7fr) minmax(0, 1.3fr)', gap: 56, alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>Capabilities</p>
          <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2rem, 3.4vw, 2.8rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            How the studio is useful.
          </h2>
          <p style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '38ch' }}>
            A small team across brand, motion, and editorial. Most projects last three to twelve weeks.
          </p>
        </div>
        <div>
          {items.map((it, i) => (
            <div key={(it.title ?? '') + i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 24, padding: '28px 0', borderTop: '1px solid var(--t-surface-edge)' }}>
              <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 24, letterSpacing: '-0.01em' }}>{it.title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '54ch' }}>{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEFAULT_CAPABILITIES: Array<{ title: string; body: string }> = [
  { title: 'Brand systems', body: 'Identity, type, voice, and the rules that hold them together across surfaces.' },
  { title: 'Editorial direction', body: 'Site, print, and campaign work where the writing carries as much weight as the image.' },
  { title: 'Motion + interaction', body: 'Considered movement that adds meaning, never decoration.' },
  { title: 'Art direction', body: 'Photography, illustration, and casting — the full image-world for a brand.' },
]

// ── Voice — single full-width testimonial ──────────────────────────

function StudioVoice({ data }: { data: TemplateData }) {
  const t = data.testimonials![0]
  return (
    <section style={{ padding: '96px 28px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>Client voice</p>
        <p style={{ margin: '24px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', lineHeight: 1.3, letterSpacing: '-0.015em' }}>
          “{t.quote}”
        </p>
        <p style={{ margin: '24px 0 0', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
          {t.author}{t.role ? `, ${t.role}` : ''}{t.org ? ` · ${t.org}` : ''}
        </p>
      </div>
    </section>
  )
}

// ── Contact band — big serif invitation ────────────────────────────

function StudioContact({ data }: { data: TemplateData }) {
  const c = data.closing
  return (
    <section style={{ padding: '160px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {c.eyebrow && <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.eyebrow}</p>}
        <h2 style={{ margin: '28px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.8rem, 6vw, 5.6rem)', lineHeight: 1.0, letterSpacing: '-0.03em' }}>
          {c.headline}
        </h2>
        <p style={{ margin: '24px 0 0', fontSize: 18, lineHeight: 1.7, color: 'var(--t-ink2)', maxWidth: '52ch' }}>
          {c.body}
        </p>
        <div style={{ marginTop: 44, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a href={c.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', background: 'var(--t-ink)', color: 'var(--t-bg)', textDecoration: 'none', borderRadius: 999 }}>
            {c.cta.label} <ArrowUpRight size={14} />
          </a>
          {c.secondaryCta && (
            <a href={c.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '16px 30px', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', border: '1px solid var(--t-surface-edge)', borderRadius: 999 }}>
              {c.secondaryCta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Footer — massive wordmark + columns ────────────────────────────

function StudioFooter({ data }: { data: TemplateData }) {
  const f = data.footer
  return (
    <footer style={{ padding: '56px 28px 36px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(4rem, 16vw, 14rem)', lineHeight: 0.9, letterSpacing: '-0.04em', color: 'var(--t-ink)' }}>{f.brand}</p>
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: `repeat(${Math.max(2, f.columns.length)}, minmax(0, 1fr))`, gap: 32 }}>
          {f.columns.map((c) => (
            <div key={c.title}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.title}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {c.links.map((l) => (
                  <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--t-surface-edge)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 11, letterSpacing: '0.08em', color: 'var(--t-ink2)' }}>
          <span>{f.legal}</span>
          <span>{f.tagline}</span>
        </div>
      </div>
    </footer>
  )
}
