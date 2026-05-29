import type { Domain, Project, ProjectWithDomains } from './types'
import * as jsonStore from './store-json'
import * as postgresStore from './store-postgres'

type StoreModule = typeof jsonStore
type StoreKind = 'json' | 'postgres'

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

function storeKind(): StoreKind {
  const configured = process.env.PUBLISHING_STORE
  if (configured === 'json' || configured === 'postgres') return configured
  return isProductionRuntime() ? 'postgres' : 'json'
}

function selectedStore(): StoreModule {
  const kind = storeKind()
  if (kind === 'json') {
    if (isProductionRuntime()) {
      throw new Error(
        'PUBLISHING_STORE=json is not supported in production. Set PUBLISHING_STORE=postgres and POSTGRES_URL or DATABASE_URL.',
      )
    }
    return jsonStore
  }
  return postgresStore
}

export async function listProjectsForUser(userId: string): Promise<ProjectWithDomains[]> {
  return selectedStore().listProjectsForUser(userId)
}

export async function getProject(id: string): Promise<Project | null> {
  return selectedStore().getProject(id)
}

export async function getProjectWithDomains(id: string): Promise<ProjectWithDomains | null> {
  return selectedStore().getProjectWithDomains(id)
}

export async function createProjectRecord(input: {
  userId: string
  name: string
  slug: string
  generatedConfig: unknown
  previewUrl?: string | null
}): Promise<Project> {
  return selectedStore().createProjectRecord(input)
}

export async function updateProjectRecord(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<Project | null> {
  return selectedStore().updateProjectRecord(id, patch)
}

export async function getDomain(id: string): Promise<Domain | null> {
  return selectedStore().getDomain(id)
}

export async function findDomainByHostname(hostname: string): Promise<Domain | null> {
  return selectedStore().findDomainByHostname(hostname)
}

export async function getDomainsForProject(projectId: string): Promise<Domain[]> {
  return selectedStore().getDomainsForProject(projectId)
}

export async function upsertDomainRecord(input: {
  projectId: string
  hostname: string
  type: Domain['type']
  status: Domain['status']
  verificationToken: string
}): Promise<Domain> {
  return selectedStore().upsertDomainRecord(input)
}

export async function updateDomainRecord(
  id: string,
  patch: Partial<Omit<Domain, 'id' | 'createdAt'>>,
): Promise<Domain | null> {
  return selectedStore().updateDomainRecord(id, patch)
}
