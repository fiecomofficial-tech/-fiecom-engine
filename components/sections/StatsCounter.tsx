'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface Stat {
  value: number
  suffix?: string
  prefix?: string
  label: string
}

export default function StatsCounter({ data }: { data: SectionData }) {
  const c = data.content
  const stats = ((c.stats as Stat[] | undefined) ?? []).slice(0, 4)
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const els = root.querySelectorAll<HTMLElement>('[data-counter]')
      els.forEach((el) => {
        const target = Number(el.dataset.counter)
        if (!Number.isFinite(target)) return
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 2.0,
          ease: 'power2.out',
          onUpdate: () => {
            const v = Math.round(obj.v)
            el.textContent = v.toLocaleString()
          },
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      const titleEl = root.querySelector('.fie-stats-title')
      if (titleEl) {
        const split = SplitText.create(titleEl as Element, { type: 'lines', linesClass: 'paragraph-line' })
        gsap.from(split.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 78%' },
        })
      }
    },
    { scope: rootRef as any },
  )

  return (
    <section
      ref={rootRef as any}
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(96px, 12vw, 180px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
        borderTop: '1px solid color-mix(in oklab, currentColor 10%, transparent)',
        borderBottom: '1px solid color-mix(in oklab, currentColor 10%, transparent)',
      }}
    >
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div style={{ marginBottom: 'clamp(48px, 7vw, 96px)' }}>
            {c.eyebrow && (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                  marginBottom: 20,
                }}
              >
                {c.eyebrow}
              </p>
            )}
            {c.headline && (
              <h2
                className="fie-stats-title"
                style={{
                  margin: 0,
                  fontFamily: 'var(--fie-font-display, serif)',
                  fontSize: 'clamp(2.2rem, 5vw, 4.8rem)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.025em',
                  textWrap: 'balance',
                  maxWidth: '24ch',
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
            gridTemplateColumns: `repeat(${Math.min(stats.length || 1, 4)}, 1fr)`,
            gap: 'clamp(28px, 4vw, 56px)',
          }}
          className="fie-stats-grid"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                borderTop: '1px solid color-mix(in oklab, currentColor 18%, transparent)',
                paddingTop: 'clamp(20px, 2vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fie-font-display, serif)',
                  fontSize: 'clamp(3rem, 6.5vw, 6.5rem)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.04em',
                }}
              >
                {s.prefix ?? ''}
                <span data-counter={s.value}>0</span>
                {s.suffix ?? ''}
              </div>
              <p
                style={{
                  margin: 0,
                  opacity: 0.7,
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  maxWidth: '28ch',
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .fie-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
