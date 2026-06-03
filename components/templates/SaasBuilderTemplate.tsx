'use client'

/**
 * SaaS Builder Template — Lovable / Linear / Vercel polish.
 * Owns the entire homepage. No baseline sections, no shape library.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Plus, Minus } from 'lucide-react'
import type { TemplateData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function SaasBuilderTemplate({ data }: { data: TemplateData }) {
  const t = data.tokens
  return (
    <div
      data-template="saas-builder"
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
        '--t-display': `"${t.fontDisplay}", system-ui, sans-serif`,
        '--t-body': `"${t.fontBody}", system-ui, sans-serif`,
        background: 'var(--t-bg)',
        color: 'var(--t-ink)',
        fontFamily: 'var(--t-body)',
      } as React.CSSProperties}
    >
      <SaasNav data={data} />
      <SaasHero data={data} />
      {data.logos && data.logos.length > 0 && <SaasLogoStrip data={data} />}
      <SaasFeatureBento data={data} />
      {data.metrics && data.metrics.length > 0 && <SaasMetrics data={data} />}
      {data.testimonials && data.testimonials.length > 0 && <SaasQuoteBand data={data} />}
      {data.pricing && <SaasPricing data={data} />}
      {data.faq && <SaasFAQ data={data} />}
      <SaasClosing data={data} />
      <SaasFooter data={data} />
    </div>
  )
}

// ── Nav ─────────────────────────────────────────────────────────────

function SaasNav({ data }: { data: TemplateData }) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'saturate(150%) blur(14px)',
        background: 'color-mix(in srgb, var(--t-bg) 75%, transparent)',
        borderBottom: '1px solid var(--t-surface-edge)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--t-ink)', fontFamily: 'var(--t-display)', fontWeight: 600 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--t-ink)' }} />
          <span style={{ fontSize: 15, letterSpacing: '-0.01em' }}>{data.brand}</span>
        </a>
        <nav style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--t-surface)', borderRadius: 999, border: '1px solid var(--t-surface-edge)' }}>
          {data.navLinks.slice(0, 5).map((l) => (
            <a key={l.label} href={l.href} style={{ padding: '6px 14px', fontSize: 13, color: 'var(--t-ink2)', textDecoration: 'none', borderRadius: 999 }}>
              {l.label}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="#" style={{ fontSize: 13, color: 'var(--t-ink2)', textDecoration: 'none' }}>Sign in</a>
          {data.navCta && (
            <a href={data.navCta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, borderRadius: 999, background: 'var(--t-ink)', color: 'var(--t-bg)', textDecoration: 'none', fontWeight: 500 }}>
              {data.navCta.label}
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Hero ────────────────────────────────────────────────────────────

function SaasHero({ data }: { data: TemplateData }) {
  const h = data.hero
  return (
    <section style={{ padding: '88px 24px 56px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 64, alignItems: 'center' }}>
        <div>
          {h.eyebrow && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 8px', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--t-ink2)', background: 'var(--t-surface)', border: '1px solid var(--t-surface-edge)', borderRadius: 999, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--t-accent)' }} />
              {h.eyebrow}
            </motion.div>
          )}
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.05 }}
            style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(2.4rem, 5.2vw, 4.2rem)', lineHeight: 1.04, letterSpacing: '-0.035em', maxWidth: '18ch' }}>
            {h.headline}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.15 }}
            style={{ marginTop: 22, fontSize: 18, lineHeight: 1.55, color: 'var(--t-ink2)', maxWidth: '40ch' }}>
            {h.body}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.25 }}
            style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a href={h.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', fontSize: 14, fontWeight: 500, borderRadius: 999, background: 'var(--t-ink)', color: 'var(--t-bg)', textDecoration: 'none' }}>
              {h.cta.label} <ArrowUpRight size={16} />
            </a>
            {h.secondaryCta && (
              <a href={h.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 22px', fontSize: 14, fontWeight: 500, borderRadius: 999, background: 'transparent', color: 'var(--t-ink)', textDecoration: 'none', border: '1px solid var(--t-surface-edge)' }}>
                {h.secondaryCta.label}
              </a>
            )}
          </motion.div>
        </div>
        {/* Product mock card — the SaaS hero anchor */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease, delay: 0.1 }}
          style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: 'var(--t-surface)', border: '1px solid var(--t-surface-edge)', boxShadow: '0 30px 80px -30px rgba(0,0,0,0.3)' }}>
          <div style={{ aspectRatio: '4 / 3', position: 'relative' }}>
            <Img image={h.image} fill priority sizes="(min-width: 1280px) 560px, 50vw" fallback="cool" />
            {/* Window chrome over the image to read as a "product screenshot" */}
            <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840' }} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ── Logo strip ──────────────────────────────────────────────────────

function SaasLogoStrip({ data }: { data: TemplateData }) {
  return (
    <section style={{ padding: '48px 24px', borderTop: '1px solid var(--t-surface-edge)', borderBottom: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>Trusted by teams worldwide</p>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', opacity: 0.7 }}>
          {(data.logos ?? []).slice(0, 6).map((l) => (
            <span key={l.name} style={{ fontSize: 18, fontFamily: 'var(--t-display)', fontWeight: 500, letterSpacing: '-0.02em' }}>{l.name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Feature bento ──────────────────────────────────────────────────

function SaasFeatureBento({ data }: { data: TemplateData }) {
  const items = data.features.slice(0, 4)
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>Capabilities</p>
          <h2 style={{ margin: '12px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Everything the team needs, nothing they don't.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 16 }}>
          {/* Big tile */}
          {items[0] && <BentoTile item={items[0]} span={4} tall />}
          {items[1] && <BentoTile item={items[1]} span={2} />}
          {items[2] && <BentoTile item={items[2]} span={2} />}
          {items[3] && <BentoTile item={items[3]} span={4} />}
        </div>
      </div>
    </section>
  )
}

function BentoTile({ item, span, tall = false }: { item: TemplateData['features'][number]; span: 2 | 3 | 4; tall?: boolean }) {
  return (
    <div style={{
      gridColumn: `span ${span}`,
      borderRadius: 16, padding: 28,
      background: 'var(--t-surface)',
      border: '1px solid var(--t-surface-edge)',
      minHeight: tall ? 360 : 220,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28,
      position: 'relative', overflow: 'hidden',
    }}>
      <div>
        {item.eyebrow && <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{item.eyebrow}</p>}
        <h3 style={{ margin: '8px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: tall ? 24 : 19, letterSpacing: '-0.01em' }}>{item.title}</h3>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--t-ink2)', maxWidth: '34ch' }}>{item.body}</p>
      </div>
      {item.image && (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: tall ? 180 : 110, border: '1px solid var(--t-surface-edge)' }}>
          <Img image={item.image} fill sizes="(min-width: 1280px) 560px, 100vw" fallback="cool" />
        </div>
      )}
    </div>
  )
}

// ── Metrics row ─────────────────────────────────────────────────────

function SaasMetrics({ data }: { data: TemplateData }) {
  return (
    <section style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', borderRadius: 18, padding: 36, background: 'var(--t-bg-accent)', color: 'var(--t-on-accent)', display: 'grid', gridTemplateColumns: `repeat(${data.metrics!.length}, minmax(0, 1fr))`, gap: 24 }}>
        {data.metrics!.map((m) => (
          <div key={m.label}>
            <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em' }}>{m.value}</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.75 }}>{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Big quote ───────────────────────────────────────────────────────

function SaasQuoteBand({ data }: { data: TemplateData }) {
  const t = data.testimonials![0]
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--t-display)', fontWeight: 500, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
          “{t.quote}”
        </p>
        <p style={{ margin: '28px 0 0', fontSize: 13, letterSpacing: '0.04em', color: 'var(--t-ink2)' }}>
          {t.author}{t.role ? `, ${t.role}` : ''}{t.org ? ` · ${t.org}` : ''}
        </p>
      </div>
    </section>
  )
}

// ── Pricing ────────────────────────────────────────────────────────

function SaasPricing({ data }: { data: TemplateData }) {
  const p = data.pricing!
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ maxWidth: 720, marginBottom: 48, textAlign: 'center', marginInline: 'auto' }}>
          {p.eyebrow && <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{p.eyebrow}</p>}
          <h2 style={{ margin: '12px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(1.7rem, 3.2vw, 2.6rem)', letterSpacing: '-0.025em' }}>
            {p.headline}
          </h2>
          {p.body && <p style={{ margin: '12px 0 0', fontSize: 16, color: 'var(--t-ink2)' }}>{p.body}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.tiers.length}, minmax(0, 1fr))`, gap: 16 }}>
          {p.tiers.map((tier) => (
            <div key={tier.name} style={{
              borderRadius: 16, padding: 28,
              background: tier.featured ? 'var(--t-ink)' : 'var(--t-surface)',
              color: tier.featured ? 'var(--t-bg)' : 'var(--t-ink)',
              border: tier.featured ? 'none' : '1px solid var(--t-surface-edge)',
              boxShadow: tier.featured ? '0 24px 60px -20px rgba(0,0,0,0.5)' : 'none',
              transform: tier.featured ? 'translateY(-8px)' : undefined,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: tier.featured ? 0.65 : 0.6 }}>{tier.name}</p>
                <p style={{ margin: '16px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 36, letterSpacing: '-0.03em' }}>{tier.price}</p>
                {tier.period && <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.65 }}>{tier.period}</p>}
                <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.55, opacity: 0.8 }}>{tier.description}</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                    <Check size={16} style={{ marginTop: 2, opacity: 0.8, flex: 'none' }} />
                    <span style={{ opacity: 0.9 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={tier.cta.href} style={{
                marginTop: 'auto', display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
                padding: '12px 20px', fontSize: 14, fontWeight: 500, borderRadius: 999, textDecoration: 'none',
                background: tier.featured ? 'var(--t-bg)' : 'var(--t-ink)',
                color: tier.featured ? 'var(--t-ink)' : 'var(--t-bg)',
              }}>{tier.cta.label}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────

function SaasFAQ({ data }: { data: TemplateData }) {
  const f = data.faq!
  const [openIdx, setOpenIdx] = React.useState<number | null>(0)
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          {f.eyebrow && <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{f.eyebrow}</p>}
          <h2 style={{ margin: '12px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.025em' }}>{f.headline}</h2>
        </div>
        <div style={{ borderTop: '1px solid var(--t-surface-edge)' }}>
          {f.faqs.map((q, i) => {
            const open = openIdx === i
            return (
              <button key={q.q} type="button" onClick={() => setOpenIdx(open ? null : i)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '20px 0', border: 'none', borderBottom: '1px solid var(--t-surface-edge)',
                background: 'transparent', color: 'var(--t-ink)', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--t-display)', fontWeight: 500, fontSize: 17 }}>{q.q}</span>
                  {open ? <Minus size={18} /> : <Plus size={18} />}
                </div>
                {open && <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--t-ink2)', maxWidth: '60ch' }}>{q.a}</p>}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Closing CTA ────────────────────────────────────────────────────

function SaasClosing({ data }: { data: TemplateData }) {
  const c = data.closing
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        borderRadius: 24, padding: '88px 56px',
        background: 'var(--t-ink)', color: 'var(--t-bg)',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 40px 100px -30px rgba(0,0,0,0.55)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--t-accent) 60%, transparent), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720 }}>
          {c.eyebrow && <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6 }}>{c.eyebrow}</p>}
          <h2 style={{ margin: '12px 0 0', fontFamily: 'var(--t-display)', fontWeight: 600, fontSize: 'clamp(2rem, 4vw, 3.4rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}>{c.headline}</h2>
          <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.55, opacity: 0.8 }}>{c.body}</p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={c.cta.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', fontSize: 14, fontWeight: 500, borderRadius: 999, background: 'var(--t-bg)', color: 'var(--t-ink)', textDecoration: 'none' }}>
              {c.cta.label} <ArrowUpRight size={16} />
            </a>
            {c.secondaryCta && (
              <a href={c.secondaryCta.href} style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 22px', fontSize: 14, fontWeight: 500, borderRadius: 999, background: 'transparent', color: 'var(--t-bg)', textDecoration: 'none', border: '1px solid color-mix(in srgb, var(--t-bg) 30%, transparent)' }}>
                {c.secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────

function SaasFooter({ data }: { data: TemplateData }) {
  const f = data.footer
  return (
    <footer style={{ padding: '64px 24px 40px', borderTop: '1px solid var(--t-surface-edge)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) repeat(' + Math.min(4, f.columns.length) + ', minmax(0, 1fr))', gap: 40 }}>
        <div>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--t-ink)', fontFamily: 'var(--t-display)', fontWeight: 600 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--t-ink)' }} />
            <span style={{ fontSize: 16, letterSpacing: '-0.01em' }}>{f.brand}</span>
          </a>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--t-ink2)', maxWidth: '32ch', lineHeight: 1.55 }}>{f.tagline}</p>
        </div>
        {f.columns.map((c) => (
          <div key={c.title}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t-ink2)' }}>{c.title}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} style={{ fontSize: 14, color: 'var(--t-ink)', textDecoration: 'none' }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid var(--t-surface-edge)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--t-ink2)' }}>
        <span>{f.legal}</span>
      </div>
    </footer>
  )
}
