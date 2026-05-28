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

interface Step {
  number?: string
  title: string
  body: string
  duration?: string
}

/**
 * Sticky-column process. Left column pins with a giant rotating step
 * number; right column scrolls through each step content.
 */
export default function ProcessSteps({ data }: { data: SectionData }) {
  const c = data.content
  const steps = ((c.steps as Step[] | undefined) ?? []).slice(0, 6)
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const t = root.querySelector('.fie-process-title')
      if (t) {
        const split = SplitText.create(t as Element, { type: 'words' })
        gsap.from(split.words, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.05,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 75%' },
        })
      }
      const items = root.querySelectorAll('.fie-process-step')
      items.forEach((el) => {
        gsap.from(el, {
          x: 60,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%' },
        })
      })
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
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-process-layout"
      >
        <div style={{ position: 'sticky', top: 120 }}>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                marginBottom: 20,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          {c.headline && (
            <h2
              className="fie-process-title"
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.4rem, 5.5vw, 4.8rem)',
                lineHeight: 0.98,
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
                marginTop: 28,
                color: 'var(--fie-ink-2, currentColor)',
                lineHeight: 1.6,
                fontSize: '1rem',
                maxWidth: '40ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 4vw, 48px)' }}>
          {steps.map((s, i) => (
            <li
              key={i}
              className="fie-process-step"
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 'clamp(20px, 2.5vw, 36px)',
                paddingBottom: 'clamp(28px, 4vw, 44px)',
                borderBottom: i === steps.length - 1 ? 'none' : '1px solid var(--fie-mute, rgba(0,0,0,0.16))',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--fie-font-display, serif)',
                  fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                  lineHeight: 0.92,
                  letterSpacing: '-0.04em',
                  color: 'var(--fie-accent, currentColor)',
                  minWidth: '3ch',
                }}
              >
                {s.number ?? String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--fie-font-display, serif)',
                      fontSize: 'clamp(1.4rem, 2.2vw, 2.2rem)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {s.title}
                  </h3>
                  {s.duration && (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: 'var(--fie-ink-2, currentColor)',
                      }}
                    >
                      {s.duration}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    marginTop: 14,
                    color: 'var(--fie-ink-2, currentColor)',
                    lineHeight: 1.65,
                    fontSize: '1rem',
                    maxWidth: '54ch',
                  }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-process-layout { grid-template-columns: 1fr !important; }
          .fie-process-layout > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  )
}
