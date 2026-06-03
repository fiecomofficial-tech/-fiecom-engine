/**
 * Template registry + archetype → template picker + image-slot map.
 *
 * Templates own the entire homepage. The V2 pipeline runs:
 *
 *   brief → designSystem → blueprint → PICK TEMPLATE → buildTemplateData
 *   → enumerate image queries → orchestrateAssets → injectImages →
 *   render via TEMPLATE_REGISTRY[id]
 *
 * Section-list assembly is now only used for INTERNAL pages (about,
 * contact, pricing, etc.) — the homepage is template-driven.
 */

import SaasBuilderTemplate from '@/components/templates/SaasBuilderTemplate'
import FashionEditorialTemplate from '@/components/templates/FashionEditorialTemplate'
import HospitalityCinematicTemplate from '@/components/templates/HospitalityCinematicTemplate'
import RestaurantWarmTemplate from '@/components/templates/RestaurantWarmTemplate'
import CreativeStudioTemplate from '@/components/templates/CreativeStudioTemplate'
import type { ComponentType } from 'react'
import type { TemplateData } from '@/components/templates/types'
import type { Brief } from './types'

export const TEMPLATE_REGISTRY: Record<string, ComponentType<{ data: TemplateData }>> = {
  SaasBuilderTemplate,
  FashionEditorialTemplate,
  HospitalityCinematicTemplate,
  RestaurantWarmTemplate,
  CreativeStudioTemplate,
}

export type TemplateId = keyof typeof TEMPLATE_REGISTRY

/** Choose a template per archetype. Five full-page archetypes are
 *  implemented end-to-end; remaining archetypes fall through to the
 *  closest match. */
export function pickTemplate(brief: Brief): TemplateId {
  switch (brief.archetype) {
    case 'saas':
    case 'ai-startup':
    case 'product-launch':
    case 'fintech':
    case 'b2b':
    case 'health':
    case 'education':
    case 'event':
      return 'SaasBuilderTemplate'
    case 'fashion':
    case 'ecommerce':
      return 'FashionEditorialTemplate'
    case 'creative-studio':
    case 'portfolio':
    case 'architecture':
      return 'CreativeStudioTemplate'
    case 'hospitality':
    case 'wellness':
      return 'HospitalityCinematicTemplate'
    case 'restaurant':
      return 'RestaurantWarmTemplate'
    default:
      return 'SaasBuilderTemplate'
  }
}

/**
 * Enumerate every image slot the template needs as Pexels queries.
 * Returned as a flat list of { path, query } so we can update the
 * templateData by path after orchestrate-assets resolves URLs.
 */
export interface ImageSlot {
  path: string // e.g. "hero.image", "features[0].image", "gallery[3]"
  query: string
  orientation: 'landscape' | 'portrait' | 'squarish'
}

export function collectImageSlots(templateId: TemplateId, data: TemplateData, vocab: string): ImageSlot[] {
  const slots: ImageSlot[] = []

  // Hero is always present.
  if (data.hero) {
    const heroOrientation: ImageSlot['orientation'] =
      templateId === 'SaasBuilderTemplate' ? 'landscape'
      : templateId === 'RestaurantWarmTemplate' ? 'portrait'
      : templateId === 'CreativeStudioTemplate' ? 'landscape'
      : 'landscape'
    slots.push({ path: 'hero.image', query: `${vocab} hero`, orientation: heroOrientation })
  }

  // Per-template keyword vocab so the dishes / projects / rooms come
  // back with the right visual register.
  const featureKeywords: Record<TemplateId, string[]> = {
    SaasBuilderTemplate:        ['detail', 'workflow', 'interface', 'product'],
    FashionEditorialTemplate:   ['atelier', 'fabric', 'editorial', 'detail'],
    HospitalityCinematicTemplate: ['interior', 'suite', 'garden', 'view'],
    RestaurantWarmTemplate:     ['dish plated', 'chef hands', 'wood-fired', 'kitchen interior'],
    CreativeStudioTemplate:     ['project still', 'brand system detail', 'art direction', 'editorial print'],
  }
  const kws = featureKeywords[templateId]
  for (let i = 0; i < data.features.length; i++) {
    const orientation: ImageSlot['orientation'] =
      templateId === 'RestaurantWarmTemplate' ? 'portrait'
      : templateId === 'CreativeStudioTemplate' ? (i % 2 === 0 ? 'landscape' : 'portrait')
      : (i % 2 === 0 ? 'portrait' : 'landscape')
    slots.push({ path: `features[${i}].image`, query: `${vocab} ${kws[i % kws.length]}`, orientation })
  }

  for (let i = 0; i < (data.gallery?.length ?? 0); i++) {
    slots.push({ path: `gallery[${i}]`, query: `${vocab} ${['look','editorial','closeup','ambient','studio','set','field','still'][i % 8]}`, orientation: 'portrait' })
  }

  if (data.story) {
    const orientation: ImageSlot['orientation'] =
      templateId === 'RestaurantWarmTemplate' ? 'portrait'
      : 'landscape'
    slots.push({ path: 'story.image', query: `${vocab} narrative`, orientation })
  }
  return slots
}
