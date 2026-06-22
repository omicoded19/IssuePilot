import { apiRequest } from './api-client'
import type {
  ContributionWorkspace,
  ContributionWorkspaceRequest,
  ContributionWorkspaceUpdate,
  IssueRecommendationData,
  IssueRecommendationRequest,
} from '@/types/issue-intelligence'

interface IssueRecommendationResponse {
  success: true
  data: IssueRecommendationData
}

interface WorkspaceResponse {
  success: true
  data: ContributionWorkspace
}

export async function recommendRepositoryIssues(
  request: IssueRecommendationRequest,
): Promise<IssueRecommendationData> {
  const response = await apiRequest<IssueRecommendationResponse>('/api/issues/recommend', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return response.data
}

export async function createContributionWorkspace(
  request: ContributionWorkspaceRequest,
): Promise<ContributionWorkspace> {
  const response = await apiRequest<WorkspaceResponse>('/api/issues/workspace', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return response.data
}

export async function getContributionWorkspace(
  username: string,
  owner: string,
  repository: string,
  issueNumber: number,
): Promise<ContributionWorkspace> {
  const response = await apiRequest<WorkspaceResponse>(
    `/api/issues/workspace/${encodeURIComponent(username)}/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${issueNumber}`,
  )
  return response.data
}

export async function updateContributionWorkspace(
  workspaceId: string,
  update: ContributionWorkspaceUpdate,
): Promise<ContributionWorkspace> {
  const response = await apiRequest<WorkspaceResponse>(
    `/api/issues/workspace/${encodeURIComponent(workspaceId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(update),
    },
  )
  return response.data
}
