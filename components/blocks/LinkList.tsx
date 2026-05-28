'use client'

import React from 'react'
import type { SectionData } from '../sections/types'
import { usePreviewHrefResolver } from '../usePreviewHref'

interface LinkItem {
  label: string
  description?: string
  href?: string
  meta?: string
}

interface Group {
  title: string
  links: LinkItem[]
}

/**
 * Sitemap-style grouped link list. Useful for docs landing, resource
 * indexes, or footers-as-content. Each link row has label + description.
 */
export default function LinkList({ data }: { data: SectionData }) {
  const c = data.content
  const groups = ((c.groups as Group[] | undefined) ?? []).slice(0, 6)
  const previewHref = usePreviewHrefResolver()

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
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div style={{ marginBottom: 'clamp(40px, 5vw, 72px)' }}>
            {c.eyebrow && (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  marginBottom: 12,
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
                  fontSize: 'clamp(2rem, 4.6vw, 4rem)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.02,
                  maxWidth: '20ch',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(28px, 4vw, 56px)',
          }}
        >
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
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                {g.title}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {g.links.map((l, li) => (
                  <li
                    key={li}
                    style={{
                      paddingBlock: 14,
                      borderBottom:
                        li === g.links.length - 1 ? 'none' : '1px solid var(--fie-mute)',
                    }}
                  >
                    <a
                      href={previewHref(l.href, '#')}
                      style={{
                        color: 'currentColor',
                        textDecoration: 'none',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 14,
                        alignItems: 'baseline',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--fie-font-display, serif)',
                            fontSize: 'clamp(1.05rem, 1.25vw, 1.25rem)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {l.label}
                        </div>
                        {l.description && (
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: '0.92rem',
                              opacity: 0.7,
                              lineHeight: 1.5,
                            }}
                          >
                            {l.description}
                          </p>
                        )}
                      </div>
                      <span
                        aria-hidden
                        style={{
                          fontSize: '0.78rem',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: 'var(--fie-ink-2, currentColor)',
                        }}
                      >
                        {l.meta ?? '→'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
