'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SectionData } from './types'

const ease = [0.2, 0, 0, 1] as const

/**
 * Single oversized pull-quote with thin separators, serif italic body,
 * and a small attribution block right-aligned. Used as a quiet anchor
 * between two visual sections — gives the eye a place to land.
 * Self-contained, overflow-safe, no scroll-driven motion.
 */
export default function EditorialQuote({ data }: { data: SectionData }) {
  const c = data.content as {
    eyebrow?: string
    quote?: string
    attribution?: string
    attributionRole?: string
  }
  const quote = (c.quote ?? '').trim()
  if (!quote) return null

  return (
    <section className="px-6 lg:px-8 py-32 lg:py-40 bg-background">
      <div className="max-w-4xl mx-auto">
        {c.eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease }}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-12"
          >
            {c.eyebrow}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="border-t border-border pt-12"
        >
          <blockquote className="m-0">
            <p className="font-serif italic text-foreground text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.2] tracking-tight">
              &ldquo;{quote}&rdquo;
            </p>
          </blockquote>
        </motion.div>
        {(c.attribution || c.attributionRole) && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease, delay: 0.25 }}
            className="flex justify-end mt-10"
          >
            <div className="text-right border-t border-border pt-4 max-w-xs">
              {c.attribution && (
                <div className="text-[14px] font-medium text-foreground">
                  {c.attribution}
                </div>
              )}
              {c.attributionRole && (
                <div className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  {c.attributionRole}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
