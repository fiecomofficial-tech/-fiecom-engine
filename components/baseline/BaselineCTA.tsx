'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { CTAData } from './types'
import { usePreviewHrefResolver } from '../usePreviewHref'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineCTA({ data }: { data: CTAData }) {
  const resolve = usePreviewHrefResolver()
  return (
    <section className="px-6 lg:px-8 py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease }}
        className="max-w-6xl mx-auto bg-foreground text-background rounded-3xl p-12 md:p-20 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl">
          {data.eyebrow && (
            <p className="text-[12px] uppercase tracking-[0.08em] text-background/60 mb-6">
              {data.eyebrow}
            </p>
          )}
          <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-tightest font-medium mb-8">
            {data.headline}
            {data.accent && (
              <>
                {' '}
                <span className="font-serif italic text-background/70">{data.accent}</span>
                .
              </>
            )}
          </h2>
          {data.body && (
            <p className="text-[17px] text-background/70 leading-[1.6] mb-10 max-w-lg">{data.body}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {data.cta && (
              <a
                href={resolve(data.cta.href, '/contact')}
                className="group inline-flex items-center gap-2 bg-background text-foreground px-5 py-3 rounded-full text-[15px] font-medium hover:opacity-90 transition-opacity ease-weightless"
              >
                {data.cta.label}
                <ArrowUpRight className="w-4 h-4 transition-transform duration-500 ease-weightless group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
            {data.secondaryCta && (
              <a
                href={resolve(data.secondaryCta.href, '/contact')}
                className="inline-flex items-center gap-2 border border-background/20 text-background px-5 py-3 rounded-full text-[15px] font-medium hover:bg-background/10 transition-colors ease-weightless"
              >
                {data.secondaryCta.label}
              </a>
            )}
          </div>
        </div>
        <div className="absolute -right-32 -bottom-32 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" />
      </motion.div>
    </section>
  )
}
