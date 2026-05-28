'use client'

import React from 'react'
import type { SectionData } from '../sections/types'
import { usePreviewHrefResolver } from '../usePreviewHref'

interface Crumb {
  label: string
  href?: string
}

/**
 * Compact page header for interior pages (not the home hero). Adds a
 * breadcrumb row + display heading without the full cinematic hero.
 */
export default function PageHeader({ data }: { data: SectionData }) {
  const c = data.content
  const crumbs = (c.crumbs as Crumb[] | undefined) ?? []
  const previewHref = usePreviewHrefResolver()

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(96px, 10vw, 132px) clamp(40px, 4.5vw, 64px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(20px, 3vw, 64px)',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          {crumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                fontSize: '0.78rem',
                letterSpacing: '0.08em',
                color: 'var(--fie-ink-2, currentColor)',
                opacity: 0.7,
                marginBottom: 'clamp(16px, 1.6vw, 22px)',
                flexWrap: 'wrap',
              }}
            >
              {crumbs.map((cr, i) => (
                <React.Fragment key={i}>
                  <a
                    href={previewHref(cr.href, '#')}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      opacity: i === crumbs.length - 1 ? 1 : 0.65,
                    }}
                  >
                    {cr.label}
                  </a>
                  {i < crumbs.length - 1 && <span aria-hidden style={{ opacity: 0.4 }}>·</span>}
                </React.Fragment>
              ))}
            </nav>
          )}

          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                opacity: 0.7,
                marginBottom: 14,
              }}
            >
              {c.eyebrow}
            </p>
          )}

          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--fie-font-display, serif)',
              fontSize: 'clamp(2.1rem, 4.4vw, 3.8rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.024em',
              textWrap: 'balance',
              maxWidth: '18ch',
            }}
          >
            {c.headline}
          </h1>
        </div>

        {c.body && (
          <p
            style={{
              flex: '1 1 300px',
              margin: 0,
              color: 'var(--fie-ink-2, currentColor)',
              lineHeight: 1.55,
              fontSize: 'clamp(0.98rem, 1.05vw, 1.1rem)',
              maxWidth: '46ch',
              paddingBottom: 6,
            }}
          >
            {c.body}
          </p>
        )}
      </div>
    </section>
  )
}
