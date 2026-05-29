import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { Domain, Project, ProjectWithDomains } from './types'
import { normalizeHostname } from './slug'

interface PublishingDatabase {
  projects: Project[]
  domains: Domain[]
}

const STORE_DIR = path.join(process.cwd(), 'data')
const STORE_FILE = path.join(STORE_DIR, 'publishing.json')

async function ensureStore(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

async function readDb(): Promise<PublishingDatabase> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<PublishingDatabase>
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
    }
  } catch {
    return { projects: [], domains: [] }
  }
}

async function writeDb(db: PublishingDatabase): Promise<void> {
  await ensureStore()
  await fs.writeFile(STORE_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

function now(): string {
  return new Date().toISOString()
}

function withDomains(project: Project, domains: Domain[]): ProjectWithDomains {
  return {
    ...project,
    domains: domains.filter((domain) => domain.projectId === project.id),
  }
}

function uniqueSlug(baseSlug: string, projects: Project[]): string {
  const taken = new Set(projects.map((project) => project.slug))
  let candidate = baseSlug
  let suffix = 2
  while (taken.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
  return candidate
}

export async function listProjectsForUser(userId: string): Promise<ProjectWithDomains[]> {
  const db = await readDb()
  return db.projects
    .filter((project) => project.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((project) => withDomains(project, db.domains))
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await readDb()
  return db.projects.find((project) => project.id === id) ?? null
}

export async function getProjectWithDomains(id: string): Promise<ProjectWithDomains | null> {
  const db = await readDb()
  const project = db.projects.find((item) => item.id === id)
  return project ? withDomains(project, db.domains) : null
}

export async function createProjectRecord(input: {
  userId: string
  name: string
  slug: string
  generatedConfig: unknown
  previewUrl?: string | null
}): Promise<Project> {
  const db = await readDb()
  const timestamp = now()
  const slug = uniqueSlug(input.slug, db.projects)
  const project: Project = {
    id: crypto.randomUUID(),
    userId: input.userId,
    name: input.name,
    slug,
    generatedConfig: input.generatedConfig,
    status: 'draft',
    previewUrl: input.previewUrl ?? null,
    publishedUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.projects.push(project)
  await writeDb(db)
  return project
}

export async function updateProjectRecord(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<Project | null> {
  const db = await readDb()
  const index = db.projects.findIndex((project) => project.id === id)
  if (index === -1) return null

  const updated: Project = {
    ...db.projects[index],
    ...patch,
    updatedAt: now(),
  }
  db.projects[index] = updated
  await writeDb(db)
  return updated
}

export async function getDomain(id: string): Promise<Domain | null> {
  const db = await readDb()
  return db.domains.find((domain) => domain.id === id) ?? null
}

export async function findDomainByHostname(hostname: string): Promise<Domain | null> {
  const normalized = normalizeHostname(hostname)
  const db = await readDb()
  return db.domains.find((domain) => domain.hostname === normalized) ?? null
}

export async function getDomainsForProject(projectId: string): Promise<Domain[]> {
  const db = await readDb()
  return db.domains.filter((domain) => domain.projectId === projectId)
}

export async function upsertDomainRecord(input: {
  projectId: string
  hostname: string
  type: Domain['type']
  status: Domain['status']
  verificationToken: string
}): Promise<Domain> {
  const db = await readDb()
  const hostname = normalizeHostname(input.hostname)
  const claimedByOtherProject = db.domains.find(
    (domain) => domain.hostname === hostname && domain.projectId !== input.projectId,
  )
  if (claimedByOtherProject) {
    throw new Error(`${hostname} is already connected to another project`)
  }
  const existingIndex = db.domains.findIndex(
    (domain) => domain.projectId === input.projectId && domain.hostname === hostname,
  )
  const timestamp = now()

  if (existingIndex !== -1) {
    const updated: Domain = {
      ...db.domains[existingIndex],
      type: input.type,
      status: input.status,
      verificationToken: input.verificationToken,
      updatedAt: timestamp,
    }
    db.domains[existingIndex] = updated
    await writeDb(db)
    return updated
  }

  const domain: Domain = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    hostname,
    type: input.type,
    status: input.status,
    verificationToken: input.verificationToken,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.domains.push(domain)
  await writeDb(db)
  return domain
}

export async function updateDomainRecord(
  id: string,
  patch: Partial<Omit<Domain, 'id' | 'createdAt'>>,
): Promise<Domain | null> {
  const db = await readDb()
  const index = db.domains.findIndex((domain) => domain.id === id)
  if (index === -1) return null

  const updated: Domain = {
    ...db.domains[index],
    ...patch,
    hostname: patch.hostname ? normalizeHostname(patch.hostname) : db.domains[index].hostname,
    updatedAt: now(),
  }
  db.domains[index] = updated
  await writeDb(db)
  return updated
}
