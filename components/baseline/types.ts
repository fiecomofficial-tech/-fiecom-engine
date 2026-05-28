import type { SectionImage } from '../sections/types'

export interface NavLink { label: string; href: string }

export interface NavData {
  brand: string
  links: NavLink[]
  cta?: { label: string; href: string }
}

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export interface FooterData {
  brand: string
  tagline?: string
  columns: FooterColumn[]
  legal?: string
  meta?: NavLink[]
}

export interface HeroData {
  eyebrow?: string
  headline: string
  accent?: string
  body?: string
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  image?: SectionImage
  imageLabel?: { left?: string; right?: string }
}

export interface LogoBarData {
  eyebrow?: string
  clients: { name: string }[]
}

export interface FeatureItem {
  eyebrow?: string
  title: string
  body: string
  image?: SectionImage
}

export interface FeaturesData {
  eyebrow?: string
  headline: string
  accent?: string
  items: FeatureItem[]
}

export interface Testimonial {
  quote: string
  name: string
  role?: string
}

export interface TestimonialsData {
  eyebrow?: string
  headline: string
  items: Testimonial[]
}

export interface CTAData {
  eyebrow?: string
  headline: string
  accent?: string
  body?: string
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
}

export interface PageHeaderData {
  eyebrow?: string
  headline: string
  accent?: string
  body?: string
}

export interface AboutPillar {
  title: string
  body: string
}

export interface AboutStat {
  value: string
  label: string
}

export interface AboutData {
  header: PageHeaderData
  intro: string
  image?: SectionImage
  pillarEyebrow?: string
  pillarHeadline?: string
  pillars: AboutPillar[]
  statsEyebrow?: string
  stats: AboutStat[]
}

export interface ContactDetail {
  icon?: 'mail' | 'phone' | 'map'
  label: string
  value: string
  href?: string
}

export interface ContactData {
  header: PageHeaderData
  formTitle?: string
  formBody?: string
  details: ContactDetail[]
  recipientEmail: string
}
