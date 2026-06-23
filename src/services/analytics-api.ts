import { apiRequest } from './api-client'
import type { AnalyticsData } from '@/types/analytics'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export async function getMyAnalytics(): Promise<AnalyticsData> {
  const response = await apiRequest<ApiEnvelope<AnalyticsData>>('/api/analytics/me')
  return response.data
}
