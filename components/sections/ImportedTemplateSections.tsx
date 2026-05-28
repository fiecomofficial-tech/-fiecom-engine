'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import React, { useRef, useState } from 'react'
import type { SectionData, SectionImage } from './types'
import { MediaBg } from '../MediaBg'
import { usePreviewHref } from '../usePreviewHref'
import { useIsMobile } from '../motion/useIsMobile'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Item = Record<string, unknown>

const accentPalette = [
  'var(--fie-accent)',
  'var(--fie-bg-accent)',
  'var(--fie-surface)',
  'var(--fie-bg-deep)',
  'var(--fie-ink)',
]

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function items(value: unknown, fallback: Item[] = []): Item[] {
  return Array.isArray(value) ? value.filter((v): v is Item => !!v && typeof v === 'object') : fallback
}

function strings(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : fallback
}

function imgAt(data: SectionData, index: number): SectionImage | undefined {
  const gallery = data.images?.gallery ?? []
  return gallery[index] ?? data.images?.primary ?? data.images?.secondary
}

function titleParts(headline: unknown, fallback: string): string[] {
  const raw = text(headline, fallback)
  const parts = raw.split(/\s+/).filter(Boolean)
  return parts.length ? parts : [fallback]
}

function BigText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--fie-font-display, serif)',
        fontSize: 'clamp(4.5rem, 18vw, 17rem)',
        fontWeight: 900,
        lineHeight: 0.78,
        letterSpacing: 0,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </h2>
  )
}

function RoundButton({ label, href }: { label?: string; href?: string }) {
  const safeHref = usePreviewHref(href, '#contact')
  if (!label) return null
  return (
    <a
      href={safeHref}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
        padding: '0.85rem 1.5rem',
        borderRadius: 999,
        background: 'var(--fie-accent)',
        color: 'var(--fie-on-accent)',
        textDecoration: 'none',
        textTransform: 'uppercase',
        fontSize: '0.78rem',
        fontWeight: 800,
      }}
    >
      {label}
    </a>
  )
}

function mediaNode(image: SectionImage | undefined, alt: string, filter = 'brightness(0.8)') {
  if (!image?.url) return null
  if (image.videoUrl) {
    return (
      <video
        src={image.videoUrl}
        poster={image.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }}
      />
    )
  }
  return (
    <img
      src={image.url}
      alt={image.alt ?? alt}
      loading="lazy"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter }}
    />
  )
}

function TiltCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  const [transform, setTransform] = useState('')
  return (
    <div
      className={className}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height
        setTransform(
          `perspective(700px) rotateX(${(y - 0.5) * 5}deg) rotateY(${(x - 0.5) * -5}deg) scale3d(.97,.97,.97)`,
        )
      }}
      onMouseLeave={() => setTransform('')}
      style={{ transition: 'transform 260ms ease', transform, ...style }}
    >
      {children}
    </div>
  )
}

export function ZentryHero({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      gsap.set('.zt-video-frame', {
        clipPath: 'polygon(14% 0, 72% 0, 88% 90%, 0 95%)',
        borderRadius: '0% 0% 40% 10%',
      })
      gsap.from('.zt-video-frame', {
        clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)',
        borderRadius: '0% 0% 0% 0%',
        ease: 'power1.inOut',
        scrollTrigger: { trigger: '.zt-video-frame', start: 'center center', end: 'bottom center', scrub: true },
      })
      gsap.from('.zt-copy > *', { y: 36, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out' })
    },
    { scope: root },
  )

  const words = titleParts(c.headline, 'Cinematic')
  return (
    <section ref={root} style={{ position: 'relative', height: '100dvh', width: '100%', overflow: 'hidden', background: 'var(--fie-bg)' }}>
      <div className="zt-video-frame" style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%', overflow: 'hidden', background: 'var(--fie-bg-accent)' }}>
        <MediaBg image={data.images?.primary} eager filter="brightness(0.64)" />
        <div style={{ position: 'absolute', inset: 0, background: 'var(--fie-image-vignette)' }} />
        <div className="zt-copy" style={{ position: 'relative', zIndex: 2, padding: 'clamp(5rem, 10vw, 8rem) clamp(1.5rem, 5vw, 5rem)', color: 'var(--fie-photo-text)' }}>
          <BigText style={{ color: 'var(--fie-photo-text)' }}>{words.slice(0, -1).join(' ') || words[0]}</BigText>
          <p style={{ maxWidth: 360, lineHeight: 1.35, marginBlock: '1rem 1.5rem', color: 'var(--fie-photo-text)' }}>{text(c.body, text(c.subhead))}</p>
          <RoundButton label={c.cta?.label} href={c.cta?.href} />
        </div>
      </div>
      <BigText style={{ position: 'absolute', right: 20, bottom: 10, color: 'var(--fie-ink)' }}>{words.at(-1)}</BigText>
    </section>
  )
}

export function ZentryAbout({ data }: { data: SectionData }) {
  const root = useRef<HTMLElement | null>(null)
  const c = data.content
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: '.zt-about-clip', start: 'center center', end: '+=800 center', scrub: 0.5, pin: true, pinSpacing: true },
      }).to('.zt-about-mask', { width: '100vw', height: '100vh', borderRadius: 0 })
    },
    { scope: root },
  )
  return (
    <section ref={root} style={{ minHeight: '150vh', width: '100%', overflow: 'hidden', background: 'var(--fie-bg)', color: 'var(--fie-ink)' }}>
      <div style={{ position: 'relative', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '12vh 1.5rem 4rem', textAlign: 'center' }}>
        <p style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: '.18em' }}>{text(c.eyebrow, 'Welcome')}</p>
        <BigText style={{ maxWidth: 980, fontSize: 'clamp(3.2rem, 9vw, 8rem)' }}>{text(c.headline, 'Discover the shared adventure')}</BigText>
        <div style={{ maxWidth: 560, lineHeight: 1.45, color: 'var(--fie-ink-2)' }}>{text(c.body, text(c.subhead))}</div>
      </div>
      <div className="zt-about-clip" style={{ height: '100dvh', width: '100%', position: 'relative' }}>
        <div className="zt-about-mask" style={{ position: 'absolute', left: '50%', top: 0, zIndex: 2, width: 'min(420px, 70vw)', height: '60vh', transform: 'translateX(-50%)', overflow: 'hidden', borderRadius: 28 }}>
          {mediaNode(data.images?.primary, text(c.headline), 'brightness(0.9)')}
        </div>
      </div>
    </section>
  )
}

export function ZentryFeatures({ data }: { data: SectionData }) {
  const c = data.content
  const features = items(c.features, items(c.cards)).slice(0, 5)
  return (
    <section style={{ background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', padding: 'clamp(5rem, 10vw, 9rem) clamp(1rem, 4vw, 4rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ padding: '0 clamp(1rem, 3vw, 3rem) clamp(3rem, 7vw, 6rem)' }}>
          <p style={{ fontSize: '1.1rem', margin: 0 }}>{text(c.eyebrow, 'Features')}</p>
          <p style={{ maxWidth: 520, color: 'var(--fie-ink-2)', lineHeight: 1.45 }}>{text(c.body, text(c.headline, 'A layered cinematic system'))}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: 'minmax(260px, 35vh)', gap: 24 }}>
          {features.map((feature, i) => (
            <TiltCard key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, gridColumn: i === 0 ? 'span 2' : undefined, background: i === 3 ? 'var(--fie-accent)' : '#111' }}>
              {i !== 3 && mediaNode(imgAt(data, i), text(feature.title), 'brightness(0.65)')}
              <div style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: i === 3 ? 'transparent' : 'linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.7))', color: i === 3 ? 'var(--fie-on-accent)' : '#fff' }}>
                <BigText style={{ fontSize: 'clamp(2.4rem, 5vw, 5rem)', color: 'currentColor' }}>{text(feature.title, `Feature ${i + 1}`)}</BigText>
                <p style={{ maxWidth: 420, lineHeight: 1.4 }}>{text(feature.body, text(feature.description))}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ZentryStory({ data }: { data: SectionData }) {
  const c = data.content
  const frame = useRef<HTMLDivElement | null>(null)
  return (
    <section style={{ minHeight: '110vh', background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', overflow: 'hidden', padding: '5rem 0 8rem' }}>
      <div style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '.18em' }}>{text(c.eyebrow, 'Story')}</div>
      <div style={{ position: 'relative', minHeight: '85vh', display: 'grid', placeItems: 'center' }}>
        <BigText style={{ position: 'relative', zIndex: 2, textAlign: 'center', mixBlendMode: 'difference', color: '#fff' }}>{text(c.headline, 'The story of a hidden realm')}</BigText>
        <div style={{ position: 'absolute', inset: '8% 8% 0', filter: 'drop-shadow(0 30px 80px rgba(0,0,0,.45))' }}>
          <div style={{ width: '72%', height: '78%', margin: '0 auto', clipPath: 'polygon(4% 0, 83% 21%, 100% 73%, 0% 100%)', overflow: 'hidden' }}>
            <div
              ref={frame}
              onMouseMove={(e) => {
                const el = frame.current
                if (!el) return
                const r = el.getBoundingClientRect()
                gsap.to(el, { rotateX: ((e.clientY - r.top - r.height / 2) / r.height) * -14, rotateY: ((e.clientX - r.left - r.width / 2) / r.width) * 14, duration: 0.3, ease: 'power1.out' })
              }}
              onMouseLeave={() => frame.current && gsap.to(frame.current, { rotateX: 0, rotateY: 0, duration: 0.3 })}
              style={{ width: '100%', height: '100%' }}
            >
              {mediaNode(data.images?.primary ?? data.images?.secondary, text(c.headline), 'brightness(0.85)')}
            </div>
          </div>
        </div>
      </div>
      <p style={{ maxWidth: 420, margin: '-14rem 12vw 0 auto', lineHeight: 1.5, position: 'relative', zIndex: 3 }}>{text(c.body, text(c.subhead))}</p>
    </section>
  )
}

export function ZentryContact({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <section style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 4rem)', background: 'var(--fie-bg)', color: 'var(--fie-ink)' }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, minHeight: 520, background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '5rem 1rem' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', width: i === 2 ? 'min(360px, 46vw)' : 'min(260px, 30vw)', height: i === 2 ? 420 : 320, left: i === 0 ? '4%' : undefined, right: i === 1 ? '8%' : undefined, top: i === 0 ? '8%' : i === 1 ? '18%' : '-8%', clipPath: i === 0 ? 'polygon(25% 0%, 74% 0, 69% 64%, 34% 73%)' : i === 1 ? 'polygon(29% 15%, 85% 30%, 50% 100%, 10% 64%)' : 'polygon(16% 0, 89% 15%, 75% 100%, 0 97%)', opacity: 0.8 }}>
            {mediaNode(imgAt(data, i), text(c.headline), 'brightness(0.7)')}
          </div>
        ))}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: '.18em' }}>{text(c.eyebrow, 'Join us')}</p>
          <BigText style={{ maxWidth: 900, fontSize: 'clamp(3rem, 8vw, 8rem)', color: 'currentColor' }}>{text(c.headline, 'Let us build the new era together')}</BigText>
          <div style={{ marginTop: 32 }}><RoundButton label={c.cta?.label ?? 'Contact us'} href={c.cta?.href} /></div>
        </div>
      </div>
    </section>
  )
}

export function ZentryFooter({ data }: { data: SectionData }) {
  const c = data.content
  const links = items(c.links, items(c.columns).flatMap((col) => items(col.links))).slice(0, 4)
  return (
    <footer style={{ background: 'var(--fie-accent)', color: 'var(--fie-on-accent)', padding: '1rem clamp(1rem, 4vw, 3rem)', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: '.9rem' }}>
      <p style={{ margin: 0 }}>{text(c.legal, `${text(c.brand, 'Brand')} ${new Date().getFullYear()}. All rights reserved.`)}</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {links.map((link, i) => <a key={i} href={text(link.href, '#')} style={{ color: 'inherit' }}>{text(link.label, `Link ${i + 1}`)}</a>)}
      </div>
      <a href={text(c.cta?.href, '#privacy')} style={{ color: 'inherit' }}>{text(c.cta?.label, 'Privacy Policy')}</a>
    </footer>
  )
}

export function FlowHero({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  useGSAP(
    () => {
      gsap.to('.flow-hero-inner', { scale: 0.8, rotate: -5, scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.flow-orbit', { rotate: 360, repeat: -1, duration: 6, ease: 'none' })
    },
    { scope: root },
  )
  return (
    <section ref={root} style={{ height: '120vh', background: 'var(--fie-accent)', color: 'var(--fie-on-accent)', position: 'relative' }}>
      <div className="flow-hero-inner" style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <h1 style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', margin: 0, fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(8rem, 45vw, 42rem)', lineHeight: 0.75, textTransform: 'uppercase', letterSpacing: 0 }}>{text(c.headline, 'flow')}</h1>
        <div className="flow-orbit" style={{ position: 'absolute', right: '8vw', bottom: '18vh', width: 190, height: 190, border: '2px dashed currentColor', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
          <span style={{ fontFamily: 'var(--fie-font-display)', fontSize: 42, textTransform: 'uppercase' }}>{text(c.badge, text(c.eyebrow, 'live'))}</span>
        </div>
        <p style={{ position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)', maxWidth: 560, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.1 }}>{text(c.body, text(c.subhead))}</p>
      </div>
    </section>
  )
}

export function FlowEvent({ data }: { data: SectionData }) {
  const c = data.content
  const cards = items(c.cards, items(c.events)).slice(0, 5)
  return (
    <section style={{ minHeight: '100vh', background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', padding: 'clamp(6rem, 16vw, 14rem) 0 5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, padding: '0 clamp(1rem, 4vw, 3rem) 4rem' }}>
        <BigText style={{ color: 'currentColor' }}>{text(c.headline, 'events')}</BigText>
        <p style={{ maxWidth: 380, textAlign: 'right', textTransform: 'uppercase', lineHeight: 1.1 }}>{text(c.body, text(c.subhead))}</p>
      </div>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(320px, 33vw)', overflowX: 'auto' }}>
        {cards.map((card, i) => (
          <article key={i} style={{ height: 'min(760px, 78vh)', position: 'relative', overflow: 'hidden', background: accentPalette[i % accentPalette.length] }}>
            {mediaNode(imgAt(data, i), text(card.title), 'brightness(0.72)')}
            <div style={{ position: 'absolute', inset: 0, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, textTransform: 'uppercase', fontSize: 14 }}><span>{text(card.heading, text(card.category, text(c.eyebrow, 'feature')))}</span><span>{text(card.meta, text(card.date, 'now'))}</span></div>
              <BigText style={{ color: '#fff', fontSize: 'clamp(4rem, 9vw, 8rem)' }}>{text(card.title, `Moment ${i + 1}`)}</BigText>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function FlowWhoWeAre({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  useGSAP(() => {
    gsap.to('.flow-float-a', { y: 160, rotate: 35, scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
    gsap.to('.flow-float-b', { y: -180, rotate: -35, scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } })
  }, { scope: root })
  return (
    <section ref={root} style={{ background: 'var(--fie-surface)', color: 'var(--fie-ink)', minHeight: '160vh', padding: '6rem clamp(1rem, 4vw, 3rem)', overflow: 'hidden' }}>
      <div style={{ minHeight: '80vh', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
        <div><BigText>{text(c.headline, 'What is the movement')}</BigText><p style={{ maxWidth: 460, marginLeft: 'auto', lineHeight: 1.35 }}>{text(c.body, text(c.subhead))}</p></div>
        <div style={{ position: 'relative', minHeight: 520 }}>
          <div className="flow-float-a" style={{ position: 'absolute', right: '10%', top: '8%', width: 220, height: 220, borderRadius: '50%', background: 'var(--fie-accent)' }} />
          <div style={{ position: 'absolute', inset: '8% 0 0 8%', border: '2px solid var(--fie-ink)', borderRadius: '50%', transform: 'rotate(-18deg)' }} />
        </div>
      </div>
      <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', position: 'relative' }}>
        <div className="flow-float-b" style={{ position: 'absolute', left: '6%', top: 0, width: 180, height: 180, borderRadius: 36, background: 'var(--fie-bg-accent)' }} />
        <BigText style={{ maxWidth: 1100, fontSize: 'clamp(4rem, 13vw, 13rem)' }}>{text(c.statement, text(c.secondLine, 'A place to learn, share knowledge and network'))}</BigText>
      </div>
    </section>
  )
}

export function FlowOnDemand({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <section style={{ background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)' }}>
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '5rem 1rem' }}>
        <div><BigText style={{ color: 'currentColor' }}>{text(c.eyebrow, 'on demand')}</BigText><p style={{ maxWidth: 980, fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(3rem, 8vw, 8rem)', lineHeight: 0.9, textTransform: 'uppercase' }}>{text(c.body, text(c.headline, 'Embark on a focused journey with expert guidance.'))}</p></div>
      </div>
      <div style={{ height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
        <MediaBg image={data.images?.primary} eager filter="brightness(0.66)" />
        <BigText style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap', color: '#fff' }}>{text(c.badge, text(c.subhead, 'ON DEMAND'))}</BigText>
      </div>
    </section>
  )
}

export function FlowTutors({ data }: { data: SectionData }) {
  const c = data.content
  const cards = items(c.people, items(c.cards)).slice(0, 4)
  return (
    <section style={{ minHeight: '120vh', background: '#010101', color: '#fff', padding: 'clamp(7rem, 15vw, 13rem) 0 6rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', padding: '0 clamp(1rem, 4vw, 3rem) 3rem' }}>
        <BigText style={{ color: '#fff' }}>{text(c.headline, 'The guides')}</BigText>
        <p style={{ maxWidth: 360, textAlign: 'right', textTransform: 'uppercase' }}>{text(c.body, text(c.subhead))}</p>
      </div>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(300px, 34vw)', overflowX: 'auto' }}>
        {cards.map((card, i) => (
          <article key={i} style={{ height: 720, position: 'relative', overflow: 'hidden', background: accentPalette[i % accentPalette.length] }}>
            {mediaNode(imgAt(data, i), text(card.title), 'brightness(0.9)')}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
              <BigText style={{ color: '#fff', fontSize: 'clamp(4rem, 8vw, 7rem)' }}>{text(card.title, `Guide ${i + 1}`)}</BigText>
            </div>
          </article>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(1rem, 5vw, 5rem)', flexWrap: 'wrap', paddingTop: '5rem' }}>
        {items(c.stats).slice(0, 4).map((stat, i) => <BigText key={i} style={{ color: accentPalette[i % accentPalette.length], fontSize: 'clamp(4rem, 9vw, 8rem)' }}>{text(stat.value, text(stat.title))}</BigText>)}
      </div>
    </section>
  )
}

export function FlowWhatWeDo({ data }: { data: SectionData }) {
  const c = data.content
  const cards = items(c.cards, items(c.features)).slice(0, 3)
  return (
    <section style={{ background: 'var(--fie-bg)', color: 'var(--fie-ink)' }}>
      <div style={{ padding: 'clamp(6rem, 15vw, 13rem) clamp(1rem, 4vw, 3rem) 4rem', background: 'var(--fie-bg-accent)', color: 'var(--fie-ink-on-accent-bg)', display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <BigText style={{ color: 'currentColor' }}>{text(c.headline, 'What we do')}</BigText>
        <p style={{ textAlign: 'right', maxWidth: 320, textTransform: 'uppercase' }}>{text(c.body, text(c.subhead))}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', minHeight: '80vh' }}>
        {cards.map((card, i) => (
          <article key={i} style={{ position: 'relative', padding: 32, background: accentPalette[i % accentPalette.length], color: i === 2 ? 'var(--fie-on-accent)' : 'var(--fie-ink)' }}>
            <div style={{ position: 'absolute', inset: '15% 12% 22%', overflow: 'hidden', borderRadius: '50%' }}>{mediaNode(imgAt(data, i), text(card.title), 'brightness(0.92)')}</div>
            <BigText style={{ position: 'absolute', left: 24, right: 24, bottom: 12, fontSize: 'clamp(4rem, 9vw, 8rem)', color: 'currentColor' }}>{text(card.title, `Offer ${i + 1}`)}</BigText>
          </article>
        ))}
      </div>
    </section>
  )
}

export function FlowPartyTools({ data }: { data: SectionData }) {
  const c = data.content
  const tools = items(c.items, items(c.links, items(c.features))).slice(0, 6)
  return (
    <section style={{ background: 'var(--fie-accent)', color: 'var(--fie-on-accent)', padding: 'clamp(6rem, 12vw, 10rem) 0 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '0 clamp(1rem, 4vw, 3rem) 3rem' }}>
        <BigText style={{ color: 'currentColor' }}>{text(c.headline, 'Tools')}</BigText>
        <p style={{ textAlign: 'right', maxWidth: 360, textTransform: 'uppercase' }}>{text(c.body, text(c.subhead))}</p>
      </div>
      {tools.map((tool, i) => (
        <a key={i} href={text(tool.href, '#')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid currentColor', padding: '1rem clamp(1rem, 4vw, 3rem)', color: 'inherit', textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(2.5rem, 7vw, 6rem)', lineHeight: 0.9, textTransform: 'uppercase' }}>{text(tool.title, text(tool.label, `Tool ${i + 1}`))}</span>
          <span style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}>↑</span>
        </a>
      ))}
    </section>
  )
}

export function FlowFooter({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <footer style={{ background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', padding: 'clamp(6rem, 12vw, 10rem) clamp(1rem, 4vw, 3rem) 1rem', textAlign: 'center', overflow: 'hidden' }}>
      <BigText style={{ color: 'currentColor', fontSize: 'clamp(5rem, 22vw, 22rem)' }}>{text(c.headline, text(c.giant, 'subscribe'))}</BigText>
      <div style={{ margin: '3rem 0' }}><RoundButton label={c.cta?.label ?? 'Start now'} href={c.cta?.href} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', opacity: 0.75, textTransform: 'uppercase' }}><span>{text(c.brand, 'Brand')}</span><span>{text(c.legal, `${new Date().getFullYear()}`)}</span></div>
    </footer>
  )
}

export function SpyltHero({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  useGSAP(() => {
    gsap.from('.spy-hero-title', { yPercent: 140, opacity: 0, duration: 0.9, ease: 'power2.out' })
    gsap.to('.spy-hero-container', { rotate: 7, scale: 0.9, yPercent: 30, scrollTrigger: { trigger: root.current, start: '1% top', end: 'bottom top', scrub: true } })
    gsap.to('.spy-reveal', { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 1, ease: 'circ.out' })
  }, { scope: root })
  return (
    <section ref={root} style={{ background: 'var(--fie-bg, #faeade)', color: 'var(--fie-ink, #523122)', overflow: 'hidden' }}>
      <div className="spy-hero-container" style={{ minHeight: '100dvh', position: 'relative' }}>
        <MediaBg image={data.images?.primary} eager filter="brightness(0.9) saturate(0.9)" />
        <div style={{ position: 'relative', zIndex: 2, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 1rem' }}>
          <BigText style={{ color: 'currentColor', fontSize: 'clamp(3.4rem, 12vw, 10rem)' }}><span className="spy-hero-title">{text(c.headline, 'Freaking delicious')}</span></BigText>
          <div className="spy-reveal" style={{ clipPath: 'polygon(50% 0,50% 0,50% 100%,50% 100%)', transform: 'rotate(-4deg)', border: '0.45vw solid var(--fie-bg, #faeade)', background: 'var(--fie-accent, #a26833)', color: 'var(--fie-on-accent, #fce1cd)', padding: '.25rem 1rem' }}>
            <BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 10vw, 8rem)' }}>{text(c.subhead, text(c.badge, 'Fuel up'))}</BigText>
          </div>
          <p style={{ maxWidth: 560, lineHeight: 1.2, fontSize: '1.1rem' }}>{text(c.body)}</p>
          <RoundButton label={c.cta?.label ?? 'Get it now'} href={c.cta?.href} />
        </div>
      </div>
    </section>
  )
}

export function SpyltMessage({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  useGSAP(() => {
    gsap.to('.spy-msg-dim', { color: 'var(--fie-on-accent, #faeade)', stagger: 0.2, scrollTrigger: { trigger: root.current, start: 'top center', end: 'bottom center', scrub: true } })
    gsap.to('.spy-msg-badge', { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', scrollTrigger: { trigger: root.current, start: 'top 60%' } })
  }, { scope: root })
  return (
    <section ref={root} style={{ minHeight: '100dvh', background: 'var(--fie-bg-accent, #7f3b2d)', color: 'var(--fie-on-accent, #faeade)', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '6rem 1rem', overflow: 'hidden' }}>
      <div>
        <BigText style={{ color: 'color-mix(in srgb, var(--fie-on-accent, #faeade) 8%, transparent)', fontSize: 'clamp(3rem, 10vw, 9rem)' }}><span className="spy-msg-dim">{text(c.firstLine, text(c.headline, 'Stir up the past'))}</span></BigText>
        <div className="spy-msg-badge" style={{ display: 'inline-block', clipPath: 'polygon(0% 0%,0% 0%,0% 100%,0% 100%)', transform: 'rotate(3deg)', background: 'var(--fie-accent, #e3a458)', color: 'var(--fie-on-accent, #7f3b2d)', padding: '.4rem 1rem', margin: '-1rem 0' }}><BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 9vw, 8rem)' }}>{text(c.accent, 'Fuel up')}</BigText></div>
        <BigText style={{ color: 'color-mix(in srgb, var(--fie-on-accent, #faeade) 8%, transparent)', fontSize: 'clamp(3rem, 10vw, 9rem)' }}><span className="spy-msg-dim">{text(c.secondLine, text(c.subhead, 'your future'))}</span></BigText>
        <p style={{ maxWidth: 500, margin: '3rem auto 0', lineHeight: 1.45 }}>{text(c.body)}</p>
      </div>
    </section>
  )
}

export function SpyltFlavor({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  const track = useRef<HTMLDivElement | null>(null)
  const isTablet = useIsMobile(1024)
  const cards = items(c.cards, items(c.features)).slice(0, 6)
  useGSAP(() => {
    if (isTablet || !track.current) return
    const amount = track.current.scrollWidth - window.innerWidth
    gsap.to(track.current, { x: -amount, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: '+=4000', scrub: true, pin: true } })
  }, { scope: root, dependencies: [isTablet] })
  return (
    <section ref={root} style={{ minHeight: '100vh', background: 'var(--fie-bg, #faeade)', color: 'var(--fie-ink, #523122)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: '10%', zIndex: 4, transform: 'translateX(-50%)' }}><RoundButton label={c.cta?.label ?? 'Get it now'} href={c.cta?.href} /></div>
      <div ref={track} style={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', minHeight: '100vh', alignItems: 'center' }}>
        <div style={{ flex: '0 0 57vw', padding: '4rem', textAlign: 'center' }}><BigText style={{ color: 'currentColor' }}>{text(c.headline, 'Choose your flavor')}</BigText></div>
        <div style={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', gap: 'clamp(2rem, 8vw, 10rem)', padding: '3rem' }}>
          {cards.map((card, i) => (
            <TiltCard key={i} style={{ flex: '0 0 min(620px, 82vw)', height: 'min(620px, 70vh)', position: 'relative', transform: `rotate(${i % 2 ? 8 : -8}deg)`, background: accentPalette[i % accentPalette.length], borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', background: 'rgba(255,255,255,.22)' }} />
              <div style={{ position: 'absolute', inset: '10% 18% 12%' }}>{mediaNode(imgAt(data, i), text(card.title), 'brightness(0.95)')}</div>
              <h3 style={{ position: 'absolute', left: 24, bottom: 20, margin: 0, color: 'var(--fie-photo-text, #faeade)', textTransform: 'uppercase', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', lineHeight: 0.9 }}>{text(card.title, `Flavor ${i + 1}`)}</h3>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SpyltNutrition({ data }: { data: SectionData }) {
  const c = data.content
  const stats = items(c.stats, items(c.nutrients)).slice(0, 5)
  return (
    <section style={{ minHeight: '110vh', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle, var(--fie-bg, #f3ece2), var(--fie-surface, #dcccb0))', color: 'var(--fie-ink, #523122)', padding: '6rem clamp(1rem, 4vw, 3rem)' }}>
      <div style={{ position: 'absolute', inset: '28% 0 0' }}>{mediaNode(data.images?.primary, text(c.headline), 'brightness(0.95)')}</div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
        <div><BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 10vw, 9rem)' }}>{text(c.headline, 'It still does')}</BigText><div style={{ display: 'inline-block', transform: 'rotate(-3deg)', background: 'var(--fie-accent, #a26833)', color: 'var(--fie-on-accent, #e3d3bc)', padding: '.2rem 1rem' }}><BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 9vw, 8rem)' }}>{text(c.accent, 'Body good')}</BigText></div></div>
        <p style={{ maxWidth: 320, textAlign: 'right' }}>{text(c.body)}</p>
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: '6%', transform: 'translateX(-50%)', width: 'min(960px, 94vw)', zIndex: 3, border: '0.45vw solid var(--fie-surface-edge, #e8ddca)', borderRadius: 999, background: 'var(--fie-surface, #fdebd2)', display: 'flex', justifyContent: 'space-around', padding: '1.25rem' }}>
        {stats.map((stat, i) => <div key={i} style={{ textAlign: 'center', flex: 1, borderRight: i === stats.length - 1 ? 0 : '1px solid var(--fie-mute, #c89c6e)' }}><p style={{ margin: 0 }}>{text(stat.label, text(stat.title))}</p><strong>{text(stat.value, text(stat.amount, '—'))}</strong></div>)}
      </div>
    </section>
  )
}

export function SpyltBenefit({ data }: { data: SectionData }) {
  const c = data.content
  const features = items(c.features, items(c.items)).slice(0, 4)
  return (
    <section style={{ minHeight: '140vh', background: 'var(--fie-bg-deep, #222123)', color: 'var(--fie-ink-on-deep, #faeade)', overflow: 'hidden', paddingTop: '5rem' }}>
      <p style={{ textAlign: 'center', lineHeight: 1.4 }}>{text(c.body, text(c.eyebrow, 'Unlock the advantages'))}</p>
      <div style={{ display: 'grid', placeItems: 'center', margin: '5rem 0' }}>
        {features.map((feature, i) => <div key={i} style={{ transform: `rotate(${[3, -1, 1, -5][i] ?? 0}deg) translateY(${i * -8}px)`, border: '3px solid var(--fie-bg-deep, #222123)', background: accentPalette[i % accentPalette.length], color: i === 1 ? 'var(--fie-ink, #222123)' : 'var(--fie-photo-text, #faeade)', padding: '.2rem 1rem' }}><BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 9vw, 8rem)' }}>{text(feature.title, `Benefit ${i + 1}`)}</BigText></div>)}
      </div>
      <div style={{ height: '100vh', position: 'relative' }}>
        <MediaBg image={data.images?.primary} filter="brightness(0.72)" />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: '10vw', height: '10vw', minWidth: 90, minHeight: 90, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(18px)' }}>▶</div></div>
      </div>
    </section>
  )
}

export function SpyltTestimonials({ data }: { data: SectionData }) {
  const testimonials = items(data.content.testimonials, items(data.content.cards)).slice(0, 7)
  return (
    <section style={{ position: 'relative', minHeight: '120vh', background: 'var(--fie-bg, #faeade)', color: 'var(--fie-ink, #222123)', overflow: 'hidden', paddingTop: '5rem' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BigText style={{ color: 'var(--fie-ink, #222123)', fontSize: '20vw' }}>What&apos;s</BigText>
        <BigText style={{ color: 'var(--fie-accent, #c88e64)', fontSize: '20vw' }}>Everyone</BigText>
        <BigText style={{ color: 'var(--fie-ink, #222123)', fontSize: '20vw' }}>Talking</BigText>
      </div>
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, paddingLeft: '12vw' }}>
        {testimonials.map((t, i) => <div key={i} style={{ width: 'min(280px, 70vw)', height: 420, flex: '0 0 auto', marginLeft: i ? -110 : 0, transform: `rotate(${[-10, 4, -4, 4, -10, 4, -3][i] ?? 0}deg) translateY(${i % 3 === 0 ? -30 : i % 2 ? 30 : 0}px)`, border: '0.45vw solid var(--fie-bg, #faeade)', borderRadius: 28, overflow: 'hidden', background: 'var(--fie-bg-deep, #111)' }}>{mediaNode(imgAt(data, i), text(t.author, text(t.title)), 'brightness(0.8)')}</div>)}
      </div>
    </section>
  )
}

export function SpyltBottomBanner({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <section style={{ minHeight: '100vh', background: 'var(--fie-bg-deep, #222123)', color: 'var(--fie-ink-on-deep, #f3e2d5)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '5rem clamp(1rem, 6vw, 5rem)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>{mediaNode(data.images?.primary, text(c.headline), 'brightness(0.65)')}</div>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
        <BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 9vw, 8rem)' }}>{text(c.headline, 'Right around')}</BigText>
        <div style={{ display: 'inline-block', transform: 'rotate(3deg)', background: 'var(--fie-accent, #fed775)', color: 'var(--fie-on-accent, #523122)', padding: '.3rem 1rem' }}><BigText style={{ color: 'currentColor', fontSize: 'clamp(3rem, 8vw, 7rem)' }}>{text(c.accent, text(c.subhead, 'The corner'))}</BigText></div>
        <p style={{ maxWidth: 420, lineHeight: 1.45 }}>{text(c.body)}</p>
        <RoundButton label={c.cta?.label ?? 'Find out'} href={c.cta?.href} />
      </div>
    </section>
  )
}

export function SpyltFooter({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <footer style={{ position: 'relative', overflow: 'hidden', background: 'var(--fie-bg-deep, #222123)', color: 'var(--fie-ink-on-deep, #faeade)', padding: '8rem clamp(1rem, 4vw, 3rem) 1rem', textAlign: 'center' }}>
      <div style={{ position: 'absolute', inset: '10% 0 20%', opacity: 0.7, mixBlendMode: 'lighten' }}>{mediaNode(data.images?.primary, text(c.headline), 'brightness(0.7)')}</div>
      <div style={{ position: 'relative', zIndex: 2 }}><BigText style={{ color: 'currentColor', fontSize: 'clamp(4rem, 13vw, 13rem)' }}>{text(c.headline, text(c.giant, 'responsibly'))}</BigText></div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: '6rem', opacity: 0.65 }}><span>{text(c.legal, `${new Date().getFullYear()} all rights reserved`)}</span><span>{text(c.tagline, text(c.body, 'Stay informed about updates and events.'))}</span></div>
    </footer>
  )
}

export function TruusVimeoHero({ data }: { data: SectionData }) {
  const c = data.content
  const video = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(true)
  return (
    <section onClick={() => { if (video.current) { video.current.muted = !muted; setMuted(!muted) } }} style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: '#111', color: '#fff', cursor: 'pointer' }}>
      <MediaBg image={data.images?.primary} eager filter="brightness(0.72)" />
      {data.images?.primary?.videoUrl && <video ref={video} src={data.images.primary.videoUrl} poster={data.images.primary.url} autoPlay loop muted={muted} playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.65))' }} />
      <div style={{ position: 'absolute', left: 'clamp(1rem,4vw,4rem)', right: 'clamp(1rem,4vw,4rem)', bottom: '6vh' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(4rem, 11vw, 11rem)', lineHeight: 0.84, letterSpacing: 0, maxWidth: 1200 }}>{text(c.headline, 'We make advertising for the new mainstream')}</h1>
      </div>
      <div style={{ position: 'absolute', left: 'clamp(1rem,4vw,4rem)', bottom: 24, display: 'flex', gap: 10 }}><button style={{ borderRadius: 999, border: 0, padding: '10px 14px' }}>{muted ? 'Sound' : 'Mute'}</button><button style={{ borderRadius: 999, border: 0, padding: '10px 14px' }}>Full</button></div>
    </section>
  )
}

export function TruusHorizontalWords({ data }: { data: SectionData }) {
  const root = useRef<HTMLElement | null>(null)
  const phrase = text(data.content.headline, text(data.content.phrase, 'We wanna be where the people are'))
  useGSAP(() => {
    const textEl = root.current?.querySelector('.truus-hwords')
    if (!textEl) return
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top bottom', end: '+=3200', scrub: 1 } })
    tl.fromTo(textEl, { x: window.innerWidth }, { x: () => -(textEl.scrollWidth - window.innerWidth * 0.5), ease: 'none' })
    ScrollTrigger.create({ trigger: root.current, start: 'top top', end: '+=2500', pin: true, pinSpacing: true })
    gsap.from('.truus-letter', { yPercent: () => (Math.random() - 0.5) * 500, rotate: () => (Math.random() - 0.5) * 60, ease: 'elastic.out(1.2,1)', scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom top', scrub: 0.5 } })
  }, { scope: root })
  return (
    <section ref={root} style={{ minHeight: '100vh', background: 'var(--fie-bg)', color: 'var(--fie-ink)', overflow: 'hidden', position: 'relative' }}>
      <div className="truus-hwords" style={{ whiteSpace: 'nowrap', paddingTop: '22vh' }}>
        <span style={{ fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(5rem, 18vw, 18rem)', lineHeight: 0.8 }}>
          {[...phrase].map((ch, i) => <span className="truus-letter" key={i} style={{ display: 'inline-block' }}>{ch === ' ' ? '\u00a0' : ch}</span>)}
        </span>
      </div>
      <p style={{ position: 'absolute', left: 'clamp(1rem,5vw,5rem)', bottom: '8vh', maxWidth: 560, lineHeight: 1.35 }}>{text(data.content.body)}</p>
    </section>
  )
}

export function TruusMotionCards({ data }: { data: SectionData }) {
  const c = data.content
  const root = useRef<HTMLElement | null>(null)
  const cards = items(c.cards, items(c.features)).slice(0, 4)
  useGSAP(() => {
    gsap.from('.truus-motion-card', { y: 80, opacity: 0, rotate: 10, stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 70%' } })
  }, { scope: root })
  return (
    <section ref={root} style={{ minHeight: '120vh', background: 'var(--fie-bg)', color: 'var(--fie-ink)', padding: '8rem clamp(1rem, 5vw, 5rem)', overflow: 'hidden' }}>
      <h2 style={{ margin: 0, maxWidth: 900, fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(4rem, 11vw, 10rem)', lineHeight: 0.9 }}>{text(c.headline, 'An agency built for the future.')}</h2>
      <p style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', margin: 0, fontStyle: 'italic' }}>{text(c.subhead, 'from TV to TikTok.')}</p>
      <div style={{ position: 'relative', minHeight: 720, marginTop: '4rem' }}>
        <div style={{ position: 'absolute', inset: '8% 10%', borderRadius: '45% 55% 55% 45%', background: 'var(--fie-accent)', opacity: 0.9 }} />
        {cards.map((card, i) => <TiltCard className="truus-motion-card" key={i} style={{ position: 'absolute', width: 'min(300px, 42vw)', height: 390, left: `${12 + i * 18}%`, top: `${10 + (i % 2) * 18}%`, transform: `rotate(${[-8, 5, -3, 8][i]}deg)`, overflow: 'hidden', borderRadius: 12, background: '#111' }}>{mediaNode(imgAt(data, i), text(card.title), 'brightness(0.9)')}</TiltCard>)}
      </div>
      <p style={{ maxWidth: 720, marginLeft: 'auto', fontSize: 'clamp(1.2rem, 2vw, 2rem)', lineHeight: 1.25 }}>{text(c.body)}</p>
    </section>
  )
}

export function TruusShowreel({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <section style={{ minHeight: '85vh', background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', display: 'grid', placeItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <MediaBg image={data.images?.primary} filter="brightness(0.5)" />
      <div style={{ position: 'relative', zIndex: 2 }}><BigText style={{ color: 'currentColor' }}>{text(c.headline, 'Showreel')}</BigText><p>{text(c.body, text(c.subhead))}</p></div>
    </section>
  )
}

export function TruusServiceCards({ data }: { data: SectionData }) {
  const c = data.content
  const cards = items(c.cards, items(c.features)).slice(0, 5)
  return (
    <section style={{ background: 'var(--fie-bg)', color: 'var(--fie-ink)', padding: '7rem clamp(1rem, 4vw, 3rem)' }}>
      <h2 style={{ margin: '0 0 4rem', fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(4rem, 10vw, 9rem)', lineHeight: 0.9 }}>{text(c.headline, 'Call us if you need:')}</h2>
      <div style={{ display: 'flex', minHeight: 520, alignItems: 'center', justifyContent: 'center' }}>
        {cards.map((card, i) => (
          <article key={i} style={{ width: 320, minHeight: 430, marginLeft: i ? -60 : 0, transform: `rotate(${[4, -5, 5, -8, 5][i] ?? 0}deg)`, background: accentPalette[i % accentPalette.length], color: i === 2 ? 'var(--fie-on-accent)' : 'var(--fie-ink)', borderRadius: 18, padding: 24, border: '2px solid var(--fie-ink)', position: 'relative' }}>
            <div style={{ position: 'absolute', right: 18, top: -28, width: 80, height: 80, borderRadius: '50%', background: 'var(--fie-surface)' }} />
            <h3 style={{ margin: '2rem 0', fontFamily: 'var(--fie-font-display)', fontSize: '4rem', lineHeight: 0.85, textTransform: 'uppercase' }}>{text(card.title, `Service ${i + 1}`)}</h3>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{strings(card.services, strings(card.items, [text(card.body, 'Creative direction')])).slice(0, 7).map((service, si) => <li key={si}>✦ {service}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export function TruusDoubleMarquee({ data }: { data: SectionData }) {
  const c = data.content
  const clients = items(c.clients, items(c.items)).slice(0, 10)
  const left = clients.slice(0, Math.ceil(clients.length / 2))
  const right = clients.slice(Math.ceil(clients.length / 2))
  return (
    <section style={{ minHeight: '95vh', background: 'var(--fie-surface)', color: 'var(--fie-ink)', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 32, padding: '6rem clamp(1rem, 5vw, 5rem)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--fie-font-display)', fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 0.9 }}>{text(c.headline, 'Proud to have worked with:')}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: '75vh', overflow: 'hidden' }}>
        {[left, right].map((track, i) => <div key={i} style={{ display: 'grid', gap: 16, animation: `fie-marquee-y ${i ? 22 : 18}s linear infinite ${i ? 'reverse' : ''}` }}>{[...track, ...track].map((client, ci) => <div key={ci} style={{ minHeight: 160, borderRadius: 12, background: accentPalette[ci % accentPalette.length], display: 'grid', placeItems: 'center', padding: 20 }}><strong style={{ fontSize: 'clamp(1.3rem, 3vw, 3rem)', textTransform: 'uppercase' }}>{text(client.name, text(client.label, `Client ${ci + 1}`))}</strong></div>)}</div>)}
      </div>
      <style>{`@keyframes fie-marquee-y{from{transform:translateY(0)}to{transform:translateY(-50%)}}`}</style>
    </section>
  )
}

export function TruusFooter({ data }: { data: SectionData }) {
  const c = data.content
  return (
    <footer style={{ background: 'var(--fie-bg-deep)', color: 'var(--fie-ink-on-deep)', minHeight: '90vh', padding: '6rem clamp(1rem, 5vw, 5rem) 2rem', position: 'relative', overflow: 'hidden' }}>
      <BigText style={{ color: 'currentColor', fontSize: 'clamp(5rem, 18vw, 17rem)' }}>{text(c.giant, text(c.brand, 'brand'))}</BigText>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: '4rem' }}>
        <div><p style={{ fontSize: 'clamp(1.5rem, 4vw, 4rem)', lineHeight: 1 }}>{text(c.tagline, text(c.body, 'Let us make something people actually remember.'))}</p><RoundButton label={c.cta?.label ?? 'Contact'} href={c.cta?.href} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>{items(c.columns).slice(0, 4).map((col, i) => <div key={i}><strong>{text(col.title, `Column ${i + 1}`)}</strong>{items(col.links).map((link, li) => <a key={li} href={text(link.href, '#')} style={{ display: 'block', color: 'inherit', marginTop: 10 }}>{text(link.label, `Link ${li + 1}`)}</a>)}</div>)}</div>
      </div>
      <p style={{ position: 'absolute', left: 'clamp(1rem, 5vw, 5rem)', bottom: 20, opacity: 0.6 }}>{text(c.legal, `${new Date().getFullYear()} ${text(c.brand, 'Brand')}`)}</p>
    </footer>
  )
}
