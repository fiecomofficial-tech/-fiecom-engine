import { loadPreview } from '@/lib/preview-store'
import { localDomainProvider } from './domain-provider'
import {
  createProjectRecord,
  findDomainByHostname,
  getDomain,
  getDomainsForProject,
  getProject,
  getProjectWithDomains,
  listProjectsForUser,
  updateProjectRecord,
  upsertDomainRecord,
} from './store'
import type { DomainStatusDetails, Project, ProjectWithDomains } from './types'
import { DEV_USER_ID } from './types'
import { normalizeHostname, normalizeSlug, publicUrlForHostname, subdomainForSlug } from './slug'

export { DEV_USER_ID, findDomainByHostname, getProject, getProjectWithDomains, listProjectsForUser }

function valueAtPath(source: unknown, path: string[]): unknown {
  let current = source
  for (const key of path) {
    if (!current || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

export function deriveProjectName(config: unknown, fallback = 'Untitled site'): string {
  const pages = valueAtPath(config, ['pages'])
  const sections = Array.isArray(pages)
    ? valueAtPath(pages[0], ['sections'])
    : valueAtPath(config, ['sections'])
  if (Array.isArray(sections)) {
    for (const section of sections) {
      const brand = valueAtPath(section, ['content', 'brand'])
      if (typeof brand === 'string' && brand.trim()) return brand.trim()
    }
    for (const section of sections) {
      const headline = valueAtPath(section, ['content', 'headline'])
      if (typeof headline === 'string' && headline.trim()) return headline.trim()
    }
  }
  return fallback
}

export async function createProject(input: {
  userId?: string
  name?: string
  slug?: string
  generatedConfig?: unknown
  previewId?: string
  previewUrl?: string
}): Promise<Project> {
  const generatedConfig =
    input.generatedConfig ?? (input.previewId ? await loadPreview(input.previewId) : null)
  if (!generatedConfig) {
    throw new Error('generatedConfig or a valid previewId is required')
  }

  const name = input.name?.trim() || deriveProjectName(generatedConfig)
  const slug = normalizeSlug(input.slug || name)
  const previewUrl = input.previewUrl ?? (input.previewId ? `/preview/${input.previewId}` : null)

  return createProjectRecord({
    userId: input.userId ?? DEV_USER_ID,
    name,
    slug,
    generatedConfig,
    previewUrl,
  })
}

export async function publishProject(id: string): Promise<ProjectWithDomains | null> {
  const project = await getProject(id)
  if (!project) return null

  const subdomain = localDomainProvider.createSubdomain(project)
  const publishedUrl = publicUrlForHostname(subdomain.hostname)
  const updated = await updateProjectRecord(project.id, {
    status: 'published',
    publishedUrl,
  })
  if (!updated) return null

  await upsertDomainRecord({
    projectId: updated.id,
    hostname: subdomain.hostname,
    type: 'subdomain',
    status: subdomain.status,
    verificationToken: subdomain.verificationToken,
  })

  return getProjectWithDomains(updated.id)
}

export async function connectCustomDomain(input: {
  projectId: string
  hostname: string
}): Promise<DomainStatusDetails | null> {
  const project = await getProject(input.projectId)
  if (!project) return null

  const prepared = localDomainProvider.prepareCustomDomain(input.hostname)
  if (!prepared.hostname) throw new Error('hostname is required')

  const domain = await upsertDomainRecord({
    projectId: project.id,
    hostname: prepared.hostname,
    type: 'custom',
    status: prepared.status,
    verificationToken: prepared.verificationToken,
  })

  return localDomainProvider.getStatusDetails(domain, project)
}

export async function getDomainStatus(id: string): Promise<DomainStatusDetails | null> {
  const domain = await getDomain(id)
  if (!domain) return null
  const project = await getProject(domain.projectId)
  if (!project) return null
  return localDomainProvider.getStatusDetails(domain, project)
}

export async function resolvePublishedProjectByHostname(
  hostname: string,
): Promise<Project | null> {
  const domain = await findDomainByHostname(normalizeHostname(hostname))
  if (!domain || domain.status !== 'active') return null
  const project = await getProject(domain.projectId)
  if (!project || project.status !== 'published') return null
  return project
}

export async function ensureProjectSubdomain(projectId: string): Promise<string | null> {
  const project = await getProject(projectId)
  if (!project) return null
  const existing = (await getDomainsForProject(project.id)).find(
    (domain) => domain.hostname === subdomainForSlug(project.slug),
  )
  return existing?.hostname ?? null
}
