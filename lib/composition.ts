/**
 * Industry classification utility.
 *
 * Historically this file held a large bank of "homepage variants" per
 * industry — the AI just picked one. That architecture made every
 * generated site feel like a variant of the same template. The variant
 * banks have been removed in favour of the Stage 1 AI planner in
 * `site-plan.ts`, which decides intent + pages + pacing per brand.
 *
 * What remains: a keyword classifier used only by the fallback site
 * plan when the AI planner is unavailable or fails.
 */

export type IndustryKey =
  | 'saas'
  | 'fintech'
  | 'hospitality'
  | 'food'
  | 'creative'
  | 'commerce'
  | 'health'
  | 'education'
  | 'app'
  | 'default'

export function classifyIndustry(prompt: string): IndustryKey {
  const p = prompt.toLowerCase()
  const has = (...terms: string[]) => terms.some((t) => p.includes(t))
  if (has('saas', 'b2b', 'software', 'platform', 'api', 'crm', 'devtool', 'cloud')) return 'saas'
  if (has('fintech', 'bank', 'finance', 'wealth', 'insurance', 'payment', 'crypto')) return 'fintech'
  if (has('hotel', 'resort', 'villa', 'spa', 'wellness retreat', 'travel', 'restaurant')) return has('restaurant') ? 'food' : 'hospitality'
  if (has('food', 'cafe', 'coffee', 'bakery', 'bar', 'chef', 'menu')) return 'food'
  if (has('studio', 'agency', 'portfolio', 'fashion', 'gallery', 'artist', 'architect', 'film', 'design')) return 'creative'
  if (has('ecommerce', 'e-commerce', 'shop', 'retail', 'product', 'skincare', 'apparel')) return 'commerce'
  if (has('health', 'clinic', 'doctor', 'therapy', 'fitness', 'medical', 'care')) return 'health'
  if (has('school', 'course', 'learning', 'education', 'academy', 'bootcamp')) return 'education'
  if (has('app', 'dashboard', 'tool', 'portal', 'workspace', 'admin')) return 'app'
  return 'default'
}
