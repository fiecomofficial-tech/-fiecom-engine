/**
 * Tolerant JSON parsing for model output. Models occasionally:
 *   1. Wrap JSON in ```json fences
 *   2. Hit max_tokens mid-string and return truncated output
 *   3. Truncate inside an array element, leaving incomplete sections
 *
 * Strategy:
 *   - Strip code fences and any leading prose.
 *   - Try a direct JSON.parse.
 *   - On failure, walk the string tracking string-state + bracket stack,
 *     remember every "safe to truncate here" position (right after a
 *     complete value with the stack non-empty), then try each cut point
 *     latest → earliest until one parses, closing any open brackets.
 *
 * This salvages partial responses — typically the last element of the
 * deepest array is incomplete; truncating before it produces a valid
 * (smaller) result.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface ParseResult<T> {
  ok: boolean
  value?: T
  /** True when the response was repaired (truncated to a valid prefix) */
  repaired?: boolean
  error?: string
  rawLength?: number
}

export function safeParseJSON<T = unknown>(raw: string): ParseResult<T> {
  const cleaned = extractJSON(raw)

  try {
    return { ok: true, value: JSON.parse(cleaned) as T, repaired: false, rawLength: raw.length }
  } catch {
    // fall through
  }

  // Walk the cleaned string, gather safe truncation snapshots.
  const points = findSafeTruncationPoints(cleaned)

  for (let i = points.length - 1; i >= 0; i--) {
    const { index, stack } = points[i]
    const truncated = stripTrailingNoise(cleaned.slice(0, index))
    const closed = truncated + closeStack(stack)
    try {
      const value = JSON.parse(closed) as T
      return { ok: true, value, repaired: true, rawLength: raw.length }
    } catch {
      // try next point
    }
  }

  return {
    ok: false,
    error: 'unable to repair JSON',
    rawLength: raw.length,
  }
}

/** Persist a model-output failure to /tmp for postmortem. Returns the path. */
export function dumpFailure(tag: string, raw: string): string {
  const dir = '/tmp'
  const id = crypto.randomBytes(4).toString('hex')
  const file = path.join(dir, `fiecom-${tag}-${id}.txt`)
  try {
    fs.writeFileSync(file, raw, 'utf-8')
  } catch {
    // ignore
  }
  return file
}

/* ------------------------------------------------------------------ */
/* internals                                                           */
/* ------------------------------------------------------------------ */

function extractJSON(s: string): string {
  let out = s.trim()
  // Strip ``` or ```json fences if present.
  out = out.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/```\s*$/, '').trim()
  // If the model prefixed prose, slice from the first { or [.
  const start = out.search(/[{[]/)
  if (start > 0) out = out.slice(start)
  return out
}

interface SafePoint {
  index: number
  stack: string[]
}

function findSafeTruncationPoints(s: string): SafePoint[] {
  const points: SafePoint[] = []
  const stack: string[] = []
  let inString = false
  let escape = false
  let valueComplete = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escape) {
      escape = false
      continue
    }
    if (inString) {
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = false
        valueComplete = true
      }
      continue
    }
    if (ch === '"') {
      inString = true
      valueComplete = false
      continue
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch)
      valueComplete = false
      continue
    }
    if (ch === '}' || ch === ']') {
      stack.pop()
      valueComplete = true
      if (stack.length > 0) {
        // We can safely truncate immediately after this close + the
        // remaining stack will be closed by closeStack.
        points.push({ index: i + 1, stack: stack.slice() })
      }
      continue
    }
    if (ch === ',' && valueComplete && stack.length > 0) {
      // Truncate before the comma → "drop the next (possibly incomplete) entry".
      points.push({ index: i, stack: stack.slice() })
      valueComplete = false
      continue
    }
    if (ch === ':' || /\s/.test(ch)) continue
    // Other tokens (number / true / false / null) — primitives;
    // valueComplete is set when we see a comma or close bracket.
  }
  return points
}

function stripTrailingNoise(s: string): string {
  return s.replace(/,\s*$/, '').replace(/\s+$/, '')
}

function closeStack(stack: string[]): string {
  let out = ''
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === '{' ? '}' : ']'
  }
  return out
}
