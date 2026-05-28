'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import React, { useEffect, useRef } from 'react'

interface MarqueeProps {
  items: string[]
  speed?: number
  className?: string
  separator?: string
  reverse?: boolean
  edgeFade?: boolean
  style?: React.CSSProperties
}

/**
 * Continuous marquee with wheel-driven direction flip. GSAP modifier loops
 * the translate so the band is seamless. Edge-mask softens the viewport
 * boundary.
 */
export function Marquee({
  items,
  speed = 12,
  className,
  separator = '✦',
  reverse = false,
  edgeFade = true,
  style,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<gsap.core.Tween | null>(null)
  const forwardRef = useRef(!reverse)

  useGSAP(() => {
    const start = (dir: 1 | -1) => {
      animRef.current?.kill()
      animRef.current = gsap.to(trackRef.current, {
        x: dir === 1 ? '-100%' : '0%',
        duration: speed,
        repeat: -1,
        ease: 'none',
        modifiers: {
          x: gsap.utils.unitize((x) => parseFloat(x) % 50),
        },
      })
    }
    start(forwardRef.current ? 1 : -1)
    return () => {
      animRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const next = e.deltaY > 0
      if (next !== forwardRef.current) {
        forwardRef.current = next
        animRef.current?.kill()
        animRef.current = gsap.to(trackRef.current, {
          x: next ? '-100%' : '0%',
          duration: speed,
          repeat: -1,
          ease: 'none',
          modifiers: {
            x: gsap.utils.unitize((x) => parseFloat(x) % 50),
          },
        })
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [speed])

  const mask = edgeFade
    ? 'linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)'
    : undefined

  const track = [...items, ...items]

  return (
    <div
      className={className}
      style={{
        overflow: 'hidden',
        width: '100%',
        WebkitMaskImage: mask,
        maskImage: mask,
        ...style,
      }}
    >
      <div
        ref={trackRef}
        style={{
          display: 'inline-flex',
          gap: '3rem',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}
      >
        {track.map((it, i) => (
          <span
            key={i}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3rem' }}
          >
            <span>{it}</span>
            <span style={{ opacity: 0.45, display: 'inline-block' }}>{separator}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
