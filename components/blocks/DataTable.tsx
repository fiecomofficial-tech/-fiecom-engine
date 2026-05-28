'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

/**
 * Editorial-grade table for app shells / pricing comparisons / changelogs.
 * No motion — clarity first.
 */
export default function DataTable({ data }: { data: SectionData }) {
  const c = data.content
  const columns = (c.columns as Column[] | undefined) ?? []
  const rows = (c.rows as Array<Record<string, string>> | undefined) ?? []

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
          <div style={{ marginBottom: 'clamp(28px, 4vw, 48px)' }}>
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
                  fontSize: 'clamp(1.8rem, 3.4vw, 3rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.04,
                  maxWidth: '24ch',
                }}
              >
                {c.headline}
              </h2>
            )}
            {c.body && (
              <p
                style={{
                  marginTop: 14,
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.55,
                  fontSize: '1rem',
                  maxWidth: '54ch',
                }}
              >
                {c.body}
              </p>
            )}
          </div>
        )}

        <div
          style={{
            border: '1px solid var(--fie-mute)',
            borderRadius: 18,
            overflow: 'hidden',
            background: 'var(--fie-surface, transparent)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'inherit',
                fontSize: '0.96rem',
              }}
            >
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        textAlign: col.align ?? 'left',
                        padding: '16px 20px',
                        fontSize: '0.74rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'var(--fie-ink-2, currentColor)',
                        fontWeight: 500,
                        borderBottom: '1px solid var(--fie-mute)',
                        background: 'var(--fie-bg)',
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--fie-mute)',
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align ?? 'left',
                          padding: '18px 20px',
                          lineHeight: 1.5,
                          verticalAlign: 'top',
                        }}
                      >
                        {row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
