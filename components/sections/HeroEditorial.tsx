'use client'

import React from 'react'
import { AnimatedHeader } from '../motion/AnimatedHeader'
import type { SectionData } from './types'
import { MediaBg } from '../MediaBg'

/**
 * Editorial hero — full-bleed background image with uppercase display
 * header and animated body lines. Mask wipe + content rise on mount.
 */
export default function HeroEditorial({ data }: { data: SectionData }) {
  const c = data.content
  const img = data.images?.primary

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
      }}
    >
      {img && (
        <figure
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            width: '100%',
            height: '100%',
            margin: 0,
          }}
        >
          <MediaBg
            image={img}
            eager
            filter="saturate(0.95) contrast(1.05)"
            style={{ position: 'absolute' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--fie-photo-overlay)',
            }}
          />
        </figure>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          paddingBottom: 'clamp(48px, 6vw, 96px)',
          paddingInline: 'clamp(20px, 4vw, 56px)',
          maxWidth: 1600,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <AnimatedHeader
          eyebrow={c.eyebrow}
          title={c.headline ?? ''}
          body={c.body}
          textColor="var(--fie-photo-text)"
        />
      </div>
    </section>
  )
}
