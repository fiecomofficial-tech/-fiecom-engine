import crypto from 'crypto'
import type { Domain, DomainStatusDetails, Project } from './types'
import { normalizeHostname, subdomainForSlug } from './slug'

export interface DomainProvider {
  createSubdomain(project: Project): {
    hostname: string
    status: Domain['status']
    verificationToken: string
  }
  prepareCustomDomain(hostname: string): {
    hostname: string
    status: Domain['status']
    verificationToken: string
  }
  getStatusDetails(domain: Domain, project: Project): DomainStatusDetails
}

function token(): string {
  return `fiecom-${crypto.randomBytes(16).toString('hex')}`
}

export const localDomainProvider: DomainProvider = {
  createSubdomain(project) {
    return {
      hostname: subdomainForSlug(project.slug),
      status: 'active',
      verificationToken: token(),
    }
  },

  prepareCustomDomain(hostname) {
    return {
      hostname: normalizeHostname(hostname),
      status: 'pending',
      verificationToken: token(),
    }
  },

  getStatusDetails(domain, project) {
    const target = subdomainForSlug(project.slug)
    return {
      domain,
      project,
      dns:
        domain.type === 'custom'
          ? [{ type: 'CNAME', host: domain.hostname, value: target }]
          : [{ type: 'CNAME', host: domain.hostname, value: target }],
      verification: {
        type: 'TXT',
        host: `_fiecom-verify.${domain.hostname}`,
        value: domain.verificationToken,
      },
    }
  },
}
