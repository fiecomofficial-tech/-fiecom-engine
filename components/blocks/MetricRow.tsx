'use client'

import React from 'react'
import type { SectionData } from '../sections/types'

interface Metric {
  value: string
  label: string
  delta?: string
  trend?: 'up' | 'down' | 'flat'
}

/**
 * Dashboard-style KPI row — flat, no scrub motion. Use for app shells
 * and admin pages where data hierarchy matters more than choreography.
 */
export default function MetricRow({ data }: { data: SectionData }) {
  const c = data.content
  const metrics = ((c.metrics as Metric[] | undefined) ?? []).slice(0, 6)

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(40px, 5vw, 72px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div style={{ marginBottom: 'clamp(24px, 3vw, 40px)' }}>
            {c.eyebrow && (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  marginBottom: 10,
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
                  fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.1,
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
            gridTemplateColumns: `repeat(${Math.min(metrics.length || 1, 4)}, 1fr)`,
            gap: 'clamp(12px, 1.4vw, 20px)',
          }}
          className="fie-metric-grid"
        >
          {metrics.map((m, i) => (
            <article
              key={i}
              style={{
                padding: 'clamp(18px, 2vw, 28px)',
                background: 'var(--fie-surface, transparent)',
                border: '1px solid var(--fie-surface-edge, var(--fie-mute))',
                borderRadius: 18,
              }}
            >
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  margin: 0,
                }}
              >
                {m.label}
              </p>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--fie-font-display, serif)',
                    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                    lineHeight: 1.0,
                    letterSpacing: '-0.025em',
                  }}
                >
                  {m.value}
                </span>
                {m.delta && (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: trendBg(m.trend),
                      color: trendInk(m.trend),
                      letterSpacing: '0.01em',
                    }}
                  >
                    {arrow(m.trend)} {m.delta}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-metric-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .fie-metric-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function arrow(t?: Metric['trend']): string {
  if (t === 'up') return '↗'
  if (t === 'down') return '↘'
  return '→'
}
function trendBg(t?: Metric['trend']): string {
  if (t === 'up') return 'color-mix(in oklab, #1f8a3d 22%, transparent)'
  if (t === 'down') return 'color-mix(in oklab, #c0392b 22%, transparent)'
  return 'var(--fie-mute)'
}
function trendInk(t?: Metric['trend']): string {
  if (t === 'up') return '#1f8a3d'
  if (t === 'down') return '#c0392b'
  return 'currentColor'
}
