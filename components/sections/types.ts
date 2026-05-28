export interface SectionImage {
  url: string
  alt?: string
  attributionAuthor?: string
  attributionUrl?: string
  /** Optional MP4 URL — when present, the section may render video with `url` as poster fallback */
  videoUrl?: string
}

export interface SectionImages {
  primary?: SectionImage
  secondary?: SectionImage
  gallery?: SectionImage[]
}

export interface BaseContent {
  eyebrow?: string
  headline?: string
  subhead?: string
  body?: string
  cta?: { label: string; href?: string }
}

export interface SectionData {
  content: BaseContent & Record<string, unknown>
  images?: SectionImages
}
