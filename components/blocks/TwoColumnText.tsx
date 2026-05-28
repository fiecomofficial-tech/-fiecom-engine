'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Paragraph {
  heading?: string
  body: string
}

/**
 * Editorial two-column long-form. Use on about / manifesto / case-study
 * sub-pages where prose is the main content. Lighter than ManifestoIntro
 * — no motion, just typography.
 */
export default function TwoColumnText({ data }: { data: SectionData }) {
  const c = data.content
  const paragraphs = ((c.paragraphs as Paragraph[] | undefined) ?? []).slice(0, 8)

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-two-col-layout"
      >
        <div style={{ position: 'sticky', top: 120 }}>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                marginBottom: 16,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          {c.headline && (
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.2rem, 5vw, 4rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                maxWidth: '14ch',
              }}
            >
              {c.headline}
            </h2>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(28px, 4vw, 48px)',
          }}
        >
          {paragraphs.map((p, i) => (
            <div key={i}>
              {p.heading && (
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--fie-font-display, serif)',
                    fontSize: 'clamp(1.2rem, 1.6vw, 1.6rem)',
                    letterSpacing: '-0.01em',
                    marginBottom: 12,
                  }}
                >
                  {p.heading}
                </h3>
              )}
              <p
                style={{
                  margin: 0,
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.65,
                  fontSize: 'clamp(1.02rem, 1.1vw, 1.12rem)',
                  textWrap: 'pretty',
                }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-two-col-layout { grid-template-columns: 1fr !important; }
          .fie-two-col-layout > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  )
}
