export type ProjectStatus = 'draft' | 'published'
export type DomainType = 'subdomain' | 'custom'
export type DomainStatus = 'pending' | 'active' | 'failed'

export interface Project {
  id: string
  userId: string
  name: string
  slug: string
  generatedConfig: unknown
  status: ProjectStatus
  previewUrl: string | null
  publishedUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  projectId: string
  hostname: string
  type: DomainType
  status: DomainStatus
  verificationToken: string
  createdAt: string
  updatedAt: string
}

export interface ProjectWithDomains extends Project {
  domains: Domain[]
}

export interface DomainStatusDetails {
  domain: Domain
  project: Project
  dns: {
    type: 'CNAME' | 'A'
    host: string
    value: string
  }[]
  verification: {
    type: 'TXT'
    host: string
    value: string
  }
}

export const DEV_USER_ID = 'local-demo-user'
