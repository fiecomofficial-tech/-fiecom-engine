'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { SectionImage } from './sections/types'

interface MediaBgProps {
  image?: SectionImage
  className?: string
  style?: React.CSSProperties
  filter?: string
  /** Force eager playback (e.g. above-the-fold heroes). Default lazy. */
  eager?: boolean
}

/**
 * Cinematic background slot. Renders the poster image immediately and
 * upgrades to a muted/looped Pexels MP4 once the section is in view (or
 * right away when `eager`). Falls back to the still photo if the video
 * can't load. Always renders the image so we never flash a broken state.
 */
export function MediaBg({ image, className, style, filter, eager = false }: MediaBgProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(eager)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    if (eager) return
    if (!image?.videoUrl) return
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadVideo(true)
      return
    }
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoadVideo(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [eager, image?.videoUrl])

  if (!image?.url) return null

  const showVideo = !!image.videoUrl && shouldLoadVideo && !videoFailed

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      <img
        src={image.url}
        alt={image.alt ?? ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter,
        }}
      />
      {showVideo && (
        <video
          ref={videoRef}
          src={image.videoUrl}
          poster={image.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter,
          }}
        />
      )}
    </div>
  )
}
