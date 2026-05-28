'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { PageHeaderData } from './types'

const ease = [0.2, 0, 0, 1] as const

export default function BaselinePageHeader({ data }: { data: PageHeaderData }) {
  return (
    <div className="px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
      <div className="max-w-[42rem] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {data.eyebrow && (
            <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-3">
              {data.eyebrow}
            </p>
          )}
          <h1 className="text-[34px] lg:text-[42px] leading-[1.1] tracking-tightest font-medium text-foreground">
            {data.headline}
            {data.accent && (
              <>
                {' '}
                <span className="font-serif italic">{data.accent}</span>
                .
              </>
            )}
          </h1>
          {data.body && (
            <p className="mt-4 text-[17px] leading-[1.55] text-muted-foreground">{data.body}</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
