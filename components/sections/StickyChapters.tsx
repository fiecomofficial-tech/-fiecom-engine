'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import React, { useRef, useState } from 'react'
import type { SectionData } from './types'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface Chapter {
  index?: string
  title: string
  body: string
}

/**
 * Pinned three-phase scrub. Text columns swap with cross-fade while
 * the image column scales and clip-path expands to a second image.
 */
export default function StickyChapters({ data }: { data: SectionData }) {
  const chapters = (data.content.chapters as Chapter[] | undefined) ?? []
  const ch1 = chapters[0] ?? { title: '', body: '' }
  const ch2 = chapters[1] ?? { title: '', body: '' }
  const ch3 = chapters[2] ?? ch2
  const imgA = data.images?.primary
  const imgB = data.images?.secondary ?? imgA
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [reveal, setReveal] = useState(false)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const textEls = root.querySelectorAll('.col-3 h2, .col-3 p')
      textEls.forEach((el) => {
        const split = new SplitText(el as Element, { type: 'lines', linesClass: 'line' })
        split.lines.forEach((line) => {
          line.innerHTML = `<span>${(line as HTMLElement).textContent}</span>`
        })
      })
      ScrollTrigger.refresh()

      gsap.set('.col-3 .col-content-wrapper .line span', { yPercent: 0 })
      gsap.set('.col-3 .col-content-wrapper-2 .line span', { yPercent: -125 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 20%',
          end: '+=90%',
          pin: true,
          scrub: 1,
        },
      })

      tl.add(() => setReveal(false))
      tl.to('.col-1', { opacity: 0, scale: 0.8, duration: 0.8 })
        .to('.col-2', { x: '0%', duration: 0.8 }, '<')
        .to('.col-3', { y: '0%', duration: 0.8 }, '<')
        .to('.col-img-1 img', { scale: 1, duration: 0.8 }, '<')
        .to(
          '.col-img-2',
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 0.8,
          },
          '<',
        )
        .to('.col-img-2 img', { scale: 1.6, duration: 0.8 }, '<')

      tl.add(() => setReveal(true))
      tl.to('.col-2', { opacity: 0, scale: 0.8, duration: 0.8 })
        .to(
          '.col-3 .col-content-wrapper .line span',
          { yPercent: -125, duration: 0.8 },
          '<',
        )
      tl.to('.col-3', { x: '0%', duration: 0.8 }, '-=0.8')
        .to('.col-4', { y: '0%', duration: 0.8 }, '<')
        .to(
          '.col-3 .col-content-wrapper-2 .line span',
          { yPercent: 0, delay: 0.4, duration: 0.8 },
          '<',
        )

      return () => {
        ScrollTrigger.getAll().forEach((st) => st.kill())
        tl.kill()
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--fie-bg-deep, #181717)',
        color: 'var(--fie-ink-on-deep, var(--fie-ink))',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Col 1 — initial text */}
        <ChapterText
          className="col-1"
          chapter={ch1}
          progress={`1 / ${chapters.length || 3}`}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'clamp(28px, 4vw, 64px)',
          }}
        />

        {/* Col 2 — image stack */}
        <div
          className="col-2"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            transform: 'translateX(100%)',
          }}
        >
          <div className="col-img col-img-1" style={{ overflow: 'hidden' }}>
            {imgA && (
              <img
                src={imgA.url}
                alt={imgA.alt ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.4)' }}
                draggable={false}
              />
            )}
          </div>
          <div
            className="col col-img-2"
            style={{
              overflow: 'hidden',
              padding: '0.5rem',
              clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            }}
          >
            {imgB && (
              <img
                src={imgB.url}
                alt={imgB.alt ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1)' }}
                draggable={false}
              />
            )}
          </div>
        </div>

        {/* Col 3 — overlapping text */}
        <div
          className="col-3"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateY(100%)',
            padding: 'clamp(28px, 4vw, 64px)',
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            color: 'var(--fie-ink-on-deep, var(--fie-ink))',
          }}
        >
          <ChapterText
            wrapperClass="col-content-wrapper"
            chapter={ch2}
            progress={reveal ? `3 / ${chapters.length || 3}` : `2 / ${chapters.length || 3}`}
          />
          <ChapterText
            wrapperClass="col-content-wrapper-2"
            chapter={ch3}
            progress={`3 / ${chapters.length || 3}`}
          />
        </div>

        <div
          className="col-4"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translateY(100%)',
            overflow: 'hidden',
          }}
        >
          {imgB && (
            <img
              src={imgB.url}
              alt={imgB.alt ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function ChapterText({
  chapter,
  progress,
  className,
  wrapperClass,
  style,
}: {
  chapter: Chapter
  progress: string
  className?: string
  wrapperClass?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={className} style={style}>
      <div className={wrapperClass}>
        <h2
          style={{
            fontFamily: 'var(--fie-font-display, serif)',
            fontSize: 'clamp(1.4rem, 2.4vw, 2.2rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            margin: 0,
            maxWidth: '24ch',
          }}
        >
          {chapter.title}
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            marginTop: '1.25rem',
          }}
        >
          <div style={{ display: 'inline-flex' }}>
            <span
              style={{
                border: '1px solid currentColor',
                padding: '0.25rem 0.85rem',
                borderRadius: 999,
                fontSize: '0.85rem',
                opacity: 0.85,
              }}
            >
              {progress.split(' / ')[0]}
            </span>
            <span
              style={{
                border: '1px solid currentColor',
                padding: '0.25rem 0.85rem',
                borderRadius: 999,
                fontSize: '0.85rem',
                opacity: 0.35,
              }}
            >
              {progress.split(' / ')[1]}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', maxWidth: '32ch', opacity: 0.85, margin: 0 }}>
            {chapter.body}
          </p>
        </div>
      </div>
    </div>
  )
}
