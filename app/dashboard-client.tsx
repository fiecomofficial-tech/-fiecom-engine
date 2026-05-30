'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  Rocket,
} from 'lucide-react'
import type { Domain, DomainStatusDetails, ProjectWithDomains } from '@/lib/publishing/types'

type LoadState = 'loading' | 'ready' | 'error'

interface DashboardClientProps {
  initialProjects: ProjectWithDomains[]
  initialError?: string | null
}

function statusClass(status: Domain['status'] | ProjectWithDomains['status']): string {
  if (status === 'active' || status === 'published') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (status === 'failed') {
    return 'border-red-200 bg-red-50 text-red-800'
  }
  return 'border-zinc-200 bg-zinc-100 text-zinc-700'
}

function customDomainExample(slug: string): string {
  const compact = slug.replace(/-/g, '')
  return `www.${compact || 'studio'}.works`
}

function visibleUrl(project: ProjectWithDomains): string | null {
  return project.publishedUrl ?? project.previewUrl
}

async function fetchProjects(): Promise<ProjectWithDomains[]> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch('/api/projects', {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Could not load projects')
    const data = (await response.json()) as { projects?: ProjectWithDomains[] }
    if (!Array.isArray(data.projects)) throw new Error('Project response was invalid')
    return data.projects
  } finally {
    window.clearTimeout(timeout)
  }
}

export default function DashboardClient({
  initialProjects,
  initialError = null,
}: DashboardClientProps) {
  const [projects, setProjects] = useState<ProjectWithDomains[]>(initialProjects)
  const [loadState, setLoadState] = useState<LoadState>(initialError ? 'error' : 'ready')
  const [message, setMessage] = useState<string | null>(initialError)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({})
  const [domainDetails, setDomainDetails] = useState<Record<string, DomainStatusDetails>>({})

  async function refreshProjects() {
    const nextProjects = await fetchProjects()
    setProjects(nextProjects)
    setLoadState('ready')
  }

  useEffect(() => {
    let mounted = true

    async function refreshInitialProjects() {
      try {
        const nextProjects = await fetchProjects()
        if (!mounted) return
        setProjects(nextProjects)
        setLoadState('ready')
      } catch (err) {
        if (!mounted) return
        const text = err instanceof Error ? err.message : 'Could not load projects'
        setMessage(text)
        if (initialProjects.length === 0) setLoadState('error')
      }
    }

    void refreshInitialProjects()

    return () => {
      mounted = false
    }
  }, [initialProjects.length])

  const publishedCount = useMemo(
    () => projects.filter((project) => project.status === 'published').length,
    [projects],
  )
  const customDomains = useMemo(
    () => projects.flatMap((project) => project.domains.filter((domain) => domain.type === 'custom')),
    [projects],
  )
  const customDomainKey = useMemo(
    () => customDomains.map((domain) => domain.id).join('|'),
    [customDomains],
  )

  useEffect(() => {
    let mounted = true
    const missing = customDomains.filter((domain) => !domainDetails[domain.id])
    if (missing.length === 0) return

    async function loadDomainDetails() {
      const results = await Promise.all(
        missing.map(async (domain) => {
          try {
            const response = await fetch(`/api/domains/${domain.id}/status`, {
              cache: 'no-store',
            })
            if (!response.ok) return null
            const data = (await response.json()) as { status?: DomainStatusDetails }
            return data.status ?? null
          } catch {
            return null
          }
        }),
      )
      if (!mounted) return
      setDomainDetails((current) => {
        const next = { ...current }
        for (const status of results) {
          if (status) next[status.domain.id] = status
        }
        return next
      })
    }

    void loadDomainDetails()

    return () => {
      mounted = false
    }
  }, [customDomainKey, customDomains, domainDetails])

  async function publish(projectId: string) {
    setPendingId(projectId)
    setMessage(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Publish failed')
      await refreshProjects()
      setMessage('Published')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPendingId(null)
    }
  }

  async function connectDomain(projectId: string) {
    const hostname = domainInputs[projectId]?.trim()
    if (!hostname) return

    setPendingId(projectId)
    setMessage(null)
    try {
      const response = await fetch('/api/domains/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, hostname }),
      })
      if (!response.ok) throw new Error('Domain connection failed')
      const data = (await response.json()) as { status?: DomainStatusDetails }
      const status = data.status
      if (status) {
        setDomainDetails((current) => ({
          ...current,
          [status.domain.id]: status,
        }))
      }
      setDomainInputs((current) => ({ ...current, [projectId]: '' }))
      await refreshProjects()
      setMessage('Domain added')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Domain connection failed')
    } finally {
      setPendingId(null)
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setMessage('Copied')
  }

  async function refreshDomainStatus(domainId: string) {
    setPendingId(domainId)
    setMessage(null)
    try {
      const response = await fetch(`/api/domains/${domainId}/status`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Status check failed')
      const data = (await response.json()) as { status?: DomainStatusDetails }
      const status = data.status
      if (!status) throw new Error('Domain status response was invalid')
      setDomainDetails((current) => ({
        ...current,
        [domainId]: status,
      }))
      setMessage('Domain status updated')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Status check failed')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-mist-2 text-ink">
      <div className="border-b border-line bg-mist/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-mist-2">
              <Globe2 size={17} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Fiecom</h1>
              <p className="text-sm text-ink-3">Publishing</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-ink-3 sm:flex">
            <span>{projects.length} projects</span>
            <span className="dot" />
            <span>{publishedCount} published</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-3">Sites</p>
            <h2 className="text-2xl font-semibold">Generated projects</h2>
          </div>
          {message && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-mist px-3 py-2 text-sm text-ink-2 shadow-soft">
              <CheckCircle2 size={16} aria-hidden="true" />
              {message}
            </div>
          )}
        </div>

        {loadState === 'loading' && (
          <div className="flex min-h-56 items-center justify-center rounded-md border border-line bg-mist">
            <Loader2 className="animate-spin text-ink-3" size={22} aria-hidden="true" />
          </div>
        )}

        {loadState === 'error' && (
          <div className="flex min-h-56 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-red-900">
            <AlertCircle className="mr-2" size={18} aria-hidden="true" />
            Projects could not be loaded.
          </div>
        )}

        {loadState === 'ready' && projects.length === 0 && (
          <div className="rounded-md border border-line bg-mist px-6 py-12">
            <div className="max-w-xl">
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm leading-6 text-ink-3">
                Generated sites will appear here as draft projects with a preview URL and
                publishing controls.
              </p>
            </div>
          </div>
        )}

        {loadState === 'ready' && projects.length > 0 && (
          <div className="grid gap-4">
            {projects.map((project) => {
              const url = visibleUrl(project)
              const subdomain = project.domains.find((domain) => domain.type === 'subdomain')
              const customDomains = project.domains.filter((domain) => domain.type === 'custom')
              const busy = pendingId === project.id

              return (
                <section
                  key={project.id}
                  className="rounded-md border border-line bg-mist p-5 shadow-soft"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClass(project.status)}`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-ink-3">{project.slug}</p>
                      {url && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <a
                            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-mist-2 px-3 text-sm font-medium text-ink hover:bg-mist-3"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={15} aria-hidden="true" />
                            Open
                          </a>
                          <button
                            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-mist-2 px-3 text-sm font-medium text-ink hover:bg-mist-3"
                            type="button"
                            onClick={() => void copyUrl(url)}
                          >
                            <Copy size={15} aria-hidden="true" />
                            Copy URL
                          </button>
                          <span className="break-all font-mono text-sm text-ink-3">{url}</span>
                        </div>
                      )}
                    </div>

                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-mist-2 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      disabled={busy}
                      onClick={() => void publish(project.id)}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <Rocket size={16} aria-hidden="true" />
                      )}
                      {project.status === 'published' ? 'Republish' : 'Publish'}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-line pt-5 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                      <p className="mb-2 text-sm font-semibold">Domains</p>
                      <div className="grid gap-2">
                        {subdomain && <DomainRow domain={subdomain} />}
                        {customDomains.map((domain) => (
                          <DomainRow
                            key={domain.id}
                            domain={domain}
                            details={domainDetails[domain.id]}
                            busy={pendingId === domain.id}
                            onCheck={() => void refreshDomainStatus(domain.id)}
                          />
                        ))}
                        {!subdomain && customDomains.length === 0 && (
                          <p className="text-sm text-ink-3">No domains attached.</p>
                        )}
                      </div>
                    </div>

                    <form
                      className="flex flex-col gap-2 sm:flex-row"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void connectDomain(project.id)
                      }}
                    >
                      <label className="sr-only" htmlFor={`domain-${project.id}`}>
                        Custom domain
                      </label>
                      <input
                        id={`domain-${project.id}`}
                        className="min-h-10 flex-1 rounded-md border border-line bg-mist-2 px-3 text-sm outline-none ring-0 focus:border-ink"
                        placeholder={customDomainExample(project.slug)}
                        value={domainInputs[project.id] ?? ''}
                        onChange={(event) =>
                          setDomainInputs((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line bg-mist-2 px-4 text-sm font-semibold text-ink hover:bg-mist-3 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={busy}
                      >
                        <Link2 size={16} aria-hidden="true" />
                        Connect
                      </button>
                    </form>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function DomainRow({
  domain,
  details,
  busy = false,
  onCheck,
}: {
  domain: Domain
  details?: DomainStatusDetails
  busy?: boolean
  onCheck?: () => void
}) {
  return (
    <div className="rounded-md border border-line bg-mist-2 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="break-all font-mono text-sm text-ink-2">{domain.hostname}</span>
          {domain.type === 'custom' && (
            <p className="mt-1 text-xs text-ink-3">Custom domain</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-1 text-xs font-medium ${statusClass(domain.status)}`}
          >
            {domain.status}
          </span>
          {domain.type === 'custom' && onCheck && (
            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-line bg-mist px-2 text-xs font-semibold text-ink hover:bg-mist-3 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={busy}
              onClick={onCheck}
            >
              {busy ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : 'Check'}
            </button>
          )}
        </div>
      </div>

      {domain.type === 'custom' && (
        <div className="mt-3 border-t border-line pt-3">
          {details?.message && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-soft px-3 py-2 text-sm text-ink-2">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber" size={16} aria-hidden="true" />
              <span>{details.message}</span>
            </div>
          )}

          {details ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <span>Target</span>
                <code className="rounded-md border border-line bg-mist px-2 py-1 font-mono text-ink-2">
                  {details.target}
                </code>
              </div>
              <div className="grid gap-2">
                {details.requiredDnsRecords.map((record) => (
                  <div
                    key={`${record.type}-${record.host}-${record.purpose}`}
                    className="grid gap-2 rounded-md border border-line bg-mist px-3 py-2 text-xs sm:grid-cols-[72px_1fr_1fr]"
                  >
                    <span className="font-semibold text-ink">{record.type}</span>
                    <code className="break-all font-mono text-ink-2">{record.host}</code>
                    <code className="break-all font-mono text-ink-2">{record.value}</code>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-3">Loading DNS instructions.</p>
          )}
        </div>
      )}
    </div>
  )
}
