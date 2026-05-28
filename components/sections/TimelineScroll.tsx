'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import type { SectionData } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Event {
  year: string
  title: string
  body: string
}

export default function TimelineScroll({ data }: { data: SectionData }) {
  const c = data.content
  const events = ((c.events as Event[] | undefined) ?? []).slice(0, 8)
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const line = root.querySelector('.fie-timeline-line') as HTMLElement | null
      const items = root.querySelectorAll('.fie-timeline-item')

      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top 40%',
              end: 'bottom 80%',
              scrub: 0.6,
            },
          },
        )
      }

      items.forEach((el, i) => {
        gsap.from(el, {
          x: i % 2 === 0 ? -60 : 60,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 78%' },
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
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(64px, 8vw, 120px)' }}>
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
              style={{
                margin: '0 auto',
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                textWrap: 'balance',
                maxWidth: '22ch',
              }}
            >
              {c.headline}
            </h2>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div
            className="fie-timeline-line"
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: 1,
              transform: 'translateX(-0.5px)',
              background: 'currentColor',
              opacity: 0.25,
              transformOrigin: 'top center',
            }}
          />

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(48px, 6vw, 96px)' }}>
            {events.map((e, i) => {
              const right = i % 2 === 1
              return (
                <li
                  key={i}
                  className="fie-timeline-item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: 'clamp(20px, 3vw, 40px)',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ textAlign: right ? 'right' : 'right', visibility: right ? 'hidden' : undefined }}>
                    {!right && (
                      <EventCard e={e} />
                    )}
                  </div>
                  <div
                    aria-hidden
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: 'var(--fie-accent, #e9aa56)',
                      marginTop: 14,
                      boxShadow: '0 0 0 4px var(--fie-bg)',
                    }}
                  />
                  <div style={{ visibility: right ? undefined : 'hidden' }}>
                    {right && <EventCard e={e} />}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-timeline-item { grid-template-columns: 24px 1fr !important; }
          .fie-timeline-item > div:first-child { display: none !important; }
          .fie-timeline-item > div:last-child { visibility: visible !important; text-align: left !important; }
          .fie-timeline-line { left: 12px !important; }
        }
      `}</style>
    </section>
  )
}

function EventCard({ e }: { e: Event }) {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--fie-font-display, serif)',
          fontSize: 'clamp(1.4rem, 1.8vw, 1.8rem)',
          margin: 0,
          letterSpacing: '-0.02em',
          opacity: 0.85,
        }}
      >
        {e.year}
      </p>
      <h3
        style={{
          margin: '6px 0 8px',
          fontSize: 'clamp(1.1rem, 1.4vw, 1.4rem)',
          letterSpacing: '-0.01em',
        }}
      >
        {e.title}
      </h3>
      <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.55, fontSize: '0.96rem', maxWidth: '38ch' }}>
        {e.body}
      </p>
    </div>
  )
}
