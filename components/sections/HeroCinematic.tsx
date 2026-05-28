'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHref } from '../usePreviewHref'
import { MediaBg } from '../MediaBg'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

/**
 * Cinematic hero — char-split title, clip-path subtitle reveal, then
 * scroll-driven container squeeze (rotate + scale + yPercent).
 */
export default function HeroCinematic({ data }: { data: SectionData }) {
  const c = data.content
  const img = data.images?.primary
  const ctaHref = usePreviewHref(c.cta?.href, '#start')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const ready =
        typeof document !== 'undefined' && 'fonts' in document
          ? (document as Document & { fonts: FontFaceSet }).fonts.ready
          : Promise.resolve()
      ready.then(() => {
        const titleEl = containerRef.current?.querySelector('.fie-hero-title')
        if (!titleEl) return
        const titleSplit = SplitText.create(titleEl as Element, { type: 'chars' })

        const tl = gsap.timeline({ delay: 0.4 })
        tl.to('.fie-hero-content', { opacity: 1, y: 0, duration: 0.8, ease: 'power1.inOut' })
          .to(
            '.fie-hero-clip',
            {
              duration: 1,
              clipPath: 'polygon(0% 0%,100% 0%,100% 100%, 0% 100%)',
              ease: 'circ.out',
            },
            '-=0.5',
          )
          .from(
            titleSplit.chars,
            { yPercent: 200, stagger: 0.02, ease: 'power2.out', duration: 0.8 },
            '-=0.5',
          )

        const sq = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: '1% top',
            end: 'bottom top',
            scrub: true,
          },
        })
        sq.to(containerRef.current, {
          rotate: 7,
          scale: 0.9,
          yPercent: 30,
          ease: 'power1.inOut',
        })
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
      }}
    >
      <div
        ref={containerRef}
        className="fie-hero-container"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          willChange: 'transform',
        }}
      >
        {img && <MediaBg image={img} eager filter="brightness(0.62)" />}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--fie-image-vignette)',
          }}
        />

        <div
          className="fie-hero-content"
          style={{
            position: 'relative',
            zIndex: 2,
            opacity: 0,
            transform: 'translateY(24px)',
            paddingInline: 'clamp(24px, 5vw, 72px)',
            paddingTop: 'clamp(20vh, 22vh, 26vh)',
            paddingBottom: 'clamp(40px, 6vw, 80px)',
            maxWidth: 1600,
            margin: '0 auto',
          }}
        >
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                opacity: 0.75,
                marginBottom: 'clamp(24px, 3vw, 48px)',
              }}
            >
              {c.eyebrow}
            </p>
          )}

          <div style={{ overflow: 'hidden' }}>
            <h1
              className="fie-hero-title"
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.6rem, 11vw, 11rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.035em',
              }}
            >
              {c.headline ?? ''}
            </h1>
          </div>

          {c.subhead && (
            <div
              className="fie-hero-clip"
              style={{
                clipPath: 'polygon(0% 0%,100% 0%, 100% 0%, 0% 0%)',
                marginTop: 'clamp(16px, 2.5vw, 28px)',
              }}
            >
              <div style={{ paddingBlock: '0.4em' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(1.2rem, 2.4vw, 2.4rem)',
                    letterSpacing: '-0.01em',
                    fontWeight: 500,
                    opacity: 0.92,
                  }}
                >
                  {c.subhead}
                </h2>
              </div>
            </div>
          )}

          {c.body && (
            <p
              style={{
                maxWidth: '46ch',
                fontSize: 'clamp(1rem, 1.15vw, 1.15rem)',
                marginTop: 'clamp(24px, 3vw, 36px)',
                lineHeight: 1.55,
                opacity: 0.82,
                textWrap: 'pretty',
              }}
            >
              {c.body}
            </p>
          )}

          {c.cta?.label && (
            <a
              href={ctaHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 'clamp(28px, 4vw, 44px)',
                padding: '14px 28px',
                borderRadius: 999,
                background: 'var(--fie-accent, #e9aa56)',
                color: 'var(--fie-on-accent, #1a120c)',
                fontSize: '0.92rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {c.cta.label} <span aria-hidden>→</span>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
