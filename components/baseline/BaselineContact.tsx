'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import type { ContactData } from './types'

const ease = [0.2, 0, 0, 1] as const

const ICONS = { mail: Mail, phone: Phone, map: MapPin } as const

function isPrefixDuplicate(eyebrow: string, headline: string): boolean {
  const e = eyebrow.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, '')
  const h = headline.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, '')
  if (!e || !h) return false
  if (h === e) return true
  return h.startsWith(`${e} `)
}

/**
 * Mirrors `src/pages/Contact.jsx` in the Fiecom template repo verbatim
 * (modulo Next.js / TypeScript syntax + dynamic data). This is the ONLY
 * section the Contact page renders between Navbar and Footer — it owns
 * its own eyebrow + h1, so the composer must NOT prepend a separate
 * BaselinePageHeader.
 */
export default function BaselineContact({ data }: { data: ContactData }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [sent, setSent] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const recipient = data?.recipientEmail || 'hello@example.com'
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    const subject = encodeURIComponent(`New inquiry from ${form.name || 'website'}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\n${form.message}`,
    )
    setTimeout(() => {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`
    }, 1100)
  }

  const rawHeadline = (data?.header?.headline ?? '').trim()
  const headerHeadline = rawHeadline || "Let's build something together."
  const rawEyebrow = (data?.header?.eyebrow ?? '').trim()
  // Drop eyebrow when empty OR a prefix-duplicate of the headline
  // ("CONTACT" + "Contact us" → drop "CONTACT").
  const headerEyebrow = !rawEyebrow || isPrefixDuplicate(rawEyebrow, headerHeadline)
    ? null
    : rawEyebrow
  const formTitle = data?.formTitle ?? 'Get in touch'
  const formBody =
    data?.formBody ?? 'Send us a message and we will get back within one business day.'
  const details = Array.isArray(data?.details) ? data.details : []

  return (
    <div className="px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-16 lg:mb-20"
        >
          <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground mb-4">
            {headerEyebrow}
          </p>
          <h1 className="text-[40px] lg:text-[48px] leading-[1.1] tracking-tightest font-medium max-w-2xl text-foreground">
            {headerHeadline}
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="space-y-10"
          >
            <div>
              <h2 className="text-[20px] font-medium tracking-tight mb-3 text-foreground">{formTitle}</h2>
              <p className="text-[15px] text-muted-foreground leading-[1.6] max-w-sm">{formBody}</p>
            </div>

            <div className="space-y-6">
              {details.map((d, i) => {
                const Icon = d?.icon ? ICONS[d.icon] : null
                const inner = (
                  <>
                    {Icon && <Icon className="w-4 h-4 mt-1 text-muted-foreground" />}
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-1">
                        {d?.label}
                      </div>
                      <div className="text-[15px] text-foreground leading-[1.5]">{d?.value}</div>
                    </div>
                  </>
                )
                return d?.href ? (
                  <a key={i} href={d.href} className="flex items-start gap-4 group">
                    {inner}
                  </a>
                ) : (
                  <div key={i} className="flex items-start gap-4">
                    {inner}
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {[
                { k: 'name' as const, label: 'Your name', type: 'text', required: true },
                { k: 'email' as const, label: 'Email address', type: 'email', required: true },
                { k: 'company' as const, label: 'Company', type: 'text', required: false },
              ].map((field) => (
                <div key={field.k} className="group">
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">
                    {field.label}
                    {field.required && ' *'}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={form[field.k]}
                    onChange={update(field.k)}
                    className="w-full bg-transparent border-0 border-b border-border focus:border-foreground focus:border-b-2 outline-none py-2 text-[16px] text-foreground transition-all duration-300 ease-weightless"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={update('message')}
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground focus:border-b-2 outline-none py-2 text-[16px] text-foreground resize-none transition-all duration-300 ease-weightless"
                />
              </div>

              <div className="pt-4">
                <AnimatePresence mode="wait">
                  {!sent ? (
                    <motion.button
                      key="submit"
                      type="submit"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease }}
                      className="group inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full text-[15px] font-medium hover:opacity-90 transition-opacity ease-weightless"
                    >
                      Send message
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-500 ease-weightless group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease }}
                      className="inline-flex items-center gap-2 bg-secondary text-foreground px-5 py-3 rounded-full text-[15px] font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Message sent — opening mail…
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
