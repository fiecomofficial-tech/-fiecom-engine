'use client'

/**
 * Fashion Editorial Template — magazine-style full homepage.
 * Owns: minimal nav, full-bleed hero with overlay type, marquee strip,
 * asymmetric gallery, pull-quote, look strip, newsletter, big wordmark
 * footer. No sections, no shape library.
 */

import React from 'react'
import { motion } from 'framer-motion'
import type { TemplateData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function FashionEditorialTemplate({ data }: { data: TemplateData }) {
  const t = data.tokens
  return (
    <div
      data-template="fashion-editorial"
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
        '--t-display': `"${t.fontDisplay}", "Fraunces", "Playfair Display", Georgia, serif`,
        '--t-body': `"${t.fontBody}", system-ui, sans-serif`,
        background: 'var(--t-bg)',
        color: 'var(--t-ink)',
        fontFamily: 'var(--t-body)',
      } as React.CSSProperties}
    >
      <FashionNav data={data} />
      <FashionHero data={data} />
      {data.marquee && data.marquee.length > 0 && <FashionMarquee data={data} />}
      <FashionLookbookGrid data={data} />
      {data.editorialQuote && <FashionPullQuote data={data} />}
      <FashionLookStrip data={data} />
      {data.testimonials && data.testimonials.length > 0 && <FashionTestimonialBand data={data} />}
      <FashionNewsletter data={data} />
      <FashionFooter data={data} />
    </div>
  )
}

// ── Nav (slim, brand-centric) ───────────────────────────────────────

function FashionNav({ data }: { data: TemplateData }) {
  return (
    <header style={{ borderBottom: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24 }}>
        <nav style={{ display: 'flex', gap: 28 }}>
          {data.navLinks.slice(0, 3).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a>
          ))}
        </nav>
        <a href="/" style={{ fontFamily: 'var(--t-display)', fontSize: 22, letterSpacing: '0.02em', textDecoration: 'none', color: 'var(--t-ink)' }}>{data.brand}</a>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
          {data.navLinks.slice(3, 5).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a>
          ))}
          {data.navCta && (
            <a href={data.navCta.href} style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', borderBottom: '1px solid var(--t-ink)' }}>{data.navCta.label}</a>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero — full-bleed image, oversized serif overlay ────────────────

function FashionHero({ data }: { data: TemplateData }) {
  const h = data.hero
  return (
    <section style={{ position: 'relative', height: 'clamp(640px, 95vh, 920px)', overflow: 'hidden', background: 'var(--t-bg-deep)' }}>
      <Img image={h.image} fill priority sizes="100vw" fallback="editorial" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)' }} />
      <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '120px 28px 80px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {h.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
            style={{ margin: 0, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(244,234,216,0.85)' }}>
            {h.eyebrow}
          </motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.1 }}
          style={{ margin: '24px 0 0', fontFamily: 'var(--t-display)', fontWeight: 500, fontSize: 'clamp(3.2rem, 9vw, 8rem)', lineHeight: 0.96, letterSpacing: '-0.02em', color: '#f4ead8', maxWidth: '12ch' }}>
          {h.headline}
        </motion.h1>
        {h.body && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.25 }}
            style={{ margin: '28px 0 0', maxWidth: '52ch', fontSize: 16, lineHeight: 1.6, color: 'rgba(244,234,216,0.75)' }}>
            {h.body}
          </motion.p>
        )}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.35 }}
          style={{ marginTop: 36, display: 'flex', gap: 18 }}>
          <a href={h.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'var(--t-bg)', color: 'var(--t-ink)', textDecoration: 'none' }}>
            {h.cta.label}
          </a>
          {h.secondaryCta && (
            <a href={h.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f4ead8', textDecoration: 'none', border: '1px solid rgba(244,234,216,0.6)' }}>
              {h.secondaryCta.label}
            </a>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// ── Marquee ─────────────────────────────────────────────────────────

function FashionMarquee({ data }: { data: TemplateData }) {
  const items = data.marquee!.concat(data.marquee!) // duplicate for seamless loop
  return (
    <section style={{ padding: '20px 0', borderBottom: '1px solid var(--t-surface-edge)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', animation: 'fashion-marquee 38s linear infinite' }}>
        {items.map((m, i) => (
          <span key={i} style={{ fontFamily: 'var(--t-display)', fontSize: 28, fontStyle: 'italic', color: 'var(--t-ink)', opacity: 0.85 }}>
            {m} <span style={{ margin: '0 12px', opacity: 0.35 }}>·</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes fashion-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </section>
  )
}

// ── Lookbook asymmetric grid ────────────────────────────────────────

function FashionLookbookGrid({ data }: { data: TemplateData }) {
  const imgs = data.gallery ?? data.features.map((f) => f.image).filter(Boolean) as TemplateData['gallery']
  const items = (imgs ?? []).slice(0, 4)
  return (
    <section style={{ padding: '88px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, 360px)', gap: 16 }}>
          {/* Tall left */}
          {items[0] && <FashionTile img={items[0]} caption={data.features[0]?.title} colSpan={5} rowSpan={2} />}
          {/* Top right */}
          {items[1] && <FashionTile img={items[1]} caption={data.features[1]?.title} colSpan={7} rowSpan={1} />}
          {/* Bottom right pair */}
          <div style={{ gridColumn: 'span 4', gridRow: 'span 1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: 'var(--t-surface)', border: '1px solid var(--t-surface-edge)' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>The line</p>
            <h3 style={{ margin: '10px 0 0', fontFamily: 'var(--t-display)', fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.01em' }}>{data.features[2]?.title ?? 'New collection'}</h3>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--t-ink2)' }}>{data.features[2]?.body ?? 'Released in considered drops.'}</p>
          </div>
          {items[2] && <FashionTile img={items[2]} caption={data.features[3]?.title} colSpan={3} rowSpan={1} />}
        </div>
      </div>
    </section>
  )
}

function FashionTile({ img, caption, colSpan, rowSpan }: { img: import('@/components/sections/types').SectionImage | undefined; caption?: string; colSpan: number; rowSpan: number }) {
  return (
    <div style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, position: 'relative', overflow: 'hidden', background: 'var(--t-bg-deep)' }}>
      <Img image={img} fill sizes="(min-width: 1400px) 700px, 50vw" fallback="editorial" />
      {caption && (
        <div style={{ position: 'absolute', bottom: 16, left: 18, fontFamily: 'var(--t-display)', fontSize: 13, letterSpacing: '0.04em', color: '#f4ead8', mixBlendMode: 'difference' }}>{caption}</div>
      )}
    </div>
  )
}

// ── Pull quote ──────────────────────────────────────────────────────

function FashionPullQuote({ data }: { data: TemplateData }) {
  const q = data.editorialQuote!
  return (
    <section style={{ padding: '120px 28px', background: 'var(--t-surface)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(2rem, 4.2vw, 3.4rem)', lineHeight: 1.2, letterSpacing: '-0.015em' }}>
          “{q.quote}”
        </p>
        {q.attribution && (
          <p style={{ margin: '32px 0 0', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
            — {q.attribution}{q.attributionRole ? `, ${q.attributionRole}` : ''}
          </p>
        )}
      </div>
    </section>
  )
}

// ── Look strip ──────────────────────────────────────────────────────

function FashionLookStrip({ data }: { data: TemplateData }) {
  const imgs = (data.gallery ?? []).slice(4, 8)
  if (imgs.length === 0) return null
  return (
    <section style={{ padding: '80px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
          <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 24, letterSpacing: '-0.01em' }}>Selected pieces</p>
          <a href="#" style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', borderBottom: '1px solid var(--t-ink)' }}>View collection</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, imgs.length)}, minmax(0, 1fr))`, gap: 16 }}>
          {imgs.map((im, i) => (
            <div key={i} style={{ aspectRatio: '3 / 4', position: 'relative', background: 'var(--t-bg-deep)' }}>
              <Img image={im} fill sizes="(min-width: 1400px) 340px, 50vw" fallback="editorial" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonial band ────────────────────────────────────────────────

function FashionTestimonialBand({ data }: { data: TemplateData }) {
  const t = data.testimonials![0]
  return (
    <section style={{ padding: '88px 28px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>In their words</p>
        <p style={{ margin: '24px 0 0', fontFamily: 'var(--t-display)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', lineHeight: 1.3, letterSpacing: '-0.015em' }}>
          “{t.quote}”
        </p>
        <p style={{ margin: '20px 0 0', fontSize: 12, letterSpacing: '0.12em', color: 'var(--t-ink2)' }}>
          {t.author}{t.role ? `, ${t.role}` : ''}
        </p>
      </div>
    </section>
  )
}

// ── Newsletter ──────────────────────────────────────────────────────

function FashionNewsletter({ data }: { data: TemplateData }) {
  return (
    <section style={{ padding: '120px 28px', background: 'var(--t-bg-deep)', color: 'var(--t-on-accent)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.6 }}>Newsletter</p>
        <h2 style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>{data.closing.headline}</h2>
        <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.6, opacity: 0.7 }}>{data.closing.body}</p>
        <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 36, display: 'flex', gap: 0, maxWidth: 520, marginInline: 'auto', border: '1px solid rgba(255,255,255,0.25)' }}>
          <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '14px 18px', background: 'transparent', border: 'none', color: 'inherit', fontSize: 14, outline: 'none' }} />
          <button type="submit" style={{ padding: '14px 22px', background: 'var(--t-bg)', color: 'var(--t-ink)', border: 'none', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>{data.closing.cta.label}</button>
        </form>
      </div>
    </section>
  )
}

// ── Footer with massive wordmark ────────────────────────────────────

function FashionFooter({ data }: { data: TemplateData }) {
  const f = data.footer
  return (
    <footer style={{ padding: '64px 28px 36px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 'clamp(4rem, 18vw, 16rem)', lineHeight: 0.9, letterSpacing: '-0.04em', color: 'var(--t-ink)' }}>{f.brand}</p>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: `repeat(${Math.max(2, f.columns.length)}, minmax(0, 1fr))`, gap: 32 }}>
          {f.columns.map((c) => (
            <div key={c.title}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.title}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.links.map((l) => (
                  <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--t-surface-edge)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 11, letterSpacing: '0.08em', color: 'var(--t-ink2)' }}>
          <span>{f.legal}</span>
          <span>{f.tagline}</span>
        </div>
      </div>
    </footer>
  )
}
