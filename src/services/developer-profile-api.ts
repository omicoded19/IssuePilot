import { apiRequest } from './api-client'
import type { DeveloperProfileAnalysisData } from '@/types/developer-profile'

interface DeveloperProfileResponse {
  success: true
  data: DeveloperProfileAnalysisData
}

export async function analyzeDeveloperProfile(
  username: string,
): Promise<DeveloperProfileAnalysisData> {
  const response = await apiRequest<DeveloperProfileResponse>(
    '/api/developers/analyze',
    {
      method: 'POST',
      body: JSON.stringify({ username }),
    },
  )
  return response.data
}

export async function getDeveloperProfileAnalysis(
  username: string,
): Promise<DeveloperProfileAnalysisData> {
  const response = await apiRequest<DeveloperProfileResponse>(
    `/api/developers/${encodeURIComponent(username)}`,
  )
  return response.data
}
