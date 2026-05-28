'use client'

/**
 * Cinematic animated header — vertical-rise context + clip-path mask.
 * Motion choreography drawn from open-source GSAP scroll patterns.
 */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'
import { AnimatedTextLines } from './AnimatedTextLines'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface AnimatedHeaderProps {
  eyebrow?: string
  title: string
  body?: string
  textColor?: string
  withScrollTrigger?: boolean
  className?: string
}

export function AnimatedHeader({
  eyebrow,
  title,
  body,
  textColor,
  withScrollTrigger = false,
  className,
}: AnimatedHeaderProps) {
  const ctxRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const titleParts = title.includes(' ') ? title.split(' ') : [title]

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: withScrollTrigger ? { trigger: ctxRef.current } : undefined,
      })
      tl.from(ctxRef.current, { y: '50vh', duration: 1, ease: 'circ.out' })
      tl.from(
        headerRef.current,
        { opacity: 0, y: 200, duration: 1, ease: 'circ.out' },
        '<+0.2',
      )
    },
    { scope: ctxRef },
  )

  return (
    <div ref={ctxRef} className={className}>
      <div style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
        <div
          ref={headerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(2.5rem, 4vw, 4rem)',
            paddingTop: '4rem',
            color: textColor,
          }}
        >
          {eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: 300,
                paddingInline: 'clamp(0.25rem, 1vw, 1.5rem)',
              }}
            >
              {eyebrow}
            </p>
          )}
          <div style={{ paddingInline: 'clamp(0.25rem, 1vw, 1.5rem)' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(2.4rem, 11vw, 11rem)',
                lineHeight: 0.92,
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(2.5rem, 4vw, 4rem)',
              }}
            >
              {titleParts.map((part, i) => (
                <span key={i} style={{ display: 'inline-block' }}>{part} </span>
              ))}
            </h1>
          </div>
        </div>
      </div>
      {body && (
        <div
          style={{
            position: 'relative',
            paddingInline: 'clamp(0.25rem, 1vw, 1.5rem)',
            color: textColor,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              borderTop: '2px solid currentColor',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              paddingBlock: 'clamp(3rem, 4vw, 4rem)',
              textAlign: 'right',
            }}
          >
            <AnimatedTextLines
              text={body}
              style={{
                fontWeight: 300,
                textTransform: 'uppercase',
                fontSize: 'clamp(0.9rem, 1.4vw, 1.4rem)',
                letterSpacing: '0.02em',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
