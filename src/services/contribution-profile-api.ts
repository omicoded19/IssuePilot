import { apiRequest } from './api-client'
import type {
  ContributionProfileData,
  ContributionProfileInput,
} from '@/types/contribution-profile'

interface ContributionProfileResponse {
  success: true
  data: ContributionProfileData | null
}

interface SavedContributionProfileResponse {
  success: true
  data: ContributionProfileData
}

export async function getMyContributionProfile(): Promise<ContributionProfileData | null> {
  const response = await apiRequest<ContributionProfileResponse>(
    '/api/auth/contribution-profile',
  )
  return response.data
}

export async function saveMyContributionProfile(
  profile: ContributionProfileInput,
): Promise<ContributionProfileData> {
  const response = await apiRequest<SavedContributionProfileResponse>(
    '/api/auth/contribution-profile',
    {
      method: 'PUT',
      body: JSON.stringify(profile),
    },
  )
  return response.data
}
