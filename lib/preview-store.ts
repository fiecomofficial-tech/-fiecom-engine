import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import postgres from 'postgres'

/**
 * File-based store for generated preview JSON. The `generated/` directory
 * lives at the repository root and is treated like a key-value store keyed
 * by UUID. Suitable for development and small deployments; swap for a real
 * KV store later if needed.
 */

const STORE_DIR = path.join(process.cwd(), 'generated')

type Sql = ReturnType<typeof postgres>

interface PreviewRow {
  id: string
  generated_config: unknown
}

let sqlClient: Sql | null = null
let setupPromise: Promise<void> | null = null

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

function usePostgresStore(): boolean {
  return process.env.PUBLISHING_STORE === 'postgres' || isProductionRuntime()
}

function connectionString(): string {
  const value = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!value) {
    throw new Error(
      'Preview store is configured for Postgres, but POSTGRES_URL or DATABASE_URL is missing.',
    )
  }
  return value
}

function sql(): Sql {
  if (!sqlClient) {
    sqlClient = postgres(connectionString(), {
      max: 1,
      prepare: false,
      ssl: process.env.PUBLISHING_POSTGRES_SSL === 'disable' ? false : 'require',
    })
  }
  return sqlClient
}

async function ensurePreviewSchema(): Promise<void> {
  if (!setupPromise) {
    const db = sql()
    setupPromise = db`
      CREATE TABLE IF NOT EXISTS fiecom_previews (
        id text PRIMARY KEY,
        generated_config jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )
    `.then(() => undefined)
  }
  await setupPromise
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

function isValidId(id: string): boolean {
  // UUID v4 OR alphanumeric id like "test" — keep it strict-ish to prevent
  // path traversal via "../../etc/passwd"
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id)
}

export async function savePreview(data: unknown): Promise<string> {
  if (usePostgresStore()) {
    await ensurePreviewSchema()
    const id = crypto.randomUUID()
    const now = new Date()
    await sql()`
      INSERT INTO fiecom_previews (
        id,
        generated_config,
        created_at,
        updated_at
      )
      VALUES (
        ${id},
        ${sql().json(data as postgres.JSONValue)},
        ${now},
        ${now}
      )
    `
    return id
  }

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

  if (usePostgresStore()) {
    await ensurePreviewSchema()
    const rows = await sql()<PreviewRow[]>`
      SELECT id, generated_config FROM fiecom_previews
      WHERE id = ${id}
      LIMIT 1
    `
    return rows[0]?.generated_config ?? null
  }

  const file = path.join(STORE_DIR, `${id}.json`)
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
