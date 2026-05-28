'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Client {
  name: string
  /** Optional emphasis flag — slightly larger/bolder rendering */
  feature?: boolean
}

/**
 * Wordmark wall. Renders client names as flat type tiles (no logo asset
 * required) on a tinted surface row. AI gives the names; this paints
 * them with proportional weight so the wall reads as a real client list.
 */
export default function LogoCloud({ data }: { data: SectionData }) {
  const c = data.content
  const clients = ((c.clients as Client[] | undefined) ?? []).slice(0, 12)
  if (clients.length === 0) return null

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-surface, var(--fie-bg))',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(56px, 7vw, 100px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
        borderTop: '1px solid var(--fie-mute)',
        borderBottom: '1px solid var(--fie-mute)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 24,
              marginBottom: 'clamp(32px, 4vw, 56px)',
              flexWrap: 'wrap',
            }}
          >
            {c.eyebrow && (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  margin: 0,
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
                  fontSize: 'clamp(1.2rem, 1.5vw, 1.6rem)',
                  letterSpacing: '-0.01em',
                  color: 'var(--fie-ink-2, currentColor)',
                  fontWeight: 400,
                  maxWidth: '40ch',
                  textAlign: 'right',
                }}
              >
                {c.headline}
              </h2>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'clamp(8px, 1.2vw, 18px)',
            alignItems: 'stretch',
          }}
        >
          {clients.map((cl, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(18px, 2vw, 28px) clamp(14px, 1.6vw, 22px)',
                background: 'var(--fie-bg)',
                border: '1px solid var(--fie-mute)',
                borderRadius: 14,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: cl.feature ? 'clamp(1.2rem, 1.6vw, 1.6rem)' : 'clamp(1rem, 1.2vw, 1.2rem)',
                letterSpacing: '-0.01em',
                textAlign: 'center',
                lineHeight: 1.1,
                fontWeight: cl.feature ? 500 : 400,
                opacity: cl.feature ? 1 : 0.88,
              }}
            >
              {cl.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
