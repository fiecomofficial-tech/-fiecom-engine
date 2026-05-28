'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import type { SectionData, SectionImage } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Caption {
  title: string
  year?: string
}

/**
 * Editorial gallery — three columns scroll at slightly different speeds,
 * each tile rises into view with a clip-path expansion.
 */
export default function ImageGallery({ data }: { data: SectionData }) {
  const c = data.content
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const captions = ((c.captions as Caption[] | undefined) ?? []).slice(0, gallery.length)
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const cols = root.querySelectorAll<HTMLElement>('.fie-gal-col')
      cols.forEach((col, i) => {
        const shift = i === 0 ? 0 : i === 1 ? -80 : 80
        gsap.fromTo(
          col,
          { y: 0 },
          {
            y: shift,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })

      const tiles = root.querySelectorAll('.fie-gal-tile')
      tiles.forEach((t) => {
        gsap.from(t, {
          clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
          duration: 1.1,
          ease: 'circ.out',
          scrollTrigger: { trigger: t, start: 'top 88%' },
        })
      })
    },
    { scope: rootRef as any },
  )

  if (!gallery.length) return null
  const buckets: SectionImage[][] = [[], [], []]
  gallery.forEach((g, i) => buckets[i % 3].push(g))

  return (
    <section
      ref={rootRef as any}
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(96px, 12vw, 180px)',
        paddingInline: 'clamp(20px, 4vw, 56px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 'clamp(24px, 4vw, 56px)',
            marginBottom: 'clamp(48px, 6vw, 80px)',
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
                  opacity: 0.6,
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
                  fontSize: 'clamp(2.2rem, 5.5vw, 5rem)',
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
                opacity: 0.72,
                lineHeight: 1.55,
                fontSize: '1rem',
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(16px, 1.8vw, 28px)',
            alignItems: 'flex-start',
          }}
          className="fie-gal-grid"
        >
          {buckets.map((bucket, ci) => (
            <div
              key={ci}
              className="fie-gal-col"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(16px, 1.8vw, 28px)',
                paddingTop: ci === 1 ? 'clamp(40px, 5vw, 80px)' : ci === 2 ? 'clamp(20px, 2vw, 40px)' : 0,
              }}
            >
              {bucket.map((g, bi) => {
                const idx = buckets.slice(0, ci).reduce((n, b) => n + b.length, 0) + bi
                const cap = captions[idx]
                const aspect = idx % 3 === 0 ? '4 / 5' : idx % 3 === 1 ? '3 / 4' : '1 / 1'
                return (
                  <figure
                    key={bi}
                    className="fie-gal-tile"
                    style={{
                      margin: 0,
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 18,
                      aspectRatio: aspect,
                      background: '#111',
                    }}
                  >
                    <img
                      src={g.url}
                      alt={g.alt ?? cap?.title ?? ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      draggable={false}
                    />
                    {cap && (
                      <figcaption
                        style={{
                          position: 'absolute',
                          left: 14,
                          bottom: 14,
                          right: 14,
                          color: '#fff',
                          fontSize: '0.82rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          textShadow: '0 1px 8px rgba(0,0,0,0.5)',
                        }}
                      >
                        <span style={{ opacity: 0.92 }}>{cap.title}</span>
                        {cap.year && <span style={{ opacity: 0.7 }}>{cap.year}</span>}
                      </figcaption>
                    )}
                  </figure>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-gal-grid { grid-template-columns: 1fr 1fr !important; }
          .fie-gal-col { padding-top: 0 !important; }
        }
      `}</style>
    </section>
  )
}
