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

/**
 * Word-color stagger reveal. Two large editorial lines fade word-by-word
 * from dim to ink as the section scrolls; a rotated clip-path subtitle
 * wipes in between them; a body paragraph rises word-by-word.
 */
export default function MessageReveal({ data }: { data: SectionData }) {
  const c = data.content
  const rootRef = useRef<HTMLDivElement | null>(null)
  const first = (c.firstLine as string) ?? c.headline ?? ''
  const second = (c.secondLine as string) ?? c.subhead ?? ''
  const accent = (c.accent as string) ?? c.eyebrow ?? ''
  const body = c.body ?? ''

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const ready =
        typeof document !== 'undefined' && 'fonts' in document
          ? (document as any).fonts.ready
          : Promise.resolve()
      ready.then(() => {
        const firstEl = root.querySelector('.first-message')
        const secondEl = root.querySelector('.second-message')
        const paragraphEl = root.querySelector('.message-content p')
        if (!firstEl || !secondEl) return

        const firstSplit = SplitText.create(firstEl as Element, { type: 'words' })
        const secondSplit = SplitText.create(secondEl as Element, { type: 'words' })
        const paragraphSplit = paragraphEl
          ? SplitText.create(paragraphEl as Element, {
              type: 'words,lines',
              linesClass: 'paragraph-line',
            })
          : null

        gsap.to(firstSplit.words, {
          color: 'var(--fie-ink, #faeade)',
          ease: 'power1.in',
          stagger: 1,
          scrollTrigger: {
            trigger: root,
            start: 'top center',
            end: '30% center',
            scrub: true,
          },
        })

        gsap.to(secondSplit.words, {
          color: 'var(--fie-ink, #faeade)',
          ease: 'power1.in',
          stagger: 1,
          scrollTrigger: {
            trigger: secondEl as Element,
            start: 'top center',
            end: 'bottom center',
            scrub: true,
          },
        })

        const revealTl = gsap.timeline({
          delay: 1,
          scrollTrigger: { trigger: root.querySelector('.msg-text-scroll'), start: 'top 60%' },
        })
        revealTl.to(
          '.msg-text-scroll',
          {
            duration: 0.5,
            clipPath: 'polygon(0% 0%,100% 0%, 100% 100%, 0% 100%)',
            ease: 'circ.inOut',
          },
          '<',
        )

        if (paragraphSplit) {
          gsap
            .timeline({
              scrollTrigger: { trigger: paragraphEl as Element, start: 'top 60%' },
            })
            .from(paragraphSplit.words, {
              duration: 1,
              stagger: 0.01,
              yPercent: 300,
              rotate: 3,
              ease: 'power1.inOut',
            })
        }
      })
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      className="message-content"
      style={{
        background: 'var(--fie-bg-accent, #7f3b2d)',
        color: 'var(--fie-ink-on-accent-bg, var(--fie-ink, #faeade))',
        minHeight: '100dvh',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: 'clamp(40px, 6vw, 96px) clamp(20px, 6vw, 96px)',
          maxWidth: 1600,
          margin: '0 auto',
        }}
      >
        <div
          className="msg-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(3.5rem, 6vw, 4.5rem)',
            position: 'relative',
            fontFamily: 'var(--fie-font-display, serif)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.035em',
            lineHeight: '0.94',
            fontSize: 'clamp(2.4rem, 9vw, 8.5rem)',
          }}
        >
          <h1
            className="first-message"
            style={{
              margin: 0,
              maxWidth: '90%',
              textAlign: 'center',
              color: 'rgba(250, 234, 222, 0.10)',
            }}
          >
            {first}
          </h1>

          {accent && (
            <div
              className="msg-text-scroll"
              style={{
                clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
                transform: 'rotate(3deg)',
                border: '0.5vw solid var(--fie-bg-accent, #7f3b2d)',
                position: 'absolute',
                zIndex: 10,
                top: '50%',
                left: '50%',
                translate: '-50% -50%',
              }}
            >
              <div
                style={{
                  background: 'var(--fie-accent-soft, #e3d3bc)',
                  padding: 'clamp(0.4rem, 0.5vw, 0.6rem) clamp(0.6rem, 1vw, 1.2rem)',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: 'var(--fie-bg-accent, #7f3b2d)',
                    fontSize: 'clamp(2rem, 8vw, 7rem)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {accent}
                </h2>
              </div>
            </div>
          )}

          <h1
            className="second-message"
            style={{
              margin: 0,
              maxWidth: '90%',
              textAlign: 'center',
              color: 'rgba(250, 234, 222, 0.10)',
            }}
          >
            {second}
          </h1>
        </div>

        {body && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 'clamp(2.5rem, 5vw, 5rem)',
            }}
          >
            <div style={{ maxWidth: 520, padding: '0 2.5rem', overflow: 'hidden' }}>
              <p
                style={{
                  textAlign: 'center',
                  fontFamily: 'var(--fie-font-body, sans-serif)',
                  fontSize: 'clamp(1rem, 1.1vw, 1.1rem)',
                  lineHeight: 1.55,
                }}
              >
                {body}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
