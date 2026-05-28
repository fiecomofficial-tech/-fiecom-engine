'use client'

import React, { useState } from 'react'
import type { SectionData } from '../sections/types'

interface Field {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'select' | 'textarea'
  options?: string[]
  required?: boolean
  placeholder?: string
}

/**
 * Functional contact form block. Pure UI — no backend wired. Submits
 * via mailto: as a graceful default so the form actually works without
 * extra infrastructure.
 */
export default function ContactForm({ data }: { data: SectionData }) {
  const c = data.content
  const fields = ((c.fields as Field[] | undefined) ?? defaultFields()).slice(0, 8)
  const submitLabel = (c.submitLabel as string) ?? 'Send message'
  const recipientEmail = (c.recipientEmail as string) ?? 'hello@studio.co'
  const subjectTemplate = (c.subjectTemplate as string) ?? 'New project inquiry'
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const lines: string[] = []
    fields.forEach((f) => {
      const v = String(fd.get(f.name) ?? '')
      if (v) lines.push(`${f.label}:\n${v}`)
    })
    const body = encodeURIComponent(lines.join('\n\n'))
    const subject = encodeURIComponent(subjectTemplate)
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--fie-bg)',
        color: 'var(--fie-ink)',
        paddingBlock: 'clamp(80px, 10vw, 140px)',
        paddingInline: 'clamp(24px, 5vw, 72px)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 'clamp(40px, 6vw, 96px)',
          alignItems: 'flex-start',
        }}
        className="fie-form-layout"
      >
        <div>
          {c.eyebrow && (
            <p
              style={{
                fontSize: '0.78rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--fie-ink-2, currentColor)',
                marginBottom: 18,
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
                fontSize: 'clamp(2.2rem, 5vw, 4.4rem)',
                lineHeight: 0.98,
                letterSpacing: '-0.025em',
                maxWidth: '14ch',
              }}
            >
              {c.headline}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                marginTop: 24,
                color: 'var(--fie-ink-2, currentColor)',
                lineHeight: 1.6,
                fontSize: '1rem',
                maxWidth: '38ch',
              }}
            >
              {c.body}
            </p>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            display: 'grid',
            gap: 'clamp(20px, 2vw, 28px)',
            background: 'var(--fie-surface, transparent)',
            padding: 'clamp(28px, 3vw, 40px)',
            borderRadius: 22,
            border: '1px solid var(--fie-surface-edge, var(--fie-mute))',
          }}
        >
          {fields.map((f) => (
            <FieldRow key={f.name} field={f} />
          ))}
          <button
            type="submit"
            style={{
              marginTop: 12,
              padding: '16px 28px',
              borderRadius: 999,
              background: 'var(--fie-accent)',
              color: 'var(--fie-on-accent)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.96rem',
              fontWeight: 500,
              letterSpacing: '0.01em',
              fontFamily: 'inherit',
            }}
          >
            {sent ? 'Opening your mail client…' : submitLabel}
          </button>
          {sent && (
            <p style={{ margin: 0, opacity: 0.7, fontSize: '0.88rem' }}>
              If nothing opened, write to{' '}
              <a href={`mailto:${recipientEmail}`} style={{ color: 'inherit' }}>
                {recipientEmail}
              </a>
              .
            </p>
          )}
        </form>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .fie-form-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function FieldRow({ field }: { field: Field }) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    color: 'var(--fie-ink)',
    border: 'none',
    borderBottom: '1px solid var(--fie-mute)',
    padding: '12px 0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: 'var(--fie-ink-2, currentColor)',
    marginBottom: 8,
    display: 'block',
  }
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea
          name={field.name}
          required={field.required}
          rows={4}
          placeholder={field.placeholder}
          style={{ ...inputStyle, resize: 'vertical', borderBottom: '1px solid var(--fie-mute)' }}
        />
      ) : field.type === 'select' ? (
        <select
          name={field.name}
          required={field.required}
          defaultValue=""
          style={inputStyle}
        >
          <option value="" disabled>
            Select…
          </option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={field.name}
          type={field.type ?? 'text'}
          required={field.required}
          placeholder={field.placeholder}
          style={inputStyle}
        />
      )}
    </label>
  )
}

function defaultFields(): Field[] {
  return [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'budget',
      label: 'Budget',
      type: 'select',
      options: ['< €25k', '€25k – €75k', '€75k – €150k', '€150k+'],
    },
    {
      name: 'message',
      label: 'Project',
      type: 'textarea',
      required: true,
      placeholder: 'Tell us about the brand and the timing.',
    },
  ]
}
