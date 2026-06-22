import { apiRequest } from './api-client'
import type { RealRepositoryAnalysis } from '@/types/repository-analysis'

interface AnalysisResponse {
  success: true
  data: RealRepositoryAnalysis
}

export async function analyzeRepository(
  repositoryUrl: string,
): Promise<RealRepositoryAnalysis> {
  const response = await apiRequest<AnalysisResponse>('/api/repositories/analyze', {
    method: 'POST',
    body: JSON.stringify({ repositoryUrl }),
  })
  return response.data
}

export async function getRepositoryAnalysis(
  owner: string,
  repository: string,
): Promise<RealRepositoryAnalysis> {
  const response = await apiRequest<AnalysisResponse>(
    `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
  )
  return response.data
}

export function createRepositoryRouteId(owner: string, repository: string): string {
  return `${encodeURIComponent(owner)}--${encodeURIComponent(repository)}`
}

export function parseRepositoryRouteId(
  routeId: string,
): { owner: string; repository: string } | null {
  const separator = routeId.indexOf('--')
  if (separator < 1) return null

  try {
    const owner = decodeURIComponent(routeId.slice(0, separator))
    const repository = decodeURIComponent(routeId.slice(separator + 2))
    return owner && repository ? { owner, repository } : null
  } catch {
    return null
  }
}
