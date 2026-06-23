import { env } from '../config/env.js'
import type { PerformanceDashboardData } from '../types/performance.js'
import { AppError } from '../utils/app-error.js'
import { calculateReductionPercent } from '../utils/performance.js'
import { parseRepositoryUrl } from '../utils/repository-url.js'
import { getCacheStatus } from './cache-service.js'
import {
  getPerformanceBenchmarks,
  savePerformanceBenchmark,
} from './performance-database-service.js'
import { analyseAndPersistRepositoryWithTelemetry } from './repository-service.js'

export async function runRepositoryPerformanceBenchmark(
  authUserId: string,
  repositoryUrl: string,
) {
  const cache = await getCacheStatus()
  if (cache.status !== 'connected') {
    throw new AppError(
      503,
      'REDIS_UNAVAILABLE',
      cache.configured
        ? 'Redis is configured but unavailable. Start Redis and try again.'
        : 'Redis is not configured. Add REDIS_URL to server/.env first.',
    )
  }

  const coordinates = parseRepositoryUrl(repositoryUrl)
  const cold = await analyseAndPersistRepositoryWithTelemetry(coordinates, {
    forceRefresh: true,
  })
  const warm = await analyseAndPersistRepositoryWithTelemetry(coordinates)

  if (warm.telemetry.cacheStatus !== 'hit') {
    throw new AppError(
      503,
      'CACHE_BENCHMARK_FAILED',
      'The warm request did not produce a Redis cache hit. Check the Redis connection.',
    )
  }

  return savePerformanceBenchmark(authUserId, {
    owner: coordinates.owner,
    repository: coordinates.repository,
    coldDurationMs: cold.telemetry.durationMs,
    warmDurationMs: warm.telemetry.durationMs,
    latencyReductionPercent: calculateReductionPercent(
      cold.telemetry.durationMs,
      warm.telemetry.durationMs,
    ),
    coldGitHubRequests: cold.telemetry.githubRequestCount,
    warmGitHubRequests: warm.telemetry.githubRequestCount,
    githubRequestReductionPercent: calculateReductionPercent(
      cold.telemetry.githubRequestCount,
      warm.telemetry.githubRequestCount,
    ),
    cacheBackend: 'Redis',
    cacheTtlSeconds: env.REDIS_CACHE_TTL_SECONDS,
  })
}

export async function getPerformanceDashboard(
  authUserId: string,
): Promise<PerformanceDashboardData> {
  const [cache, history] = await Promise.all([
    getCacheStatus(),
    getPerformanceBenchmarks(authUserId),
  ])

  return {
    cache,
    latest: history[0] ?? null,
    history,
    methodology: [
      'The cold run invalidates the repository cache, calls GitHub, performs deterministic analysis, and persists the result.',
      'The warm run immediately repeats the same analysis request and must be served from Redis.',
      'Durations are measured end to end inside the backend using the same repository and environment.',
      'GitHub request reduction is counted by instrumenting every GitHub REST request during each run.',
      'Results vary with network conditions, repository size, GitHub response time, PostgreSQL load, and machine performance.',
    ],
  }
}
