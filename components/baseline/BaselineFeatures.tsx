'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { FeaturesData } from './types'
import { Img } from '../Img'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineFeatures({ data }: { data: FeaturesData }) {
  const items = Array.isArray(data?.items)
    ? data.items.filter((it) => it?.title && it?.body)
    : []
  if (items.length === 0) return null
  return (
    <section className="px-6 lg:px-8 py-32">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-20">
          {data.eyebrow && (
            <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-4">
              {data.eyebrow}
            </p>
          )}
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.1] tracking-tightest font-medium text-foreground">
            {data.headline}
            {data.accent && (
              <>
                {' '}
                <span className="text-muted-foreground">{data.accent}</span>
              </>
            )}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item?.title ?? `f-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease, delay: i * 0.1 }}
              className="group border border-border rounded-2xl p-6 bg-background hover:shadow-luxe transition-shadow duration-500 ease-weightless"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-6">
                <Img
                  image={item.image}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  fallback="editorial"
                />
              </div>
              {item.eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-3">
                  {item.eyebrow}
                </p>
              )}
              <h3 className="text-[20px] tracking-tight font-medium mb-2 leading-snug text-foreground">
                {item.title}
              </h3>
              <p className="text-[15px] text-muted-foreground leading-[1.55]">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
