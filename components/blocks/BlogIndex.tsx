'use client'

import React from 'react'
import type { SectionData, SectionImage } from '../sections/types'
import { usePreviewHrefResolver } from '../usePreviewHref'

interface Post {
  title: string
  excerpt?: string
  date: string
  category?: string
  author?: string
  href?: string
  readingMinutes?: number
}

/**
 * Editorial post index — featured top item + grid of cards beneath.
 * Pairs with PageHeader on a /journal or /blog sub-page.
 */
export default function BlogIndex({ data }: { data: SectionData }) {
  const c = data.content
  const posts = ((c.posts as Post[] | undefined) ?? []).slice(0, 12)
  const gallery: SectionImage[] = data.images?.gallery ?? []
  const previewHref = usePreviewHrefResolver()
  if (!posts.length) return null
  const [featured, ...rest] = posts
  const featuredImg = gallery[0]

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(72px, 9vw, 120px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {(c.eyebrow || c.headline) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 24,
              marginBottom: 'clamp(40px, 5vw, 64px)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              {c.eyebrow && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: 'var(--fie-ink-2, currentColor)',
                    marginBottom: 12,
                  }}
                >
                  {c.eyebrow}
                </p>
              )}
              {c.headline && (
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--fie-font-display, serif)',
                    fontSize: 'clamp(2rem, 4.4vw, 3.6rem)',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.02,
                    maxWidth: '20ch',
                  }}
                >
                  {c.headline}
                </h2>
              )}
            </div>
            {c.body && (
              <p
                style={{
                  maxWidth: '40ch',
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.55,
                  fontSize: '1rem',
                  margin: 0,
                }}
              >
                {c.body}
              </p>
            )}
          </div>
        )}

        <a
          href={previewHref(featured.href, '#')}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 'clamp(28px, 4vw, 56px)',
            paddingBlock: 'clamp(24px, 3vw, 40px)',
            borderTop: '1px solid var(--fie-mute)',
            borderBottom: '1px solid var(--fie-mute)',
            color: 'currentColor',
            textDecoration: 'none',
            alignItems: 'center',
          }}
          className="fie-blog-featured"
        >
          {featuredImg && (
            <div
              style={{
                aspectRatio: '5 / 3',
                borderRadius: 18,
                overflow: 'hidden',
                background: '#111',
              }}
            >
              <img
                src={featuredImg.url}
                alt={featuredImg.alt ?? featured.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                marginBottom: 12,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {featured.category && <span>{featured.category}</span>}
              {featured.date && <span>·</span>}
              {featured.date && <span>{featured.date}</span>}
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--fie-font-display, serif)',
                fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
              }}
            >
              {featured.title}
            </h3>
            {featured.excerpt && (
              <p
                style={{
                  marginTop: 14,
                  color: 'var(--fie-ink-2, currentColor)',
                  lineHeight: 1.6,
                  fontSize: '1rem',
                  maxWidth: '54ch',
                }}
              >
                {featured.excerpt}
              </p>
            )}
            {(featured.author || featured.readingMinutes) && (
              <div
                style={{
                  marginTop: 18,
                  fontSize: '0.86rem',
                  color: 'var(--fie-ink-2, currentColor)',
                  display: 'flex',
                  gap: 10,
                }}
              >
                {featured.author && <span>{featured.author}</span>}
                {featured.author && featured.readingMinutes && <span>·</span>}
                {featured.readingMinutes && <span>{featured.readingMinutes} min read</span>}
              </div>
            )}
          </div>
        </a>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 'clamp(24px, 3vw, 40px) 0 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(20px, 2vw, 32px)',
          }}
        >
          {rest.map((p, i) => {
            const img = gallery[(i + 1) % Math.max(1, gallery.length)]
            return (
              <li key={i}>
                <a
                  href={previewHref(p.href, '#')}
                  style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
                >
                  {img && (
                    <div
                      style={{
                        aspectRatio: '4 / 3',
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: '#111',
                        marginBottom: 14,
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? p.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.74rem',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      color: 'var(--fie-ink-2, currentColor)',
                      marginBottom: 8,
                    }}
                  >
                    {p.category ?? ''}{p.category && p.date ? ' · ' : ''}{p.date}
                  </div>
                  <h4
                    style={{
                      margin: 0,
                      fontFamily: 'var(--fie-font-display, serif)',
                      fontSize: 'clamp(1.1rem, 1.4vw, 1.4rem)',
                      lineHeight: 1.18,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {p.title}
                  </h4>
                  {p.excerpt && (
                    <p
                      style={{
                        marginTop: 10,
                        color: 'var(--fie-ink-2, currentColor)',
                        lineHeight: 1.55,
                        fontSize: '0.95rem',
                      }}
                    >
                      {p.excerpt}
                    </p>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .fie-blog-featured { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
