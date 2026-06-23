export interface CacheHealth {
  status: 'disabled' | 'connecting' | 'connected' | 'unavailable'
  configured: boolean
  backend: 'Redis' | 'none'
  ttlSeconds: number
  lastError: string | null
}

export interface PerformanceBenchmarkResult {
  id: string
  owner: string
  repository: string
  fullName: string
  coldDurationMs: number
  warmDurationMs: number
  latencyReductionPercent: number
  coldGitHubRequests: number
  warmGitHubRequests: number
  githubRequestReductionPercent: number
  cacheBackend: 'Redis'
  cacheTtlSeconds: number
  createdAt: string
}

export interface PerformanceDashboardData {
  cache: CacheHealth
  latest: PerformanceBenchmarkResult | null
  history: PerformanceBenchmarkResult[]
  methodology: string[]
}
