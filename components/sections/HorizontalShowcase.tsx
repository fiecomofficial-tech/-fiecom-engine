'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import { useIsMobile } from '../motion/useIsMobile'
import type { SectionData, SectionImage } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Card {
  title: string
  caption?: string
}

/**
 * Pinned horizontal scroll. Title block stays left; the card track
 * translates X by (scrollWidth - vw) while the section is pinned.
 */
export default function HorizontalShowcase({ data }: { data: SectionData }) {
  const c = data.content
  const cards = (c.cards as Card[] | undefined) ?? []
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const rootRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const slideRef = useRef<HTMLDivElement | null>(null)
  const isTablet = useIsMobile(1024)

  useGSAP(
    () => {
      if (!slideRef.current || isTablet) return
      const scrollAmount = slideRef.current.scrollWidth - window.innerWidth
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 0%',
          end: '+=4000',
          scrub: true,
          pin: true,
        },
      })
      tl.to(trackRef.current, { x: `-${scrollAmount}px`, ease: 'power1.inOut' })
      return () => {
        ScrollTrigger.getAll().forEach((st) => st.kill())
        tl.kill()
      }
    },
    { scope: rootRef, dependencies: [isTablet] },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          flexDirection: isTablet ? 'column' : 'row',
          height: isTablet ? 'auto' : '100dvh',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            flex: 'none',
            width: isTablet ? '100%' : '57%',
            paddingInline: 'clamp(28px, 6vw, 96px)',
            paddingBlock: 'clamp(80px, 10vw, 140px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              {c.eyebrow}
            </p>
          )}
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--fie-font-display, serif)',
              fontSize: 'clamp(2.4rem, 6vw, 5.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              textWrap: 'balance',
              maxWidth: '14ch',
            }}
          >
            {c.headline}
          </h2>
          {c.body && (
            <p
              style={{
                maxWidth: '46ch',
                opacity: 0.78,
                lineHeight: 1.55,
                fontSize: 'clamp(1rem, 1.1vw, 1.1rem)',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <div
          ref={slideRef}
          style={{
            display: 'flex',
            gap: 'clamp(20px, 2vw, 32px)',
            paddingInline: 'clamp(28px, 4vw, 64px)',
            paddingBlock: 'clamp(60px, 8vw, 96px)',
            alignItems: 'center',
            flex: isTablet ? 'initial' : 'none',
            flexDirection: isTablet ? 'column' : 'row',
          }}
        >
          {cards.map((card, i) => {
            const img = gallery[i % Math.max(1, gallery.length)]
            return (
              <article
                key={i}
                style={{
                  flex: 'none',
                  width: isTablet ? '100%' : 'clamp(280px, 28vw, 440px)',
                  aspectRatio: isTablet ? '4 / 5' : '3 / 4',
                  borderRadius: 24,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#111',
                }}
              >
                {img && (
                  <img
                    src={img.url}
                    alt={img.alt ?? card.title}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.78)',
                    }}
                    draggable={false}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 'clamp(18px, 2vw, 28px)',
                    color: '#fff',
                    background:
                      'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--fie-font-display, serif)',
                      fontSize: 'clamp(1.2rem, 1.8vw, 1.8rem)',
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {card.title}
                  </h3>
                  {card.caption && (
                    <p style={{ opacity: 0.82, fontSize: '0.92rem', marginTop: 8 }}>
                      {card.caption}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
