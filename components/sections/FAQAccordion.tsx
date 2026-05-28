'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef, useState } from 'react'
import type { SectionData } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface FAQ {
  q: string
  a: string
}

export default function FAQAccordion({ data }: { data: SectionData }) {
  const c = data.content
  const faqs = ((c.faqs as FAQ[] | undefined) ?? []).slice(0, 12)
  const [open, setOpen] = useState<number | null>(0)
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const t = root.querySelector('.fie-faq-title')
      if (t) {
        const split = SplitText.create(t as Element, { type: 'lines', linesClass: 'paragraph-line' })
        gsap.from(split.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 78%' },
        })
      }
      const rows = root.querySelectorAll('.fie-faq-row')
      gsap.from(rows, {
        y: 28,
        opacity: 0,
        stagger: 0.06,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: root, start: 'top 70%' },
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
          gridTemplateColumns: '1fr 1.6fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-faq-layout"
      >
        <div style={{ position: 'sticky', top: 120 }}>
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
              className="fie-faq-title"
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.2rem, 5vw, 4.4rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                maxWidth: '14ch',
              }}
            >
              {c.headline}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                marginTop: 24,
                opacity: 0.72,
                lineHeight: 1.6,
                fontSize: '0.98rem',
                maxWidth: '36ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <li
                key={i}
                className="fie-faq-row"
                style={{
                  borderTop: '1px solid color-mix(in oklab, currentColor 16%, transparent)',
                  borderBottom:
                    i === faqs.length - 1
                      ? '1px solid color-mix(in oklab, currentColor 16%, transparent)'
                      : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'currentColor',
                    cursor: 'pointer',
                    padding: 'clamp(20px, 2.4vw, 32px) 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 'clamp(1.05rem, 1.4vw, 1.4rem)',
                    fontFamily: 'var(--fie-font-display, serif)',
                    letterSpacing: '-0.01em',
                    textAlign: 'left',
                  }}
                  aria-expanded={isOpen}
                >
                  <span style={{ flex: 1 }}>{f.q}</span>
                  <span
                    aria-hidden
                    style={{
                      fontSize: '1.1rem',
                      transition: 'transform 0.4s cubic-bezier(0.2, 0.58, 0.43, 1)',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      display: 'inline-flex',
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.5s cubic-bezier(0.2, 0.58, 0.43, 1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p
                      style={{
                        paddingBottom: 'clamp(20px, 2.4vw, 32px)',
                        opacity: 0.78,
                        lineHeight: 1.65,
                        fontSize: '1rem',
                        maxWidth: '64ch',
                        margin: 0,
                      }}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-faq-layout { grid-template-columns: 1fr !important; }
          .fie-faq-layout > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  )
}
