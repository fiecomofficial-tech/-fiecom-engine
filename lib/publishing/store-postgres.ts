import crypto from 'crypto'
import postgres from 'postgres'
import type { Domain, Project, ProjectWithDomains } from './types'
import { normalizeHostname } from './slug'

type Sql = ReturnType<typeof postgres>

interface ProjectRow {
  id: string
  user_id: string
  name: string
  slug: string
  generated_config: unknown
  status: Project['status']
  preview_url: string | null
  published_url: string | null
  created_at: Date | string
  updated_at: Date | string
}

interface DomainRow {
  id: string
  project_id: string
  hostname: string
  type: Domain['type']
  status: Domain['status']
  verification_token: string
  created_at: Date | string
  updated_at: Date | string
}

let sqlClient: Sql | null = null
let setupPromise: Promise<void> | null = null

function timestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function jsonValue(value: unknown): postgres.JSONValue {
  return value as postgres.JSONValue
}

function connectionString(): string {
  const value = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!value) {
    throw new Error(
      'Publishing store is configured for Postgres, but POSTGRES_URL or DATABASE_URL is missing.',
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

async function ensureSchema(): Promise<void> {
  if (!setupPromise) {
    const db = sql()
    setupPromise = (async () => {
      await db`
        CREATE TABLE IF NOT EXISTS fiecom_projects (
          id text PRIMARY KEY,
          user_id text NOT NULL,
          name text NOT NULL,
          slug text NOT NULL UNIQUE,
          generated_config jsonb NOT NULL,
          status text NOT NULL CHECK (status IN ('draft', 'published')),
          preview_url text,
          published_url text,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `
      await db`
        CREATE TABLE IF NOT EXISTS fiecom_domains (
          id text PRIMARY KEY,
          project_id text NOT NULL REFERENCES fiecom_projects(id) ON DELETE CASCADE,
          hostname text NOT NULL UNIQUE,
          type text NOT NULL CHECK (type IN ('subdomain', 'custom')),
          status text NOT NULL CHECK (status IN ('pending', 'active', 'failed')),
          verification_token text NOT NULL,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL
        )
      `
      await db`
        CREATE INDEX IF NOT EXISTS fiecom_projects_user_updated_idx
        ON fiecom_projects (user_id, updated_at DESC)
      `
      await db`
        CREATE INDEX IF NOT EXISTS fiecom_domains_project_idx
        ON fiecom_domains (project_id)
      `
      await db`
        CREATE INDEX IF NOT EXISTS fiecom_domains_hostname_idx
        ON fiecom_domains (hostname)
      `
    })()
  }
  await setupPromise
}

function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    generatedConfig: row.generated_config,
    status: row.status,
    previewUrl: row.preview_url,
    publishedUrl: row.published_url,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  }
}

function domainFromRow(row: DomainRow): Domain {
  return {
    id: row.id,
    projectId: row.project_id,
    hostname: row.hostname,
    type: row.type,
    status: row.status,
    verificationToken: row.verification_token,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  }
}

function withDomains(project: Project, domains: Domain[]): ProjectWithDomains {
  return {
    ...project,
    domains: domains.filter((domain) => domain.projectId === project.id),
  }
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  await ensureSchema()
  const db = sql()
  const rows = await db<{ slug: string }[]>`
    SELECT slug FROM fiecom_projects
    WHERE slug = ${baseSlug} OR slug LIKE ${`${baseSlug}-%`}
  `
  const taken = new Set(rows.map((row) => row.slug))
  let candidate = baseSlug
  let suffix = 2
  while (taken.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
  return candidate
}

export async function listProjectsForUser(userId: string): Promise<ProjectWithDomains[]> {
  await ensureSchema()
  const db = sql()
  const [projectRows, domainRows] = await Promise.all([
    db<ProjectRow[]>`
      SELECT * FROM fiecom_projects
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `,
    db<DomainRow[]>`SELECT * FROM fiecom_domains`,
  ])
  const domains = domainRows.map(domainFromRow)
  return projectRows.map(projectFromRow).map((project) => withDomains(project, domains))
}

export async function getProject(id: string): Promise<Project | null> {
  await ensureSchema()
  const rows = await sql()<ProjectRow[]>`
    SELECT * FROM fiecom_projects
    WHERE id = ${id}
    LIMIT 1
  `
  return rows[0] ? projectFromRow(rows[0]) : null
}

export async function getProjectWithDomains(id: string): Promise<ProjectWithDomains | null> {
  const [project, domains] = await Promise.all([getProject(id), getDomainsForProject(id)])
  return project ? { ...project, domains } : null
}

export async function createProjectRecord(input: {
  userId: string
  name: string
  slug: string
  generatedConfig: unknown
  previewUrl?: string | null
}): Promise<Project> {
  await ensureSchema()
  const db = sql()
  const id = crypto.randomUUID()
  const now = new Date()
  const slug = await uniqueSlug(input.slug)
  const rows = await db<ProjectRow[]>`
    INSERT INTO fiecom_projects (
      id,
      user_id,
      name,
      slug,
      generated_config,
      status,
      preview_url,
      published_url,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${input.userId},
      ${input.name},
      ${slug},
      ${db.json(jsonValue(input.generatedConfig))},
      ${'draft'},
      ${input.previewUrl ?? null},
      ${null},
      ${now},
      ${now}
    )
    RETURNING *
  `
  return projectFromRow(rows[0])
}

export async function updateProjectRecord(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<Project | null> {
  const current = await getProject(id)
  if (!current) return null

  const next: Project = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  const rows = await sql()<ProjectRow[]>`
    UPDATE fiecom_projects
    SET
      user_id = ${next.userId},
      name = ${next.name},
      slug = ${next.slug},
      generated_config = ${sql().json(jsonValue(next.generatedConfig))},
      status = ${next.status},
      preview_url = ${next.previewUrl},
      published_url = ${next.publishedUrl},
      updated_at = ${new Date(next.updatedAt)}
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? projectFromRow(rows[0]) : null
}

export async function getDomain(id: string): Promise<Domain | null> {
  await ensureSchema()
  const rows = await sql()<DomainRow[]>`
    SELECT * FROM fiecom_domains
    WHERE id = ${id}
    LIMIT 1
  `
  return rows[0] ? domainFromRow(rows[0]) : null
}

export async function findDomainByHostname(hostname: string): Promise<Domain | null> {
  await ensureSchema()
  const normalized = normalizeHostname(hostname)
  const rows = await sql()<DomainRow[]>`
    SELECT * FROM fiecom_domains
    WHERE hostname = ${normalized}
    LIMIT 1
  `
  return rows[0] ? domainFromRow(rows[0]) : null
}

export async function getDomainsForProject(projectId: string): Promise<Domain[]> {
  await ensureSchema()
  const rows = await sql()<DomainRow[]>`
    SELECT * FROM fiecom_domains
    WHERE project_id = ${projectId}
    ORDER BY created_at ASC
  `
  return rows.map(domainFromRow)
}

export async function upsertDomainRecord(input: {
  projectId: string
  hostname: string
  type: Domain['type']
  status: Domain['status']
  verificationToken: string
}): Promise<Domain> {
  await ensureSchema()
  const db = sql()
  const hostname = normalizeHostname(input.hostname)
  const timestampNow = new Date()
  const rows = await db<DomainRow[]>`
    INSERT INTO fiecom_domains (
      id,
      project_id,
      hostname,
      type,
      status,
      verification_token,
      created_at,
      updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.projectId},
      ${hostname},
      ${input.type},
      ${input.status},
      ${input.verificationToken},
      ${timestampNow},
      ${timestampNow}
    )
    ON CONFLICT (hostname)
    DO UPDATE SET
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      verification_token = EXCLUDED.verification_token,
      updated_at = EXCLUDED.updated_at
    WHERE fiecom_domains.project_id = EXCLUDED.project_id
    RETURNING *
  `
  if (!rows[0]) {
    throw new Error(`${hostname} is already connected to another project`)
  }
  return domainFromRow(rows[0])
}

export async function updateDomainRecord(
  id: string,
  patch: Partial<Omit<Domain, 'id' | 'createdAt'>>,
): Promise<Domain | null> {
  const current = await getDomain(id)
  if (!current) return null

  const next: Domain = {
    ...current,
    ...patch,
    hostname: patch.hostname ? normalizeHostname(patch.hostname) : current.hostname,
    updatedAt: new Date().toISOString(),
  }
  const rows = await sql()<DomainRow[]>`
    UPDATE fiecom_domains
    SET
      project_id = ${next.projectId},
      hostname = ${next.hostname},
      type = ${next.type},
      status = ${next.status},
      verification_token = ${next.verificationToken},
      updated_at = ${new Date(next.updatedAt)}
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? domainFromRow(rows[0]) : null
}
