'use client'

/**
 * Restaurant Warm Template — warm-clay editorial homepage for kitchens,
 * cafes, bistros, wine bars. Split hero, story strip, dish grid, big
 * pull quote, reservation band, hours/address footer. Owns the whole
 * page. No baseline sections.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { TemplateData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function RestaurantWarmTemplate({ data }: { data: TemplateData }) {
  const t = data.tokens
  return (
    <div
      data-template="restaurant-warm"
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
        '--t-display': `"${t.fontDisplay}", "Instrument Serif", Georgia, serif`,
        '--t-body': `"${t.fontBody}", system-ui, sans-serif`,
        background: 'var(--t-bg)',
        color: 'var(--t-ink)',
        fontFamily: 'var(--t-body)',
      } as React.CSSProperties}
    >
      <RestNav data={data} />
      <RestHero data={data} />
      {data.marquee && data.marquee.length > 0 && <RestMenuStrip data={data} />}
      {data.story && <RestStory data={data} />}
      <RestDishes data={data} />
      {data.editorialQuote && <RestPullQuote data={data} />}
      <RestHoursBand data={data} />
      <RestReservation data={data} />
      <RestFooter data={data} />
    </div>
  )
}

// ── Slim warm nav with serif wordmark + reservation pill ────────────

function RestNav({ data }: { data: TemplateData }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: 'saturate(140%) blur(12px)',
      background: 'color-mix(in srgb, var(--t-bg) 78%, transparent)',
      borderBottom: '1px solid var(--t-surface-edge)',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px 28px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24 }}>
        <nav style={{ display: 'flex', gap: 28 }}>
          {data.navLinks.slice(0, 3).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', opacity: 0.85 }}>
              {l.label}
            </a>
          ))}
        </nav>
        <a href="/" style={{ fontFamily: 'var(--t-display)', fontSize: 26, letterSpacing: '0.01em', textDecoration: 'none', color: 'var(--t-ink)' }}>{data.brand}</a>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 18, alignItems: 'center' }}>
          {data.navLinks.slice(3, 5).map((l) => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', opacity: 0.85 }}>
              {l.label}
            </a>
          ))}
          {data.navCta && (
            <a href={data.navCta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
              {data.navCta.label}
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero — split: serif headline left, framed plate image right ─────

function RestHero({ data }: { data: TemplateData }) {
  const h = data.hero
  return (
    <section style={{ padding: '88px 28px 64px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 64, alignItems: 'center' }}>
        <div>
          {h.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
              style={{ margin: 0, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
              {h.eyebrow}
            </motion.p>
          )}
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.08 }}
            style={{ margin: '24px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.8rem, 6.2vw, 5.4rem)', lineHeight: 1.0, letterSpacing: '-0.02em', maxWidth: '14ch' }}>
            {h.headline}
          </motion.h1>
          {h.subhead && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.18 }}
              style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 'clamp(1.1rem, 1.6vw, 1.4rem)', color: 'var(--t-ink2)', maxWidth: '40ch' }}>
              {h.subhead}
            </motion.p>
          )}
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.24 }}
            style={{ margin: '24px 0 0', fontSize: 17, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '46ch' }}>
            {h.body}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.32 }}
            style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href={h.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
              {h.cta.label} <ArrowUpRight size={14} />
            </a>
            {h.secondaryCta && (
              <a href={h.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 26px', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', border: '1px solid var(--t-surface-edge)', borderRadius: 999 }}>
                {h.secondaryCta.label}
              </a>
            )}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease, delay: 0.1 }}
          style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden', background: 'var(--t-bg-deep)' }}>
          <Img image={h.image} fill priority sizes="(min-width: 1280px) 560px, 50vw" fallback="warm" />
        </motion.div>
      </div>
    </section>
  )
}

// ── Menu strip — small serif italic words running across ────────────

function RestMenuStrip({ data }: { data: TemplateData }) {
  const items = data.marquee!.concat(data.marquee!)
  return (
    <section style={{ padding: '24px 0', borderTop: '1px solid var(--t-surface-edge)', borderBottom: '1px solid var(--t-surface-edge)', overflow: 'hidden', background: 'var(--t-surface)' }}>
      <div style={{ display: 'flex', gap: 42, whiteSpace: 'nowrap', animation: 'rest-marquee 44s linear infinite' }}>
        {items.map((m, i) => (
          <span key={i} style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--t-ink)', opacity: 0.85 }}>
            {m} <span style={{ margin: '0 14px', opacity: 0.3, fontStyle: 'normal' }}>·</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes rest-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </section>
  )
}

// ── Story — chef / kitchen narrative, image right ───────────────────

function RestStory({ data }: { data: TemplateData }) {
  const s = data.story!
  return (
    <section style={{ padding: '120px 28px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 72, alignItems: 'center' }}>
        <div>
          {s.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{s.eyebrow}</p>}
          <h2 style={{ margin: '20px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            {s.headline}
          </h2>
          <p style={{ margin: '24px 0 0', fontSize: 17, lineHeight: 1.75, color: 'var(--t-ink2)', maxWidth: '52ch' }}>{s.body}</p>
        </div>
        <div style={{ aspectRatio: '5/6', position: 'relative', background: 'var(--t-bg-deep)' }}>
          <Img image={s.image} fill sizes="(min-width: 1320px) 600px, 50vw" fallback="warm" />
        </div>
      </div>
    </section>
  )
}

// ── Dishes — editorial 3-up cards, optional 4th detail ──────────────

function RestDishes({ data }: { data: TemplateData }) {
  const items = data.features.slice(0, 4)
  if (items.length === 0) return null
  return (
    <section style={{ padding: '96px 28px', background: 'var(--t-surface)', borderTop: '1px solid var(--t-surface-edge)', borderBottom: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16, marginBottom: 48 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2rem, 3.4vw, 2.8rem)', letterSpacing: '-0.018em' }}>
            From the kitchen
          </h2>
          <a href="#" style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink)', textDecoration: 'none', borderBottom: '1px solid var(--t-ink)' }}>
            See full menu
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, items.length)}, minmax(0, 1fr))`, gap: 22 }}>
          {items.slice(0, 3).map((dish, i) => (
            <article key={dish.title + i} style={{ background: 'var(--t-bg)' }}>
              <div style={{ aspectRatio: '4/5', position: 'relative', background: 'var(--t-bg-deep)' }}>
                <Img image={dish.image} fill sizes="(min-width: 1320px) 420px, 33vw" fallback="warm" />
              </div>
              <div style={{ padding: '22px 4px 6px' }}>
                {dish.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{dish.eyebrow}</p>}
                <h3 style={{ margin: '10px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.01em' }}>{dish.title}</h3>
                <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--t-ink2)' }}>{dish.body}</p>
              </div>
            </article>
          ))}
        </div>
        {items[3] && (
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 48, alignItems: 'center', padding: '32px 0 0', borderTop: '1px solid var(--t-surface-edge)' }}>
            <div>
              {items[3].eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{items[3].eyebrow}</p>}
              <h3 style={{ margin: '14px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', letterSpacing: '-0.015em' }}>{items[3].title}</h3>
              <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--t-ink2)', maxWidth: '52ch' }}>{items[3].body}</p>
            </div>
            <div style={{ aspectRatio: '5/3', position: 'relative', background: 'var(--t-bg-deep)' }}>
              <Img image={items[3].image} fill sizes="(min-width: 1320px) 600px, 50vw" fallback="warm" />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Pull quote (guest voice / press) ────────────────────────────────

function RestPullQuote({ data }: { data: TemplateData }) {
  const q = data.editorialQuote!
  return (
    <section style={{ padding: '128px 28px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>In their words</p>
        <p style={{ margin: '32px 0 0', fontFamily: 'var(--t-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(1.9rem, 3.6vw, 3rem)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          “{q.quote}”
        </p>
        {q.attribution && (
          <p style={{ margin: '28px 0 0', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>
            — {q.attribution}{q.attributionRole ? `, ${q.attributionRole}` : ''}
          </p>
        )}
      </div>
    </section>
  )
}

// ── Hours / address strip ──────────────────────────────────────────

function RestHoursBand({ data }: { data: TemplateData }) {
  return (
    <section style={{ padding: '48px 28px', background: 'var(--t-bg-deep)', color: 'var(--t-on-accent)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 32 }}>
        {[
          { label: 'Lunch', value: 'Tue–Fri · 12:00–14:30' },
          { label: 'Dinner', value: 'Tue–Sat · 18:30–22:00' },
          { label: 'Closed', value: 'Sunday + Monday' },
          { label: 'Find us', value: `${data.brand} · Center` },
        ].map((h) => (
          <div key={h.label}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.6 }}>{h.label}</p>
            <p style={{ margin: '10px 0 0', fontFamily: 'var(--t-display)', fontSize: 20, letterSpacing: '-0.01em' }}>{h.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Reservation CTA — big serif headline + pill ─────────────────────

function RestReservation({ data }: { data: TemplateData }) {
  const c = data.closing
  return (
    <section style={{ padding: '140px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
        <Img image={data.hero.image} fill sizes="100vw" fallback="warm" />
      </div>
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        {c.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.eyebrow}</p>}
        <h2 style={{ margin: '26px 0 0', fontFamily: 'var(--t-display)', fontWeight: 400, fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)', lineHeight: 1.04, letterSpacing: '-0.025em' }}>
          {c.headline}
        </h2>
        <p style={{ margin: '22px 0 0', fontSize: 17, lineHeight: 1.65, color: 'var(--t-ink2)', maxWidth: '52ch', marginInline: 'auto' }}>
          {c.body}
        </p>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <a href={c.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase', background: 'var(--t-accent)', color: 'var(--t-on-accent)', textDecoration: 'none', borderRadius: 999 }}>
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

// ── Footer with serif wordmark + address + columns ──────────────────

function RestFooter({ data }: { data: TemplateData }) {
  const f = data.footer
  return (
    <footer style={{ padding: '64px 28px 40px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) repeat(' + Math.min(3, f.columns.length) + ', minmax(0, 1fr))', gap: 40 }}>
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontSize: 40, letterSpacing: '-0.01em' }}>{f.brand}</p>
          <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--t-ink2)', maxWidth: '32ch' }}>{f.tagline}</p>
        </div>
        {f.columns.map((c) => (
          <div key={c.title}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.title}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {c.links.map((l) => (
                <li key={l.label}><a href={l.href} style={{ fontSize: 14, color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1320, margin: '40px auto 0', paddingTop: 22, borderTop: '1px solid var(--t-surface-edge)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--t-ink2)' }}>
        <span>{f.legal}</span>
        <span style={{ fontFamily: 'var(--t-display)', fontStyle: 'italic' }}>Honest food, daily.</span>
      </div>
    </footer>
  )
}
