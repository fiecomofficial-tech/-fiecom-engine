import DashboardClient from './dashboard-client'
import { DEV_USER_ID, listProjectsForUser } from '@/lib/publishing/service'
import type { ProjectWithDomains } from '@/lib/publishing/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let projects: ProjectWithDomains[] = []
  let initialError: string | null = null

  try {
    projects = await listProjectsForUser(DEV_USER_ID)
  } catch (err) {
    initialError = err instanceof Error ? err.message : 'Could not load projects'
  }

  return <DashboardClient initialProjects={projects} initialError={initialError} />
}
