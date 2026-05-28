'use client'

import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Page-wide smooth scroll. Drives `gsap` ticker so every ScrollTrigger
 * stays perfectly in sync with the eased scroll position — otherwise
 * pinned sections jitter at high deltaY.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time * 1000)
    }

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
