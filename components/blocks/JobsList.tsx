'use client'

import React from 'react'
import type { SectionData } from '../sections/types'
import { usePreviewHrefResolver } from '../usePreviewHref'

interface Job {
  role: string
  team?: string
  location?: string
  type?: string
  description?: string
  href?: string
}

interface JobGroup {
  team: string
  jobs: Job[]
}

/**
 * Careers index. Renders either flat jobs[] or grouped groups[].
 */
export default function JobsList({ data }: { data: SectionData }) {
  const c = data.content
  const previewHref = usePreviewHrefResolver()
  const groups: JobGroup[] =
    (c.groups as JobGroup[] | undefined) ??
    (c.jobs ? [{ team: 'Open roles', jobs: c.jobs as Job[] }] : [])
  if (!groups.length) return null

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
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div style={{ marginBottom: 'clamp(40px, 5vw, 64px)' }}>
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
            {c.headline && (
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--fie-font-display, serif)',
                  fontSize: 'clamp(2rem, 4.4vw, 3.6rem)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.02,
                  maxWidth: '20ch',
                }}
              >
                {c.headline}
              </h2>
            )}
            {c.body && (
              <p
                style={{
                  marginTop: 16,
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.6,
                  fontSize: '1rem',
                  maxWidth: '54ch',
                }}
              >
                {c.body}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(36px, 5vw, 56px)' }}>
          {groups.map((g, gi) => (
            <div key={gi}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--fie-mute)',
                  fontWeight: 500,
                }}
              >
                {g.team}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {g.jobs.map((j, ji) => (
                  <li
                    key={ji}
                    style={{
                      borderBottom: '1px solid var(--fie-mute)',
                    }}
                  >
                    <a
                      href={previewHref(j.href, '#')}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr auto',
                        gap: 'clamp(16px, 2vw, 32px)',
                        padding: 'clamp(20px, 2.4vw, 28px) 0',
                        color: 'inherit',
                        textDecoration: 'none',
                        alignItems: 'center',
                      }}
                      className="fie-job-row"
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--fie-font-display, serif)',
                            fontSize: 'clamp(1.1rem, 1.5vw, 1.5rem)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.15,
                          }}
                        >
                          {j.role}
                        </div>
                        {j.description && (
                          <p
                            style={{
                              marginTop: 6,
                              color: 'var(--fie-ink-2, currentColor)',
                              fontSize: '0.92rem',
                              lineHeight: 1.5,
                              maxWidth: '52ch',
                            }}
                          >
                            {j.description}
                          </p>
                        )}
                      </div>
                      <span style={{ color: 'var(--fie-ink-2, currentColor)', fontSize: '0.92rem' }}>
                        {j.location ?? '—'}
                      </span>
                      <span style={{ color: 'var(--fie-ink-2, currentColor)', fontSize: '0.92rem' }}>
                        {j.type ?? '—'}
                      </span>
                      <span
                        aria-hidden
                        style={{
                          fontSize: '0.92rem',
                          color: 'var(--fie-accent, currentColor)',
                        }}
                      >
                        Apply →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-job-row { grid-template-columns: 1fr !important; align-items: flex-start !important; }
        }
      `}</style>
    </section>
  )
}
