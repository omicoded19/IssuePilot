import { performance } from 'node:perf_hooks'
import type { RepositoryAnalysisData, RepositoryCoordinates } from '../types/repository.js'
import {
  deleteCachedValue,
  getCachedJson,
  getCacheStatus,
  setCachedJson,
} from './cache-service.js'
import { fetchRepositoryBundle } from './github-service.js'
import { runWithGitHubRequestMetrics } from './github-request-metrics.js'
import { analyseRepositoryBundle } from './repository-analysis-service.js'
import {
  getStoredRepositoryAnalysis,
  persistRepositoryAnalysis,
} from './repository-database-service.js'

export type RepositoryCacheStatus = 'hit' | 'miss' | 'bypassed' | 'disabled'

export interface RepositoryAnalysisTelemetry {
  cacheStatus: RepositoryCacheStatus
  durationMs: number
  githubRequestCount: number
  cacheBackend: 'Redis' | 'none'
}

export interface RepositoryAnalysisExecution {
  analysis: RepositoryAnalysisData
  telemetry: RepositoryAnalysisTelemetry
}

interface RepositoryAnalysisOptions {
  forceRefresh?: boolean
}

export function repositoryAnalysisCacheKey(
  coordinates: RepositoryCoordinates,
): string {
  return `issuepilot:repository-analysis:v1:${coordinates.owner.toLowerCase()}/${coordinates.repository.toLowerCase()}`
}

function elapsedMilliseconds(startedAt: number): number {
  return Math.max(0, Math.round((performance.now() - startedAt) * 100) / 100)
}

export async function invalidateRepositoryAnalysisCache(
  coordinates: RepositoryCoordinates,
): Promise<boolean> {
  return deleteCachedValue(repositoryAnalysisCacheKey(coordinates))
}

export async function analyseAndPersistRepositoryWithTelemetry(
  coordinates: RepositoryCoordinates,
  options: RepositoryAnalysisOptions = {},
): Promise<RepositoryAnalysisExecution> {
  const startedAt = performance.now()
  const cacheStatus = await getCacheStatus()
  const cacheKey = repositoryAnalysisCacheKey(coordinates)

  if (!options.forceRefresh && cacheStatus.status === 'connected') {
    const cached = await getCachedJson<RepositoryAnalysisData>(cacheKey)
    if (cached) {
      return {
        analysis: cached,
        telemetry: {
          cacheStatus: 'hit',
          durationMs: elapsedMilliseconds(startedAt),
          githubRequestCount: 0,
          cacheBackend: 'Redis',
        },
      }
    }
  }

  if (options.forceRefresh && cacheStatus.configured) {
    await deleteCachedValue(cacheKey)
  }

  const measured = await runWithGitHubRequestMetrics(async () => {
    const bundle = await fetchRepositoryBundle(coordinates)
    const analysis = analyseRepositoryBundle(bundle)
    return persistRepositoryAnalysis(analysis)
  })

  const connectedCache = (await getCacheStatus()).status === 'connected'
  if (connectedCache) {
    await setCachedJson(cacheKey, measured.result)
  }

  return {
    analysis: measured.result,
    telemetry: {
      cacheStatus: options.forceRefresh
        ? connectedCache
          ? 'bypassed'
          : 'disabled'
        : connectedCache
          ? 'miss'
          : 'disabled',
      durationMs: elapsedMilliseconds(startedAt),
      githubRequestCount: measured.requestCount,
      cacheBackend: connectedCache ? 'Redis' : 'none',
    },
  }
}

export async function analyseAndPersistRepository(
  coordinates: RepositoryCoordinates,
  options: RepositoryAnalysisOptions = {},
): Promise<RepositoryAnalysisData> {
  const execution = await analyseAndPersistRepositoryWithTelemetry(coordinates, options)
  return execution.analysis
}

export { getStoredRepositoryAnalysis }
