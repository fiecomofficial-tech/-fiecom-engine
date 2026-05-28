'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { NavData, NavLink } from './types'
import { usePreviewHrefResolver } from '../usePreviewHref'

const ease = [0.2, 0, 0, 1] as const

export default function BaselineNavbar({ data }: { data: NavData }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? '/'
  const resolve = usePreviewHrefResolver()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links: NavLink[] = Array.isArray(data?.links) ? data.links : []
  const brand = data?.brand ?? 'Studio'

  const previewMatch = pathname.match(/^(\/preview\/[^/]+)(?:\/.*)?$/)
  const basePath = previewMatch?.[1] ?? ''
  const currentSubpath = previewMatch ? pathname.slice(basePath.length) || '/' : '/'

  const isActive = (href: string): boolean => {
    if (!href.startsWith('/')) return false
    const target = href === '/' ? '/' : href
    if (basePath) {
      const resolved = target === '/' ? basePath : `${basePath}${target}`
      return resolved === pathname || (target === '/' && pathname === basePath)
    }
    return target === currentSubpath
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0)',
          borderColor: scrolled ? 'hsl(var(--border))' : 'rgba(0,0,0,0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
          width: scrolled ? 'min(900px, 100%)' : 'min(1200px, 100%)',
        }}
        transition={{ duration: 0.5, ease }}
        className="border rounded-full px-6 py-3 flex items-center justify-between"
        style={{ WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)' }}
      >
        <a href={resolve('/', '/')} className="flex items-center gap-2 group">
          <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
            <div className="w-2 h-2 bg-background rounded-sm" />
          </div>
          <span className="font-semibold tracking-tight text-[15px] text-foreground">{brand}</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = isActive(l.href)
            return (
              <a
                key={l.label}
                href={resolve(l.href, l.href)}
                className={`relative px-4 py-1.5 text-[14px] rounded-full transition-colors ease-weightless duration-300 ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="fie-baseline-nav-pill"
                    className="absolute inset-0 bg-secondary rounded-full -z-0"
                    transition={{ duration: 0.5, ease }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </a>
            )
          })}
        </div>

        {data.cta && (
          <div className="hidden md:flex">
            <a
              href={resolve(data.cta.href, '/contact')}
              className="bg-foreground text-background px-4 py-1.5 rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity ease-weightless"
            >
              {data.cta.label}
            </a>
          </div>
        )}

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-1.5 text-foreground"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease }}
            className="md:hidden fixed top-20 left-4 right-4 bg-background border border-border rounded-2xl p-3 shadow-luxe z-40"
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={resolve(l.href, l.href)}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-[15px] text-foreground hover:bg-secondary rounded-xl transition-colors"
              >
                {l.label}
              </a>
            ))}
            {data.cta && (
              <a
                href={resolve(data.cta.href, '/contact')}
                onClick={() => setOpen(false)}
                className="block mt-2 bg-foreground text-background text-center px-4 py-3 rounded-xl text-[15px] font-medium"
              >
                {data.cta.label}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
