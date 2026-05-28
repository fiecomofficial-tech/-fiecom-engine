'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Entry {
  date: string
  version?: string
  title: string
  body: string
  tag?: 'new' | 'fix' | 'improvement' | 'breaking'
}

const TAG_LABEL: Record<NonNullable<Entry['tag']>, string> = {
  new: 'New',
  fix: 'Fix',
  improvement: 'Improvement',
  breaking: 'Breaking',
}

const TAG_COLOR: Record<NonNullable<Entry['tag']>, string> = {
  new: '#1f8a3d',
  improvement: '#2347ff',
  fix: '#c98b58',
  breaking: '#c0392b',
}

export default function ChangelogList({ data }: { data: SectionData }) {
  const c = data.content
  const entries = ((c.entries as Entry[] | undefined) ?? []).slice(0, 24)
  if (!entries.length) return null

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(72px, 9vw, 120px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'flex-start',
        }}
        className="fie-changelog-layout"
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
                fontSize: 'clamp(2rem, 4.4vw, 3.4rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
                maxWidth: '12ch',
              }}
            >
              {c.headline}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                marginTop: 18,
                color: 'var(--fie-ink-2, currentColor)',
                lineHeight: 1.6,
                fontSize: '0.96rem',
                maxWidth: '36ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {entries.map((e, i) => (
            <li
              key={i}
              style={{
                paddingBlock: 'clamp(22px, 2.6vw, 36px)',
                borderTop: '1px solid var(--fie-mute)',
                borderBottom: i === entries.length - 1 ? '1px solid var(--fie-mute)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'baseline',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                <time
                  dateTime={e.date}
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--fie-ink-2, currentColor)',
                    fontFamily: 'var(--fie-font-display, serif)',
                  }}
                >
                  {e.date}
                </time>
                {e.version && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--fie-mute)',
                      color: 'var(--fie-ink-2, currentColor)',
                    }}
                  >
                    v{e.version}
                  </span>
                )}
                {e.tag && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: `color-mix(in oklab, ${TAG_COLOR[e.tag]} 22%, transparent)`,
                      color: TAG_COLOR[e.tag],
                      fontWeight: 500,
                    }}
                  >
                    {TAG_LABEL[e.tag]}
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--fie-font-display, serif)',
                  fontSize: 'clamp(1.15rem, 1.5vw, 1.5rem)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                {e.title}
              </h3>
              <p
                style={{
                  marginTop: 8,
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.6,
                  fontSize: '0.96rem',
                  maxWidth: '64ch',
                }}
              >
                {e.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-changelog-layout { grid-template-columns: 1fr !important; }
          .fie-changelog-layout > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  )
}
