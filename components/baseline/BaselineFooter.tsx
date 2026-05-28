'use client'

import React from 'react'
import type { FooterData } from './types'
import { usePreviewHrefResolver } from '../usePreviewHref'

export default function BaselineFooter({ data }: { data: FooterData }) {
  const resolve = usePreviewHrefResolver()
  const brand = data?.brand ?? 'Studio'
  const columns = Array.isArray(data?.columns) ? data.columns : []
  const meta = Array.isArray(data?.meta) ? data.meta : [
    { label: 'Privacy', href: '/' },
    { label: 'Terms', href: '/' },
    { label: 'Security', href: '/' },
  ]
  const legal = data?.legal ?? `© ${new Date().getFullYear()} ${brand}. All rights reserved.`

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <a href={resolve('/', '/')} className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-background rounded-sm" />
              </div>
              <span className="font-semibold tracking-tight text-[15px] text-foreground">{brand}</span>
            </a>
            {data?.tagline && (
              <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[14rem]">
                {data.tagline}
              </p>
            )}
          </div>

          {columns.map((col, ci) => (
            <div key={col?.title ?? `col-${ci}`}>
              <h4 className="text-[12px] uppercase tracking-[0.05em] text-muted-foreground mb-5 font-medium">
                {col?.title}
              </h4>
              <ul className="space-y-3">
                {(Array.isArray(col?.links) ? col.links : []).map((l, li) => (
                  <li key={l?.label ?? `l-${li}`}>
                    <a
                      href={resolve(l.href, '/')}
                      className="text-[15px] text-foreground/80 hover:text-foreground hover:underline underline-offset-4 transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-[13px] text-muted-foreground">{legal}</p>
          <div className="flex gap-6">
            {meta.map((l, mi) => (
              <a
                key={l?.label ?? `m-${mi}`}
                href={resolve(l?.href, '/')}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {l?.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
