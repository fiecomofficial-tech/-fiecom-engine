'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef } from 'react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface AnimatedTextLinesProps {
  text: string
  className?: string
  style?: React.CSSProperties
}

export function AnimatedTextLines({ text, className, style }: AnimatedTextLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])
  const lines = text.split('\n').filter((l) => l.trim() !== '')

  useGSAP(
    () => {
      const els = lineRefs.current.filter(Boolean) as HTMLElement[]
      if (els.length === 0) return
      gsap.from(els, {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'back.out',
        scrollTrigger: { trigger: containerRef.current },
      })
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className={className} style={style}>
      {lines.map((line, i) => (
        <span
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el
          }}
          style={{
            display: 'block',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
            textWrap: 'pretty',
          }}
        >
          {line}
        </span>
      ))}
    </div>
  )
}
