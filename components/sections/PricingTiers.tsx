'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHrefResolver } from '../usePreviewHref'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Tier {
  name?: string
  price?: string
  period?: string
  description?: string
  features?: string[]
  featured?: boolean
  cta?: { label?: string; href?: string }
}

export default function PricingTiers({ data }: { data: SectionData }) {
  const c = data.content
  const tiers = ((c.tiers as Tier[] | undefined) ?? [])
    .filter((t): t is Tier => !!t && typeof t === 'object')
    .slice(0, 4)
  const rootRef = useRef<HTMLElement | null>(null)
  const previewHref = usePreviewHrefResolver()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const cards = root.querySelectorAll('.fie-price-card')
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 78%' },
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(96px, 12vw, 180px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 7vw, 96px)' }}>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                opacity: 0.6,
                marginBottom: 20,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          {c.headline && (
            <h2
              style={{
                margin: '0 auto',
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                textWrap: 'balance',
                maxWidth: '22ch',
              }}
            >
              {c.headline}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                marginTop: 20,
                opacity: 0.72,
                fontSize: 'clamp(1rem, 1.1vw, 1.1rem)',
                maxWidth: '52ch',
                marginInline: 'auto',
                lineHeight: 1.55,
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(tiers.length || 1, 3)}, 1fr)`,
            gap: 'clamp(20px, 2vw, 28px)',
          }}
          className="fie-price-grid"
        >
          {tiers.map((t, i) => (
            <article
              key={i}
              className="fie-price-card"
              style={{
                position: 'relative',
                padding: 'clamp(28px, 3vw, 40px)',
                borderRadius: 22,
                background: t.featured
                  ? 'var(--fie-ink)'
                  : 'color-mix(in oklab, var(--fie-ink) 4%, var(--fie-bg))',
                color: t.featured ? 'var(--fie-bg)' : 'var(--fie-ink)',
                border: t.featured
                  ? '1px solid transparent'
                  : '1px solid color-mix(in oklab, currentColor 12%, transparent)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(20px, 2vw, 28px)',
                transform: t.featured ? 'translateY(-12px)' : undefined,
              }}
            >
              {t.featured && (
                <span
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: '0.72rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: 'var(--fie-accent, #e9aa56)',
                    color: 'var(--fie-on-accent, #1a120c)',
                    fontWeight: 600,
                  }}
                >
                  Featured
                </span>
              )}

              <div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    opacity: 0.65,
                    margin: 0,
                  }}
                >
                  {t.name}
                </p>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'var(--fie-font-display, serif)',
                      fontSize: 'clamp(2.4rem, 4vw, 3.6rem)',
                      lineHeight: 1.0,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {t.price}
                  </span>
                  {t.period && <span style={{ opacity: 0.6, fontSize: '0.92rem' }}>/ {t.period}</span>}
                </div>
                {t.description && (
                  <p style={{ marginTop: 12, opacity: 0.72, fontSize: '0.92rem', lineHeight: 1.55 }}>
                    {t.description}
                  </p>
                )}
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid color-mix(in oklab, currentColor 14%, transparent)',
                  paddingTop: 22,
                  flex: 1,
                }}
              >
                {(t.features ?? []).map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 12, fontSize: '0.94rem' }}>
                    <span aria-hidden style={{ opacity: 0.5 }}>—</span>
                    <span style={{ opacity: 0.88, lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {t.cta?.label && (
                <a
                  href={previewHref(t.cta.href, '#start')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '14px 22px',
                    borderRadius: 999,
                    background: t.featured ? 'var(--fie-accent, #e9aa56)' : 'currentColor',
                    color: t.featured ? 'var(--fie-on-accent, #1a120c)' : 'var(--fie-bg)',
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {t.cta.label} <span aria-hidden>→</span>
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-price-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
