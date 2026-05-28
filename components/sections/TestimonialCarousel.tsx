'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef, useState } from 'react'
import type { SectionData, SectionImage } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Testimonial {
  quote: string
  author: string
  role?: string
  org?: string
}

export default function TestimonialCarousel({ data }: { data: SectionData }) {
  const c = data.content
  const items = ((c.testimonials as Testimonial[] | undefined) ?? []).slice(0, 8)
  const avatars: SectionImage[] = data.images?.gallery ?? []
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!stageRef.current) return
      gsap.fromTo(
        stageRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
      )
    },
    { dependencies: [active] },
  )

  if (!items.length) return null
  const cur = items[active]
  const avatar = avatars[active % Math.max(1, avatars.length)]

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
        {c.eyebrow && (
          <p
            style={{
              fontSize: '0.78rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              opacity: 0.6,
              marginBottom: 32,
            }}
          >
            {c.eyebrow}
          </p>
        )}

        <div
          ref={stageRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 320px) 1fr',
            gap: 'clamp(32px, 5vw, 72px)',
            alignItems: 'center',
          }}
          className="fie-quote-stage"
        >
          {avatar && (
            <div
              style={{
                aspectRatio: '4 / 5',
                borderRadius: 24,
                overflow: 'hidden',
                background: '#111',
              }}
            >
              <img
                src={avatar.url}
                alt={avatar.alt ?? cur.author}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </div>
          )}

          <div>
            <p
              aria-hidden
              style={{
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(4rem, 8vw, 8rem)',
                lineHeight: 0.7,
                margin: '0 0 -0.2em 0',
                opacity: 0.16,
                letterSpacing: '-0.05em',
              }}
            >
              &ldquo;
            </p>
            <blockquote
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(1.4rem, 2.6vw, 2.6rem)',
                lineHeight: 1.18,
                letterSpacing: '-0.018em',
                textWrap: 'pretty',
                maxWidth: '32ch',
              }}
            >
              {cur.quote}
            </blockquote>
            <div
              style={{
                marginTop: 'clamp(28px, 3vw, 40px)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                flexWrap: 'wrap',
                opacity: 0.85,
              }}
            >
              <span style={{ fontWeight: 500 }}>{cur.author}</span>
              {(cur.role || cur.org) && (
                <span style={{ opacity: 0.6, fontSize: '0.92rem' }}>
                  {cur.role}
                  {cur.role && cur.org ? ' · ' : ''}
                  {cur.org}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 'clamp(40px, 5vw, 64px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            borderTop: '1px solid color-mix(in oklab, currentColor 14%, transparent)',
            paddingTop: 24,
          }}
        >
          <span style={{ opacity: 0.55, fontSize: '0.9rem' }}>
            {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => setActive((a) => (a - 1 + items.length) % items.length)}
              aria-label="Previous"
              style={btnStyle}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setActive((a) => (a + 1) % items.length)}
              aria-label="Next"
              style={btnStyle}
            >
              →
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-quote-stage { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

const btnStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 999,
  border: '1px solid color-mix(in oklab, currentColor 25%, transparent)',
  background: 'transparent',
  color: 'currentColor',
  cursor: 'pointer',
  fontSize: '1rem',
}
