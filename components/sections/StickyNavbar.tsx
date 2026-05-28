'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import type { SectionData } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface NavLink {
  label: string
  href?: string
}

/**
 * Sticky navbar with scroll-direction-aware hide/show and progressive
 * backdrop blur. Includes mobile drawer with staggered link reveal.
 */
export default function StickyNavbar({ data }: { data: SectionData }) {
  const c = data.content
  const brand = (c.brand as string) ?? (c.headline as string) ?? 'Studio'
  // basePath derived from the current preview route — strip the
  // optional trailing /[slug] so paths resolve to siblings.
  const pathname = usePathname() ?? '/'
  const previewMatch = pathname.match(/^(\/preview\/[^/]+)(?:\/.*)?$/)
  const basePath = previewMatch?.[1] ?? ''

  const linkHref = (label: string, given?: string): string => {
    if (given && given.length) {
      // Anchors stay anchors; absolute "/x" paths get prefixed with
      // the preview basePath so the route actually exists.
      if (given.startsWith('#') || /^https?:\/\//.test(given) || given.startsWith('mailto:')) {
        return given
      }
      if (given.startsWith('/')) {
        return given === '/' ? basePath || '/' : `${basePath}${given}`
      }
      return given
    }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const map: Record<string, string> = {
      home: '#home',
      work: '#work',
      portfolio: '#work',
      projects: '#work',
      gallery: '#gallery',
      about: '#about',
      studio: '#about',
      story: '#story',
      process: '#process',
      services: '#features',
      features: '#features',
      pricing: '#pricing',
      plans: '#pricing',
      testimonials: '#testimonials',
      faq: '#faq',
      contact: '#contact',
      'start-a-project': '#start',
      start: '#start',
      journal: '#story',
      manifesto: '#manifesto',
    }
    return map[slug] ?? `#${slug}`
  }
  const links = ((c.links as NavLink[] | undefined) ?? [])
    .slice(0, 8)
    .map((l) => ({ label: l.label, href: linkHref(l.label, l.href) }))
  const cta = c.cta as { label: string; href?: string } | undefined
  const ctaHref = (() => {
    const h = cta?.href
    if (!h) return '#start'
    if (h.startsWith('/')) return h === '/' ? basePath || '/' : `${basePath}${h}`
    return h
  })()
  const navRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const el = navRef.current
      if (!el) return
      const dir = y > lastY.current ? 'down' : 'up'
      lastY.current = y
      if (y > 32) el.setAttribute('data-scrolled', 'true')
      else el.removeAttribute('data-scrolled')
      if (y > 200 && dir === 'down') el.setAttribute('data-hidden', 'true')
      else el.removeAttribute('data-hidden')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useGSAP(
    () => {
      if (!open || !menuRef.current) return
      const items = menuRef.current.querySelectorAll('[data-menu-item]')
      gsap.from(items, {
        y: 80,
        opacity: 0,
        stagger: 0.06,
        duration: 0.6,
        ease: 'power3.out',
      })
    },
    { dependencies: [open] },
  )

  return (
    <>
      <div
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 'clamp(20px, 4vw, 56px)',
          paddingBlock: 'clamp(14px, 1.5vw, 22px)',
          color: 'var(--fie-ink)',
          transition: 'background 0.4s ease, backdrop-filter 0.4s ease, transform 0.45s cubic-bezier(0.16,0.84,0.32,1)',
        }}
        className="fie-nav"
      >
        <a
          href={basePath || '/'}
          style={{
            fontFamily: 'var(--fie-font-display, serif)',
            fontSize: 'clamp(1.1rem, 1.3vw, 1.3rem)',
            letterSpacing: '-0.01em',
            color: 'currentColor',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          {brand}
        </a>

        <nav
          style={{
            display: 'flex',
            gap: 'clamp(18px, 2.5vw, 36px)',
            alignItems: 'center',
          }}
          className="fie-nav-links"
        >
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href ?? '#'}
              style={{
                color: 'currentColor',
                textDecoration: 'none',
                fontSize: '0.92rem',
                letterSpacing: '0.01em',
                opacity: 0.82,
                position: 'relative',
              }}
            >
              {l.label}
            </a>
          ))}
          {cta?.label && (
            <a
              href={ctaHref}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                background: 'var(--fie-ink)',
                color: 'var(--fie-bg)',
                fontSize: '0.88rem',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {cta.label}
            </a>
          )}
        </nav>

        <button
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
          className="fie-nav-burger"
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            color: 'currentColor',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: 8,
          }}
        >
          {open ? '×' : '☰'}
        </button>
      </div>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            background: 'var(--fie-bg)',
            color: 'var(--fie-ink)',
            padding: 'clamp(96px, 12vw, 140px) clamp(28px, 6vw, 64px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontFamily: 'var(--fie-font-display, serif)',
            fontSize: 'clamp(2.2rem, 7vw, 5rem)',
            lineHeight: 1.0,
            letterSpacing: '-0.025em',
          }}
        >
          {links.map((l, i) => (
            <a
              key={i}
              data-menu-item
              href={l.href ?? '#'}
              onClick={() => setOpen(false)}
              style={{ color: 'currentColor', textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        .fie-nav[data-scrolled="true"] {
          background: color-mix(in oklab, var(--fie-bg) 65%, transparent);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid color-mix(in oklab, currentColor 15%, transparent);
        }
        .fie-nav[data-hidden="true"] { transform: translateY(-110%); }
        @media (max-width: 760px) {
          .fie-nav-links { display: none !important; }
          .fie-nav-burger { display: inline-flex !important; }
        }
      `}</style>
    </>
  )
}
