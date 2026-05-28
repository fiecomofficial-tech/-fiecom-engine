'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { SectionData } from '../sections/types'
import { Img } from '../Img'

interface Pillar { title: string; body: string }
interface Stat { value: string; label: string }

const ease = [0.2, 0, 0, 1] as const

/**
 * True when the eyebrow's word(s) are a case-insensitive prefix of the
 * headline. Prevents stacking "CONTACT" + "Contact us" or "ABOUT" +
 * "About our studio". Single-word headlines that *equal* the eyebrow
 * are also caught.
 */
function isPrefixDuplicate(eyebrow: string, headline: string): boolean {
  const e = eyebrow.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, '')
  const h = headline.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, '')
  if (!e || !h) return false
  if (h === e) return true
  return h.startsWith(`${e} `)
}

/**
 * Mirrors `src/pages/About.jsx` in the Fiecom template repo verbatim
 * (modulo Next.js / TypeScript syntax). This is the ONLY section the
 * About page renders between Navbar and Footer — it owns its own
 * eyebrow + h1 + intro, so the composer must NOT prepend a separate
 * BaselinePageHeader.
 */
export default function BaselineAboutNarrative({ data }: { data: SectionData }) {
  const c = data.content
  const img = data.images?.primary
  const rawHeadline = (c.headline as string | undefined)?.trim() ?? ''
  const headline = rawHeadline || 'About us'
  const rawEyebrow = (c.eyebrow as string | undefined)?.trim() ?? ''
  // Skip eyebrow when it's empty OR duplicates the headline's first word(s)
  // ("ABOUT" + "About us" → drop "ABOUT").
  const eyebrowDupes = isPrefixDuplicate(rawEyebrow, headline)
  const eyebrow = !rawEyebrow || eyebrowDupes
    ? null
    : rawEyebrow
  const accent = c.accent as string | undefined
  const intro = ((c.body as string | undefined) ?? '').trim()
  const pillars = ((c.pillars as Pillar[] | undefined) ?? []).slice(0, 4)
  const stats = ((c.stats as Stat[] | undefined) ?? []).slice(0, 3)
  const pillarEyebrow = (c.pillarEyebrow as string | undefined) ?? 'Core pillars'
  const pillarHeadline = (c.pillarHeadline as string | undefined) ?? 'The principles we build by.'
  const statsEyebrow = (c.statsEyebrow as string | undefined) ?? 'By the numbers'

  return (
    <div className="px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-[42rem] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {eyebrow && (
            <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-4">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[40px] lg:text-[48px] leading-[1.1] tracking-tightest font-medium mb-8 text-foreground">
            {headline}
            {accent && (
              <>
                {' '}
                <span className="font-serif italic">{accent}</span>
                .
              </>
            )}
          </h1>
          {intro && (
            <p className="text-[18px] leading-[1.6] text-muted-foreground">
              {intro}
            </p>
          )}
        </motion.div>

        {img && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="my-16 lg:my-24 border border-border rounded-2xl overflow-hidden bg-secondary aspect-[3/2] relative"
          >
            <Img image={img} fill sizes="100vw" fallback="editorial" />
          </motion.div>
        )}

        {pillars.length > 0 && (
          <div className="space-y-16 lg:space-y-20">
            <div>
              <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-6">
                {pillarEyebrow}
              </p>
              <h2 className="text-[28px] lg:text-[32px] leading-[1.2] tracking-tight font-medium text-foreground">
                {pillarHeadline}
              </h2>
            </div>

            {pillars.map((p, i) => (
              <motion.section
                key={p?.title ?? `p-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, ease, delay: i * 0.08 }}
              >
                <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-3">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="text-[24px] lg:text-[28px] leading-[1.2] tracking-tight font-medium mb-4 text-foreground">
                  {p?.title}
                </h3>
                <p className="text-[17px] leading-[1.6] text-muted-foreground">
                  {p?.body}
                </p>
              </motion.section>
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mt-20 lg:mt-28 pt-12 border-t border-border"
          >
            <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-6">
              {statsEyebrow}
            </p>
            <div className="grid grid-cols-3 gap-6">
              {stats.map((s, i) => (
                <div key={s?.label ?? `s-${i}`}>
                  <div className="text-[32px] lg:text-[40px] tracking-tightest font-medium text-foreground">
                    {s?.value}
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-1 uppercase tracking-[0.05em]">
                    {s?.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
