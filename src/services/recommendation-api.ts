import { apiRequest } from './api-client'
import type {
  RecommendationData,
  RecommendationRequest,
} from '@/types/recommendation'

interface RecommendationResponse {
  success: true
  data: RecommendationData
}

export async function generateRecommendations(
  request: RecommendationRequest,
): Promise<RecommendationData> {
  const response = await apiRequest<RecommendationResponse>('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return response.data
}

export async function getLatestRecommendations(
  username: string,
): Promise<RecommendationData> {
  const response = await apiRequest<RecommendationResponse>(
    `/api/recommendations/${encodeURIComponent(username)}/latest`,
  )
  return response.data
}
