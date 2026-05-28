'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Img } from '../Img'
import type { SectionData, SectionImage } from './types'

const ease = [0.2, 0, 0, 1] as const

interface Tile {
  title?: string
  caption?: string
}

/**
 * 12-col asymmetric grid: tall image left (cols 1-5, 2 rows), wide image
 * top-right (cols 6-12, 1 row), text tile bottom-right (cols 6-9), small
 * image bottom-right (cols 10-12). Designed to feel hand-arranged.
 * Self-contained; no scroll-driven motion; intersection-fade only.
 */
export default function AsymmetricGrid({ data }: { data: SectionData }) {
  const c = data.content as {
    eyebrow?: string
    headline?: string
    body?: string
    tiles?: Tile[]
  }
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const tiles: Tile[] = Array.isArray(c.tiles) ? c.tiles : []
  if (gallery.length < 3 && !c.headline) return null

  const t = (i: number) => tiles[i] ?? {}

  return (
    <section className="px-6 lg:px-8 py-32 lg:py-40 bg-background">
      <div className="max-w-7xl mx-auto">
        {(c.eyebrow || c.headline) && (
          <div className="grid lg:grid-cols-12 gap-8 mb-16 lg:mb-20">
            <div className="lg:col-span-5">
              {c.eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  {c.eyebrow}
                </p>
              )}
              {c.headline && (
                <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-tightest font-medium text-foreground">
                  {c.headline}
                </h2>
              )}
            </div>
            {c.body && (
              <div className="lg:col-span-5 lg:col-start-8">
                <p className="text-[16px] leading-[1.6] text-muted-foreground max-w-md mt-2">
                  {c.body}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-[minmax(0,_auto)]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease }}
            className="md:col-span-5 md:row-span-2 relative aspect-[4/5] rounded-2xl overflow-hidden border border-border"
          >
            <Img image={gallery[0]} fill sizes="(min-width: 768px) 40vw, 100vw" fallback="editorial" />
            {t(0).title && (
              <div className="absolute bottom-4 left-4 right-4 text-[11px] uppercase tracking-[0.18em] text-background mix-blend-difference">
                {t(0).title}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease, delay: 0.08 }}
            className="md:col-span-7 relative aspect-[16/9] rounded-2xl overflow-hidden border border-border"
          >
            <Img image={gallery[1]} fill sizes="(min-width: 768px) 55vw, 100vw" fallback="editorial" />
            {t(1).title && (
              <div className="absolute bottom-4 left-4 right-4 text-[11px] uppercase tracking-[0.18em] text-background mix-blend-difference">
                {t(1).title}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease, delay: 0.16 }}
            className="md:col-span-4 border border-border rounded-2xl p-8 bg-secondary/40 flex flex-col justify-between min-h-[200px]"
          >
            {t(2).title && (
              <div className="text-[18px] font-medium tracking-tight text-foreground leading-snug max-w-[18ch]">
                {t(2).title}
              </div>
            )}
            {t(2).caption && (
              <div className="text-[13px] text-muted-foreground mt-6 leading-[1.5]">
                {t(2).caption}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease, delay: 0.24 }}
            className="md:col-span-3 relative aspect-square rounded-2xl overflow-hidden border border-border"
          >
            <Img image={gallery[2]} fill sizes="(min-width: 768px) 25vw, 100vw" fallback="editorial" />
            {t(3).title && (
              <div className="absolute bottom-3 left-3 right-3 text-[11px] uppercase tracking-[0.18em] text-background mix-blend-difference">
                {t(3).title}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
