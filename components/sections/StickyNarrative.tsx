'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Img } from '../Img'
import type { SectionData, SectionImage } from './types'

const ease = [0.2, 0, 0, 1] as const

interface Chapter {
  title?: string
  body?: string
  meta?: string
}

/**
 * Pinned text column on the left, image stack scrolling on the right.
 * No scroll-jacking — uses CSS `position: sticky` so the browser owns
 * the scroll. Each chapter card fades in on viewport entry. Always
 * exactly 2 paragraphs (the "two chapters" pattern Awwwards editorial
 * sites use to slow the reader down without trapping them).
 */
export default function StickyNarrative({ data }: { data: SectionData }) {
  const c = data.content as {
    eyebrow?: string
    headline?: string
    chapters?: Chapter[]
  }
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const chapters: Chapter[] = Array.isArray(c.chapters)
    ? c.chapters.filter((ch) => ch?.body)
    : []
  if (chapters.length === 0) return null

  return (
    <section className="px-6 lg:px-8 py-32 lg:py-40 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              {c.eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {c.eyebrow}
                </p>
              )}
              {c.headline && (
                <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.1] tracking-tightest font-medium text-foreground mb-10 max-w-[18ch]">
                  {c.headline}
                </h2>
              )}
              <div className="hidden lg:block w-full h-px bg-border mb-8" />
              <div className="hidden lg:block text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                {chapters.length} chapter{chapters.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-20 lg:space-y-32">
            {chapters.slice(0, 3).map((ch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ duration: 0.8, ease, delay: i * 0.05 }}
              >
                {gallery[i] && (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border mb-8">
                    <Img
                      image={gallery[i]}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      fallback="editorial"
                    />
                  </div>
                )}
                {ch.meta && (
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                    {ch.meta}
                  </p>
                )}
                {ch.title && (
                  <h3 className="text-[22px] sm:text-[26px] font-medium text-foreground leading-snug tracking-tight mb-4 max-w-[22ch]">
                    {ch.title}
                  </h3>
                )}
                {ch.body && (
                  <p className="text-[16px] leading-[1.65] text-muted-foreground max-w-[42ch]">
                    {ch.body}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
