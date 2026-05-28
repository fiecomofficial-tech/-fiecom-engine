'use client'

import React from 'react'
import { Marquee } from '../motion/Marquee'
import type { SectionData } from './types'

/**
 * Single-band marquee section. Inverts the prevailing palette for
 * visual punctuation between editorial blocks.
 */
export default function MarqueeBand({ data }: { data: SectionData }) {
  const c = data.content
  const items =
    (c.items as string[] | undefined) ?? (c.headline ? [c.headline] : [])
  if (!items.length) return null
  const tone = (c.tone as string) ?? 'invert'
  const isInvert = tone === 'invert'

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        background: isInvert ? 'var(--fie-ink)' : 'var(--fie-bg)',
        color: isInvert ? 'var(--fie-bg)' : 'var(--fie-ink)',
        paddingBlock: 'clamp(20px, 2.6vw, 36px)',
        borderTop: '1px solid currentColor',
        borderBottom: '1px solid currentColor',
        fontFamily: 'var(--fie-font-display, serif)',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(2rem, 5vw, 4.5rem)',
          lineHeight: 1,
          fontWeight: 300,
        }}
      >
        <Marquee items={items} speed={18} separator="✦" edgeFade={false} />
      </div>
    </section>
  )
}
