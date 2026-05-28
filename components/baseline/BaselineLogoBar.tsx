'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { LogoBarData } from './types'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineLogoBar({ data }: { data: LogoBarData }) {
  const clients = Array.isArray(data?.clients) ? data.clients : []
  if (clients.length === 0) return null
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {data.eyebrow && (
          <p className="text-center text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-8">
            {data.eyebrow}
          </p>
        )}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center">
          {clients.map((client, i) => (
            <motion.div
              key={client?.name ?? `c-${i}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.4 }}
              whileHover={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease, delay: i * 0.05 }}
              className="text-center text-[18px] font-semibold tracking-tight text-foreground cursor-default"
            >
              {client.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
