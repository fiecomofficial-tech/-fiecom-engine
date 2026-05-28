'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHref, usePreviewHrefResolver } from '../usePreviewHref'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface Detail {
  label: string
  value: string
  href?: string
}

export default function ContactBlock({ data }: { data: SectionData }) {
  const c = data.content
  const details = ((c.details as Detail[] | undefined) ?? []) as Detail[]
  const rootRef = useRef<HTMLElement | null>(null)
  const ctaHref = usePreviewHref(c.cta?.href, 'mailto:hello@studio.co')
  const detailHref = usePreviewHrefResolver()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const t = root.querySelector('.fie-contact-title')
      if (t) {
        const split = SplitText.create(t as Element, { type: 'lines', linesClass: 'paragraph-line' })
        gsap.from(split.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.14,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 75%' },
        })
      }
      const rows = root.querySelectorAll('.fie-contact-row')
      gsap.from(rows, {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: root, start: 'top 70%' },
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(96px, 12vw, 180px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
        borderTop: '1px solid var(--fie-mute, rgba(0,0,0,0.16))',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-contact-layout"
      >
        <div>
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
              className="fie-contact-title"
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.6rem, 6vw, 5.5rem)',
                lineHeight: 0.96,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
                maxWidth: '14ch',
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
                fontSize: 'clamp(1.02rem, 1.1vw, 1.12rem)',
                maxWidth: '46ch',
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
                marginTop: 'clamp(32px, 4vw, 48px)',
                padding: '16px 28px',
                borderRadius: 999,
                background: 'var(--fie-accent, currentColor)',
                color: 'var(--fie-on-accent, var(--fie-bg))',
                fontSize: '0.96rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {c.cta.label} <span aria-hidden>→</span>
            </a>
          )}
        </div>

        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          {details.map((d, i) => (
            <div
              key={i}
              className="fie-contact-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.6fr',
                gap: 24,
                paddingBlock: 'clamp(20px, 2.4vw, 32px)',
                borderTop: '1px solid var(--fie-mute, rgba(0,0,0,0.16))',
                borderBottom:
                  i === details.length - 1
                    ? '1px solid var(--fie-mute, rgba(0,0,0,0.16))'
                    : undefined,
              }}
            >
              <dt
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'var(--fie-ink-2, currentColor)',
                  margin: 0,
                }}
              >
                {d.label}
              </dt>
              <dd style={{ margin: 0, fontSize: 'clamp(1rem, 1.15vw, 1.15rem)' }}>
                {d.href ? (
                  <a href={detailHref(d.href, '#')} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {d.value}
                  </a>
                ) : (
                  d.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-contact-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
