'use client'

/**
 * Hospitality Cinematic Template — full-bleed hero, sticky story
 * sections, rooms/experience cards, gold-on-dark CTA band. Owns the
 * whole page. No baseline sections.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { TemplateData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function HospitalityCinematicTemplate({ data }: { data: TemplateData }) {
  const t = data.tokens
  return (
    <div
      data-template="hospitality-cinematic"
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
        '--t-display': `"${t.fontDisplay}", "Playfair Display", "Fraunces", Georgia, serif`,
        '--t-body': `"${t.fontBody}", system-ui, sans-serif`,
        background: 'var(--t-bg)',
        color: 'var(--t-ink)',
        fontFamily: 'var(--t-body)',
      } as React.CSSProperties}
    >
      <HospNav data={data} />
      <HospHero data={data} />
      <HospAtmosphere data={data} />
      <HospRooms data={data} />
      {data.story && <HospStoryStrip data={data} />}
      {data.testimonials && data.testimonials.length > 0 && <HospGuestVoice data={data} />}
      <HospReservationBand data={data} />
      <HospFooter data={data} />
    </div>
  )
}

// ── Transparent fixed nav over the hero ─────────────────────────────

function HospNav({ data }: { data: TemplateData }) {
  return (
    <header style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '24px 32px',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24, color: '#f4ead8' }}>
        <nav style={{ display: 'flex', gap: 26 }}>
          {data.navLinks.slice(0, 3).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#f4ead8', textDecoration: 'none', opacity: 0.85 }}>{l.label}</a>
          ))}
        </nav>
        <a href="/" style={{ fontFamily: 'var(--t-display)', fontSize: 20, letterSpacing: '0.02em', textDecoration: 'none', color: '#f4ead8' }}>{data.brand}</a>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, alignItems: 'center' }}>
          {data.navLinks.slice(3, 5).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#f4ead8', textDecoration: 'none', opacity: 0.85 }}>{l.label}</a>
          ))}
          {data.navCta && (
            <a href={data.navCta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
              {data.navCta.label}
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero (full-bleed, atmospheric) ─────────────────────────────────

function HospHero({ data }: { data: TemplateData }) {
  const h = data.hero
  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 720, overflow: 'hidden', background: 'var(--t-bg-deep)' }}>
      <motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease }} style={{ position: 'absolute', inset: 0 }}>
        <Img image={h.image} fill priority sizes="100vw" fallback="warm" />
      </motion.div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.78) 100%)' }} />
      <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 80, color: '#f4ead8' }}>
        {h.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.6 }}
            style={{ margin: 0, fontSize: 11, letterSpacing: '0.36em', textTransform: 'uppercase', opacity: 0.85 }}>
            {h.eyebrow}
          </motion.p>
        )}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, ease, delay: 0.7 }}
          style={{ margin: '28px 0 0', fontFamily: 'var(--t-display)', fontWeight: 500, fontSize: 'clamp(3.4rem, 8vw, 7rem)', lineHeight: 0.98, letterSpacing: '-0.025em', maxWidth: '16ch' }}>
          {h.headline}
        </motion.h1>
        {h.subhead && (
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.85 }}
            style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 'clamp(1.2rem, 1.8vw, 1.6rem)', opacity: 0.85 }}>
            {h.subhead}
          </motion.p>
        )}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 1.0 }}
          style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a href={h.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
            {h.cta.label} <ArrowUpRight size={14} />
          </a>
          {h.secondaryCta && (
            <a href={h.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 26px', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f4ead8', textDecoration: 'none', border: '1px solid rgba(244,234,216,0.55)', borderRadius: 999 }}>
              {h.secondaryCta.label}
            </a>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// ── Atmosphere — split image + text ────────────────────────────────

function HospAtmosphere({ data }: { data: TemplateData }) {
  const f = data.features[0]
  return (
    <section style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 72, alignItems: 'center' }}>
        <div style={{ aspectRatio: '4/5', position: 'relative', background: 'var(--t-bg-deep)' }}>
          <Img image={f?.image} fill sizes="(min-width: 1400px) 580px, 50vw" fallback="warm" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{f?.eyebrow ?? 'The place'}</p>
          <h2 style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            {f?.title ?? 'A slow place worth coming back to.'}
          </h2>
          <p style={{ margin: '24px 0 0', fontSize: 17, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '46ch' }}>
            {f?.body}
          </p>
          {data.features[1] && (
            <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '46ch' }}>
              {data.features[1].body}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Rooms / experiences cards ──────────────────────────────────────

function HospRooms({ data }: { data: TemplateData }) {
  const rooms = data.features.slice(2, 6)
  if (rooms.length === 0) return null
  return (
    <section style={{ padding: '88px 32px', background: 'var(--t-surface)', borderTop: '1px solid var(--t-surface-edge)', borderBottom: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.02em' }}>Rooms & experiences</h2>
          <a href="#" style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', borderBottom: '1px solid var(--t-ink)' }}>See all</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, rooms.length)}, minmax(0, 1fr))`, gap: 22 }}>
          {rooms.map((r) => (
            <article key={r.title} style={{ borderRadius: 4, overflow: 'hidden', background: 'var(--t-bg)' }}>
              <div style={{ aspectRatio: '4/5', position: 'relative', background: 'var(--t-bg-deep)' }}>
                <Img image={r.image} fill sizes="(min-width: 1400px) 440px, 33vw" fallback="warm" />
              </div>
              <div style={{ padding: '24px 4px 8px' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 24, letterSpacing: '-0.01em' }}>{r.title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--t-ink2)' }}>{r.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Story strip ─────────────────────────────────────────────────────

function HospStoryStrip({ data }: { data: TemplateData }) {
  const s = data.story!
  return (
    <section style={{ padding: '140px 32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 72, alignItems: 'center' }}>
        <div>
          {s.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{s.eyebrow}</p>}
          <h2 style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {s.headline}
          </h2>
          <p style={{ margin: '24px 0 0', fontSize: 17, lineHeight: 1.7, color: 'var(--t-ink2)', maxWidth: '52ch' }}>{s.body}</p>
        </div>
        <div style={{ aspectRatio: '5/4', position: 'relative', background: 'var(--t-bg-deep)' }}>
          <Img image={s.image} fill sizes="(min-width: 1400px) 640px, 50vw" fallback="warm" />
        </div>
      </div>
    </section>
  )
}

// ── Guest voice ─────────────────────────────────────────────────────

function HospGuestVoice({ data }: { data: TemplateData }) {
  const t = data.testimonials![0]
  // Use the renderer-computed contrast-safe ink: --fie-ink-on-accent-bg
  // picks whichever of ink / onAccent reads better against bgAccent. The
  // midnight-luxury dark palette has onAccent === bg (dark-on-dark) so the
  // raw onAccent fails here.
  return (
    <section style={{ padding: '120px 32px', background: 'var(--t-bg-accent)', color: 'var(--fie-ink-on-accent-bg, var(--t-on-accent))' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.7 }}>Guests</p>
        <p style={{ margin: '32px 0 0', fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', lineHeight: 1.3 }}>
          “{t.quote}”
        </p>
        <p style={{ margin: '28px 0 0', fontSize: 12, letterSpacing: '0.18em', opacity: 0.7 }}>{t.author}{t.role ? `, ${t.role}` : ''}</p>
      </div>
    </section>
  )
}

// ── Reservation CTA band ───────────────────────────────────────────

function HospReservationBand({ data }: { data: TemplateData }) {
  const c = data.closing
  return (
    <section style={{ padding: '140px 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <Img image={data.hero.image} fill sizes="100vw" fallback="warm" />
      </div>
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        {c.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.eyebrow}</p>}
        <h2 style={{ margin: '24px 0 0', fontFamily: 'var(--t-display)', fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          {c.headline}
        </h2>
        <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--t-ink2)' }}>{c.body}</p>
        <a href={c.cta.href} style={{ marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
          {c.cta.label} <ArrowUpRight size={14} />
        </a>
      </div>
    </section>
  )
}

// ── Footer ──────────────────────────────────────────────────────────

function HospFooter({ data }: { data: TemplateData }) {
  const f = data.footer
  return (
    <footer style={{ padding: '64px 32px 40px', background: 'var(--t-bg-deep)', color: '#f4ead8' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) repeat(' + Math.min(3, f.columns.length) + ', minmax(0, 1fr))', gap: 40 }}>
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 28, letterSpacing: '0.02em' }}>{f.brand}</p>
          <p style={{ margin: '14px 0 0', fontSize: 13, lineHeight: 1.55, opacity: 0.7, maxWidth: '32ch' }}>{f.tagline}</p>
        </div>
        {f.columns.map((c) => (
          <div key={c.title}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>{c.title}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {c.links.map((l) => (
                <li key={l.label}><a href={l.href} style={{ fontSize: 13, color: '#f4ead8', textDecoration: 'none' }}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1400, margin: '40px auto 0', paddingTop: 20, borderTop: '1px solid rgba(244,234,216,0.18)', fontSize: 11, letterSpacing: '0.08em', opacity: 0.6 }}>
        {f.legal}
      </div>
    </footer>
  )
}
