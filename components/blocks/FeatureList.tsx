'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Feature {
  title: string
  body: string
  meta?: string
}

/**
 * Tall vertical feature list — title + body rows with a quiet hairline.
 * Designed for utility sub-pages where Bento would feel too "marketing".
 */
export default function FeatureList({ data }: { data: SectionData }) {
  const c = data.content
  const features = ((c.features as Feature[] | undefined) ?? []).slice(0, 12)

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
          gridTemplateColumns: '1fr 1.6fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-flist-layout"
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
                fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                maxWidth: '16ch',
              }}
            >
              {c.headline}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                marginTop: 22,
                color: 'var(--fie-ink-2, currentColor)',
                lineHeight: 1.6,
                fontSize: '0.98rem',
                maxWidth: '36ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {features.map((f, i) => (
            <li
              key={i}
              style={{
                paddingBlock: 'clamp(20px, 2.4vw, 32px)',
                borderTop: '1px solid var(--fie-mute)',
                borderBottom:
                  i === features.length - 1 ? '1px solid var(--fie-mute)' : undefined,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 'clamp(16px, 2vw, 32px)',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.3em',
                  color: 'var(--fie-ink-2, currentColor)',
                  minWidth: '3ch',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--fie-font-display, serif)',
                    fontSize: 'clamp(1.15rem, 1.5vw, 1.6rem)',
                    lineHeight: 1.18,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    marginTop: 10,
                    color: 'var(--fie-ink-2, currentColor)',
                    lineHeight: 1.6,
                    fontSize: '0.98rem',
                    maxWidth: '60ch',
                  }}
                >
                  {f.body}
                </p>
              </div>
              {f.meta && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--fie-ink-2, currentColor)',
                  }}
                >
                  {f.meta}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-flist-layout { grid-template-columns: 1fr !important; }
          .fie-flist-layout > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  )
}
