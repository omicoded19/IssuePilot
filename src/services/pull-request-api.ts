import { apiRequest } from './api-client'
import type { PullRequestTrackingData } from '@/types/pull-request'

interface PullRequestTrackingResponse {
  success: true
  data: PullRequestTrackingData
}

export async function getPullRequestTracking(
  workspaceId: string,
): Promise<PullRequestTrackingData> {
  const response = await apiRequest<PullRequestTrackingResponse>(
    `/api/pull-requests/workspaces/${encodeURIComponent(workspaceId)}`,
  )
  return response.data
}

export async function syncPullRequestTracking(
  workspaceId: string,
  pullRequestUrl?: string,
): Promise<PullRequestTrackingData> {
  const response = await apiRequest<PullRequestTrackingResponse>(
    `/api/pull-requests/workspaces/${encodeURIComponent(workspaceId)}/sync`,
    {
      method: 'POST',
      body: JSON.stringify({ pullRequestUrl: pullRequestUrl?.trim() || undefined }),
    },
  )
  return response.data
}
