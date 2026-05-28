'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { HeroData } from './types'
import { Img } from '../Img'
import { usePreviewHrefResolver } from '../usePreviewHref'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineHero({ data }: { data: HeroData }) {
  const resolve = usePreviewHrefResolver()
  const headline = (data?.headline ?? '').trim() || 'A modern site, built around what matters.'
  const primaryCta = data?.cta?.label?.trim() ? data.cta : undefined
  const secondaryCta = data?.secondaryCta?.label?.trim() ? data.secondaryCta : undefined
  return (
    <section className="px-6 lg:px-8 pt-12 lg:pt-20 pb-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7">
          {data.eyebrow && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {data.eyebrow}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.05 }}
            className="text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05] tracking-tightest font-medium text-foreground"
          >
            {headline}
            {data.accent && (
              <>
                {' '}
                <span className="font-serif italic text-foreground/90">{data.accent}</span>
                .
              </>
            )}
          </motion.h1>

          {data.body && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
              className="mt-6 text-[18px] leading-[1.6] text-muted-foreground max-w-[34rem]"
            >
              {data.body}
            </motion.p>
          )}

          {(primaryCta || secondaryCta) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.25 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              {primaryCta && (
                <a
                  href={resolve(primaryCta.href, '/contact')}
                  className="group inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full text-[15px] font-medium hover:opacity-90 transition-opacity ease-weightless"
                >
                  {primaryCta.label}
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-500 ease-weightless group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
              {secondaryCta && (
                <a
                  href={resolve(secondaryCta.href, '/about')}
                  className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-5 py-3 rounded-full text-[15px] font-medium hover:bg-secondary transition-colors ease-weightless"
                >
                  {secondaryCta.label}
                </a>
              )}
            </motion.div>
          )}
        </div>

        {data.image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative border border-border rounded-2xl overflow-hidden bg-secondary aspect-[4/5] shadow-luxe">
              <Img
                image={data.image}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                fallback="editorial"
              />
              {data.imageLabel && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-background/90 mix-blend-difference">
                  <span>{data.imageLabel.left}</span>
                  <span>—</span>
                  <span>{data.imageLabel.right}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
