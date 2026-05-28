'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { SectionImage } from './sections/types'

interface ImgProps {
  image?: SectionImage
  alt?: string
  /** Tells next/image to fill its positioned parent. Parent must have
   *  `position: relative` (or fill containers we provide). */
  fill?: boolean
  /** If known, width/height for non-fill usage. Falls back to fill mode. */
  width?: number
  height?: number
  /** `sizes` hint passed straight to next/image — set this from the
   *  caller (hero vs. gallery vs. card) so the browser picks the right
   *  source. Required for proper LCP without over-fetching. */
  sizes?: string
  /** Above-the-fold (hero/first-screen) → `priority`. Everything else
   *  stays lazy with `loading="lazy"`. */
  priority?: boolean
  className?: string
  style?: React.CSSProperties
  fallback?: 'warm' | 'cool' | 'mono' | 'editorial'
}

const FALLBACK_GRADIENTS: Record<NonNullable<ImgProps['fallback']>, string> = {
  warm: 'linear-gradient(135deg, #c0552c 0%, #7f3b2d 60%, #2a1a14 100%)',
  cool: 'linear-gradient(135deg, #2347ff 0%, #1a1f33 60%, #060810 100%)',
  mono: 'linear-gradient(135deg, #4a4844 0%, #1c1b18 100%)',
  editorial: 'linear-gradient(135deg, #ebe2cf 0%, #c8b48a 60%, #6f5938 100%)',
}

/**
 * Hardened image wrapper.
 *  - Uses `next/image` (unoptimized for Pexels — their CDN already does
 *    width-based optimization via `?w=`).
 *  - Always renders a gradient placeholder background so the box never
 *    flashes empty during load.
 *  - `priority` for above-the-fold, lazy otherwise.
 *  - No hover scaling, no scroll-driven scaling, no transform tricks.
 *    Visual movement belongs to motion-explicit sections, not the
 *    image base.
 */
export function Img({
  image,
  alt,
  fill = false,
  width = 1600,
  height,
  sizes,
  priority = false,
  className,
  style,
  fallback = 'editorial',
}: ImgProps) {
  const [errored, setErrored] = useState(false)
  const url = image?.url ? withWidth(image.url, width) : undefined
  const showFallback = !url || errored

  const wrapperStyle: React.CSSProperties = {
    position: fill ? 'absolute' : 'relative',
    inset: fill ? 0 : undefined,
    width: '100%',
    height: fill ? '100%' : undefined,
    overflow: 'hidden',
    background: FALLBACK_GRADIENTS[fallback],
    ...style,
  }

  return (
    <div className={className} style={wrapperStyle}>
      {!showFallback && url && (
        <Image
          src={url}
          alt={alt ?? image?.alt ?? ''}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : (height ?? Math.round(width * 0.625))}
          sizes={sizes ?? (fill ? '100vw' : `${width}px`)}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          unoptimized
          onError={() => setErrored(true)}
          draggable={false}
          style={{
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

function withWidth(url: string, width: number): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('pexels.com')) {
      u.searchParams.set('auto', 'compress')
      u.searchParams.set('cs', 'tinysrgb')
      u.searchParams.set('w', String(width))
      if (!u.searchParams.get('fit')) u.searchParams.set('fit', 'crop')
      return u.toString()
    }
    return url
  } catch {
    return url
  }
}
