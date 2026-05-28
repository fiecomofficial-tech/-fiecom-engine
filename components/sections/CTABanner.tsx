'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHref } from '../usePreviewHref'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

/**
 * Inline full-bleed CTA strip. Designed to sit between editorial blocks
 * as visual punctuation. Inverts the prevailing palette.
 */
export default function CTABanner({ data }: { data: SectionData }) {
  const c = data.content
  const rootRef = useRef<HTMLElement | null>(null)
  const ctaHref = usePreviewHref(c.cta?.href, '#contact')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const t = root.querySelector('.fie-cta-line')
      if (t) {
        const split = SplitText.create(t as Element, { type: 'words' })
        gsap.from(split.words, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.05,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 80%' },
        })
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        background: 'var(--fie-bg-accent, var(--fie-ink))',
        color: 'var(--fie-ink-on-accent-bg, var(--fie-on-accent))',
        paddingBlock: 'clamp(72px, 9vw, 140px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.6fr auto',
          gap: 'clamp(32px, 5vw, 80px)',
          alignItems: 'center',
        }}
        className="fie-cta-row"
      >
        <div>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                opacity: 0.68,
                marginBottom: 20,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          <h2
            className="fie-cta-line"
            style={{
              margin: 0,
              fontFamily: 'var(--fie-font-display, serif)',
              fontSize: 'clamp(2.2rem, 5vw, 4.4rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              textWrap: 'balance',
              maxWidth: '20ch',
            }}
          >
            {c.headline}
          </h2>
          {c.body && (
            <p
              style={{
                marginTop: 20,
                opacity: 0.78,
                fontSize: 'clamp(1rem, 1.1vw, 1.1rem)',
                lineHeight: 1.55,
                maxWidth: '52ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        {c.cta?.label && (
          <a
            href={ctaHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '18px 32px',
              borderRadius: 999,
              background: 'var(--fie-accent, currentColor)',
              color: 'var(--fie-on-accent, var(--fie-bg))',
              fontSize: '0.96rem',
              fontWeight: 500,
              textDecoration: 'none',
              letterSpacing: '0.01em',
              flexShrink: 0,
            }}
          >
            {c.cta.label} <span aria-hidden>→</span>
          </a>
        )}
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-cta-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
