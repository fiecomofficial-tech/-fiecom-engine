'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import type { SectionData, SectionImage } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Feature {
  title: string
  body?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Bento mosaic of feature cells. Each cell rises into view on scroll
 * with staggered timing; sizes mix to create rhythm.
 */
export default function FeatureBento({ data }: { data: SectionData }) {
  const c = data.content
  const features = ((c.features as Feature[] | undefined) ?? []).slice(0, 8)
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const cells = root.querySelectorAll('.fie-bento-cell')
      gsap.from(cells, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 75%' },
      })
    },
    { scope: rootRef as any },
  )

  const sizeSpan = (size: Feature['size'], idx: number): React.CSSProperties => {
    const fallback = idx === 0 ? 'lg' : idx % 5 === 0 ? 'md' : 'sm'
    const s = size ?? fallback
    if (s === 'lg') return { gridColumn: 'span 2', gridRow: 'span 2' }
    if (s === 'md') return { gridColumn: 'span 2' }
    return {}
  }

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
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 'clamp(24px, 4vw, 56px)',
            marginBottom: 'clamp(40px, 6vw, 80px)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            {c.eyebrow && (
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  opacity: 0.65,
                  marginBottom: 18,
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
                  fontSize: 'clamp(2.4rem, 6vw, 5.5rem)',
                  lineHeight: 1.0,
                  letterSpacing: '-0.025em',
                  textWrap: 'balance',
                  maxWidth: '18ch',
                }}
              >
                {c.headline}
              </h2>
            )}
          </div>
          {c.body && (
            <p
              style={{
                maxWidth: '46ch',
                opacity: 0.78,
                lineHeight: 1.6,
                fontSize: 'clamp(1rem, 1.05vw, 1.05rem)',
                margin: 0,
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridAutoRows: 'minmax(220px, auto)',
            gap: 'clamp(14px, 1.4vw, 22px)',
          }}
          className="fie-bento-grid"
        >
          {features.map((f, i) => {
            const img = gallery[i % Math.max(1, gallery.length)]
            const hasImage = !!img && (f.size === 'lg' || i === 0 || i % 4 === 0)
            return (
              <article
                key={i}
                className="fie-bento-cell"
                style={{
                  ...sizeSpan(f.size, i),
                  position: 'relative',
                  borderRadius: 22,
                  overflow: 'hidden',
                  padding: 'clamp(20px, 2vw, 32px)',
                  background: hasImage
                    ? '#111'
                    : 'color-mix(in oklab, var(--fie-ink) 4%, var(--fie-bg))',
                  border: '1px solid color-mix(in oklab, currentColor 12%, transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  minHeight: 220,
                  color: hasImage ? '#fff' : 'var(--fie-ink)',
                }}
              >
                {hasImage && img && (
                  <>
                    <img
                      src={img.url}
                      alt={img.alt ?? f.title}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.72,
                      }}
                      draggable={false}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65) 100%)',
                      }}
                    />
                  </>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--fie-font-display, serif)',
                      fontSize: 'clamp(1.2rem, 1.7vw, 1.7rem)',
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.title}
                  </h3>
                  {f.body && (
                    <p
                      style={{
                        marginTop: 12,
                        opacity: 0.78,
                        fontSize: '0.92rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {f.body}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-bento-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
