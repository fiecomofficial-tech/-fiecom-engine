'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { TestimonialsData } from './types'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineTestimonials({ data }: { data: TestimonialsData }) {
  const items = Array.isArray(data?.items) ? data.items.filter((t) => t?.quote && t?.name) : []
  // Never render an orphan header without quotes — that's just an empty
  // "Customers" section, which feels like a broken placeholder.
  if (items.length === 0) return null
  return (
    <section className="px-6 lg:px-8 py-32 bg-secondary/50 border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-20">
          {data.eyebrow && (
            <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-4">
              {data.eyebrow}
            </p>
          )}
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.1] tracking-tightest font-medium text-foreground">
            {data.headline}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.figure
              key={t?.name ?? `t-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="border border-border rounded-2xl p-8 bg-background flex flex-col justify-between min-h-[260px]"
            >
              <blockquote className="text-[17px] leading-[1.5] text-foreground tracking-tight m-0">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-border">
                <div className="text-[14px] font-medium text-foreground">{t.name}</div>
                {t.role && <div className="text-[13px] text-muted-foreground mt-0.5">{t.role}</div>}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
