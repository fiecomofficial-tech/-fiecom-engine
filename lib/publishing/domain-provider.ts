import crypto from 'crypto'
import type { Domain, DomainStatusDetails, Project } from './types'
import { normalizeHostname, PUBLISHING_DOMAIN, subdomainForSlug } from './slug'

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

const MULTI_PART_PUBLIC_SUFFIXES = new Set([
  'co.uk',
  'com.au',
  'com.br',
  'co.jp',
  'co.nz',
  'co.za',
])

function isLikelyApexDomain(hostname: string): boolean {
  const labels = hostname.split('.').filter(Boolean)
  if (labels.length === 2) return true
  if (labels.length === 3 && MULTI_PART_PUBLIC_SUFFIXES.has(labels.slice(1).join('.'))) {
    return true
  }
  return false
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
    const target = PUBLISHING_DOMAIN
    const verification = {
      type: 'TXT' as const,
      host: `_fiecom-verify.${domain.hostname}`,
      value: domain.verificationToken,
      purpose: 'verification' as const,
    }
    const apexUnsupported = domain.type === 'custom' && isLikelyApexDomain(domain.hostname)
    const routingRecords = apexUnsupported
      ? []
      : [
          {
            type: 'CNAME' as const,
            host: domain.hostname,
            value: target,
            purpose: 'routing' as const,
          },
        ]
    const requiredDnsRecords = [...routingRecords, verification]

    return {
      status: domain.status,
      hostname: domain.hostname,
      target,
      verificationToken: domain.verificationToken,
      requiredDnsRecords,
      ...(apexUnsupported
        ? {
            apexUnsupported: true,
            message: 'Apex custom domains are coming soon. Use a www subdomain for now.',
          }
        : {}),
      domain,
      project,
      dns: routingRecords.map(({ type, host, value }) => ({ type, host, value })),
      verification: {
        type: verification.type,
        host: verification.host,
        value: verification.value,
      },
    }
  },
}
