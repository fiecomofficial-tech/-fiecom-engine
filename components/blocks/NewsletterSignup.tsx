'use client'

import React, { useState } from 'react'
import type { SectionData } from '../sections/types'

export default function NewsletterSignup({ data }: { data: SectionData }) {
  const c = data.content
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setDone(true)
  }

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-surface, var(--fie-bg))',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(72px, 9vw, 120px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
        borderTop: '1px solid var(--fie-mute)',
        borderBottom: '1px solid var(--fie-mute)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'clamp(28px, 4vw, 64px)',
          alignItems: 'center',
        }}
        className="fie-newsletter-row"
      >
        <div>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                marginBottom: 14,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--fie-font-display, serif)',
              fontSize: 'clamp(1.8rem, 3.6vw, 3.2rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              maxWidth: '18ch',
            }}
          >
            {c.headline ?? 'Subscribe to the field notes.'}
          </h2>
          {c.body && (
            <p
              style={{
                marginTop: 14,
                color: 'var(--fie-ink-2, currentColor)',
                lineHeight: 1.55,
                fontSize: '0.98rem',
                maxWidth: '46ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        {done ? (
          <p style={{ fontSize: '1rem', color: 'var(--fie-ink-2, currentColor)' }}>
            Thanks — first dispatch lands in your inbox shortly.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'stretch',
              padding: 6,
              borderRadius: 999,
              background: 'var(--fie-bg)',
              border: '1px solid var(--fie-mute)',
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={(c.placeholder as string) ?? 'you@studio.co'}
              style={{
                flex: 1,
                background: 'transparent',
                color: 'var(--fie-ink)',
                border: 'none',
                outline: 'none',
                padding: '12px 18px',
                fontSize: '0.96rem',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 22px',
                borderRadius: 999,
                background: 'var(--fie-accent)',
                color: 'var(--fie-on-accent)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.92rem',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              {(c.cta as { label: string } | undefined)?.label ?? 'Subscribe'}
            </button>
          </form>
        )}
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-newsletter-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
