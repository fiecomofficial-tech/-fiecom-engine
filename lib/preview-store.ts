import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * File-based store for generated preview JSON. The `generated/` directory
 * lives at the repository root and is treated like a key-value store keyed
 * by UUID. Suitable for development and small deployments; swap for a real
 * KV store later if needed.
 */

const STORE_DIR = path.join(process.cwd(), 'generated')

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

function isValidId(id: string): boolean {
  // UUID v4 OR alphanumeric id like "test" — keep it strict-ish to prevent
  // path traversal via "../../etc/passwd"
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id)
}

export async function savePreview(data: unknown): Promise<string> {
  await ensureDir()
  const id = crypto.randomUUID()
  const file = path.join(STORE_DIR, `${id}.json`)
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
  return id
}

/**
 * Read a preview by id. Returns null if the file does not exist or the id
 * fails validation. Does not throw — callers should treat null as 404.
 */
export async function loadPreview(id: string): Promise<unknown | null> {
  if (!isValidId(id)) return null
  const file = path.join(STORE_DIR, `${id}.json`)
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
