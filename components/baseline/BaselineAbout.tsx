'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { AboutData } from './types'
import { Img } from '../Img'
import BaselinePageHeader from './BaselinePageHeader'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineAbout({ data }: { data: AboutData }) {
  return (
    <div className="px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-[42rem] mx-auto">
        <BaselinePageHeader data={data.header} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="-mt-4"
        >
          <p className="text-[18px] leading-[1.6] text-muted-foreground">{data.intro}</p>
        </motion.div>

        {data.image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
            className="my-16 lg:my-24 border border-border rounded-2xl overflow-hidden bg-secondary aspect-[3/2]"
          >
            <Img
              image={data.image}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              fallback="editorial"
            />
          </motion.div>
        )}

        <div className="space-y-16 lg:space-y-20">
          <div>
            {data.pillarEyebrow && (
              <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-6">
                {data.pillarEyebrow}
              </p>
            )}
            {data.pillarHeadline && (
              <h2 className="text-[28px] lg:text-[32px] leading-[1.2] tracking-tight font-medium text-foreground">
                {data.pillarHeadline}
              </h2>
            )}
          </div>

          {data.pillars.map((p, i) => (
            <motion.section
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease, delay: i * 0.08 }}
            >
              <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-3">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="text-[24px] lg:text-[28px] leading-[1.2] tracking-tight font-medium mb-4 text-foreground">
                {p.title}
              </h3>
              <p className="text-[17px] leading-[1.6] text-muted-foreground">{p.body}</p>
            </motion.section>
          ))}
        </div>

        {data.stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mt-20 lg:mt-28 pt-12 border-t border-border"
          >
            {data.statsEyebrow && (
              <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-6">
                {data.statsEyebrow}
              </p>
            )}
            <div className="grid grid-cols-3 gap-6">
              {data.stats.map((s) => (
                <div key={s.label}>
                  <div className="text-[32px] lg:text-[40px] tracking-tightest font-medium text-foreground">
                    {s.value}
                  </div>
                  <div className="text-[13px] text-muted-foreground mt-1 uppercase tracking-[0.05em]">
                    {s.label}
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
