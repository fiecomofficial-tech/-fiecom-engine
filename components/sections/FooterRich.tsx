'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef } from 'react'
import type { SectionData } from './types'
import { usePreviewHref, usePreviewHrefResolver } from '../usePreviewHref'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface Column {
  title: string
  links: { label: string; href?: string }[]
}

export default function FooterRich({ data }: { data: SectionData }) {
  const c = data.content
  const brand = (c.brand as string) ?? (c.headline as string) ?? 'Studio'
  const tagline = (c.tagline as string) ?? (c.subhead as string) ?? ''
  const giant = (c.giant as string) ?? brand
  const columns = (c.columns as Column[] | undefined) ?? []
  const legal = (c.legal as string) ?? '© ' + new Date().getFullYear()
  const cta = c.cta as { label: string; href?: string } | undefined
  const ctaHref = usePreviewHref(cta?.href, '#contact')
  const previewHref = usePreviewHrefResolver()
  const rootRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const ready =
        typeof document !== 'undefined' && 'fonts' in document
          ? (document as Document & { fonts: FontFaceSet }).fonts.ready
          : Promise.resolve()
      ready.then(() => {
        const g = root.querySelector('.fie-footer-giant')
        if (g) {
          const split = SplitText.create(g as Element, { type: 'words' })
          gsap.from(split.words, {
            yPercent: 110,
            opacity: 0,
            stagger: 0.04,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: root, start: 'top 75%' },
          })
        }
      })
    },
    { scope: rootRef },
  )

  return (
    <footer
      ref={rootRef}
      style={{
        position: 'relative',
        background: 'var(--fie-bg-deep, #08070a)',
        color: 'var(--fie-ink-on-deep, var(--fie-ink))',
        paddingBlock: 'clamp(64px, 8vw, 120px) clamp(28px, 3vw, 48px)',
        paddingInline: 'clamp(24px, 5vw, 64px)',
        borderTop: '1px solid color-mix(in oklab, currentColor 18%, transparent)',
      }}
    >
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1.4fr) repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(32px, 4vw, 56px)',
            paddingBottom: 'clamp(48px, 6vw, 88px)',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(1.4rem, 1.7vw, 1.7rem)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {brand}
            </p>
            {tagline && (
              <p
                style={{
                  marginTop: 18,
                  opacity: 0.65,
                  lineHeight: 1.55,
                  maxWidth: '36ch',
                  fontSize: '0.96rem',
                }}
              >
                {tagline}
              </p>
            )}
            {cta?.label && (
              <a
                href={ctaHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 24,
                  padding: '12px 22px',
                  borderRadius: 999,
                  background: 'var(--fie-accent, #e9aa56)',
                  color: 'var(--fie-on-accent, #1a120c)',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {cta.label} <span aria-hidden>→</span>
              </a>
            )}
          </div>

          {columns.map((col, i) => (
            <div key={i}>
              <p
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                  marginBottom: 18,
                }}
              >
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a
                      href={previewHref(l.href, '#')}
                      style={{
                        color: 'currentColor',
                        textDecoration: 'none',
                        opacity: 0.82,
                        fontSize: '0.95rem',
                      }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingBlock: 'clamp(40px, 5vw, 72px)',
            borderTop: '1px solid color-mix(in oklab, currentColor 14%, transparent)',
            overflow: 'hidden',
          }}
        >
          <h2
            className="fie-footer-giant"
            style={{
              margin: 0,
              fontFamily: 'var(--fie-font-display, serif)',
              fontSize: 'clamp(3rem, 16vw, 17rem)',
              lineHeight: 0.86,
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              textWrap: 'balance',
            }}
          >
            {giant}
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            opacity: 0.6,
            fontSize: '0.82rem',
            paddingTop: 18,
            borderTop: '1px solid color-mix(in oklab, currentColor 10%, transparent)',
          }}
        >
          <span>{legal}</span>
          <span style={{ display: 'inline-flex', gap: 16 }}>
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'currentColor', textDecoration: 'none', opacity: 0.85 }}
            >
              Media provided by Pexels
            </a>
            <span aria-hidden>·</span>
            <span>Powered by motion</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
