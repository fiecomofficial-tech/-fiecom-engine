'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHref } from '../usePreviewHref'
import { MediaBg } from '../MediaBg'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

export default function ClosingCTA({ data }: { data: SectionData }) {
  const c = data.content
  const img = data.images?.primary
  const ctaHref = usePreviewHref(c.cta?.href, '#contact')
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const ready =
        typeof document !== 'undefined' && 'fonts' in document
          ? (document as Document & { fonts: FontFaceSet }).fonts.ready
          : Promise.resolve()
      ready.then(() => {
        const titleEl = root.querySelector('.cta-title')
        if (!titleEl) return
        const split = SplitText.create(titleEl as Element, { type: 'words' })
        gsap
          .timeline({
            scrollTrigger: { trigger: root, start: 'top 65%' },
          })
          .from(split.words, {
            yPercent: 120,
            opacity: 0,
            stagger: 0.06,
            duration: 0.9,
            ease: 'power3.out',
          })
          .to(
            '.cta-clip',
            {
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              duration: 1,
              ease: 'circ.out',
            },
            '-=0.5',
          )
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fie-bg-deep, #0a0805)',
        color: 'var(--fie-ink-on-deep, var(--fie-ink))',
      }}
    >
      {img && <MediaBg image={img} style={{ opacity: 0.35 }} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, color-mix(in oklab, var(--fie-bg-deep) 20%, transparent) 0%, var(--fie-bg-deep) 82%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'clamp(40px, 6vw, 96px)',
          textAlign: 'center',
          maxWidth: 1200,
        }}
      >
        {c.eyebrow && (
          <p
            style={{
              fontSize: '0.78rem',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: 'clamp(28px, 4vw, 56px)',
            }}
          >
            {c.eyebrow}
          </p>
        )}

        <h2
          className="cta-title"
          style={{
            margin: 0,
            fontFamily: 'var(--fie-font-display, serif)',
            fontSize: 'clamp(2.6rem, 8.5vw, 8rem)',
            lineHeight: 0.96,
            letterSpacing: '-0.035em',
            textWrap: 'balance',
          }}
        >
          {c.headline}
        </h2>

        {c.subhead && (
          <div
            className="cta-clip"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
              maxWidth: '52ch',
              margin: 'clamp(28px, 4vw, 44px) auto 0',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.25vw, 1.25rem)',
                opacity: 0.85,
                lineHeight: 1.55,
              }}
            >
              {c.subhead}
            </p>
          </div>
        )}

        {c.cta?.label && (
          <a
            href={ctaHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 'clamp(36px, 5vw, 56px)',
              padding: '16px 32px',
              borderRadius: 999,
              background: 'var(--fie-accent, #e9aa56)',
              color: 'var(--fie-on-accent, #1a120c)',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {c.cta.label} <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </section>
  )
}
