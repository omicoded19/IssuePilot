import { apiRequest } from './api-client'
import type {
  PerformanceBenchmarkResult,
  PerformanceDashboardData,
} from '@/types/performance'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function getMyPerformanceDashboard(): Promise<PerformanceDashboardData> {
  const response = await apiRequest<ApiEnvelope<PerformanceDashboardData>>(
    '/api/performance/me',
  )
  return response.data
}

export async function runPerformanceBenchmark(
  repositoryUrl: string,
): Promise<PerformanceBenchmarkResult> {
  const response = await apiRequest<ApiEnvelope<PerformanceBenchmarkResult>>(
    '/api/performance/benchmark',
    {
      method: 'POST',
      body: JSON.stringify({ repositoryUrl }),
    },
  )
  return response.data
}
