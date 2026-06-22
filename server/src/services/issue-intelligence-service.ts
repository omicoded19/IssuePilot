import { randomUUID } from 'node:crypto'
import type {
  ContributionWorkspace,
  ContributionWorkspaceRequest,
  ContributionWorkspaceUpdate,
  IssueRecommendationData,
  IssueRecommendationRequest,
} from '../types/issue-intelligence.js'
import { AppError } from '../utils/app-error.js'
import { fetchIssueDetails } from './github-service.js'
import {
  createContributionWorkspaceDraft,
  createIssueRecommendationData,
} from './issue-intelligence-engine.js'
import {
  getContributionWorkspace,
  persistContributionWorkspace,
  updateContributionWorkspace,
} from './issue-intelligence-database-service.js'
import { getStoredRepositoryAnalysis } from './repository-database-service.js'

async function requireStoredAnalysis(owner: string, repository: string) {
  const analysis = await getStoredRepositoryAnalysis(owner, repository)
  if (!analysis) {
    throw new AppError(
      404,
      'ANALYSIS_NOT_FOUND',
      'Analyse this repository before generating personalized issue guidance.',
    )
  }
  return analysis
}

export async function generateIssueRecommendations(
  request: IssueRecommendationRequest,
): Promise<IssueRecommendationData> {
  const analysis = await requireStoredAnalysis(request.owner, request.repository)
  return createIssueRecommendationData(request, analysis)
}

export async function generateContributionWorkspace(
  request: ContributionWorkspaceRequest,
): Promise<ContributionWorkspace> {
  const analysis = await requireStoredAnalysis(request.owner, request.repository)
  const storedIssue = analysis.issues.find((issue) => issue.number === request.issueNumber)
  if (!storedIssue) {
    throw new AppError(
      404,
      'ISSUE_NOT_FOUND',
      'This issue was not found in the stored beginner-oriented issue set. Reanalyse the repository and try again.',
    )
  }

  const { issue, comments } = await fetchIssueDetails(
    request.owner,
    request.repository,
    request.issueNumber,
  )
  const draft = createContributionWorkspaceDraft(
    randomUUID(),
    request,
    analysis,
    storedIssue,
    issue,
    comments,
  )
  return persistContributionWorkspace(draft)
}

export async function loadContributionWorkspace(
  username: string,
  owner: string,
  repository: string,
  issueNumber: number,
): Promise<ContributionWorkspace | null> {
  return getContributionWorkspace(username, owner, repository, issueNumber)
}

export async function saveContributionWorkspaceProgress(
  workspaceId: string,
  update: ContributionWorkspaceUpdate,
): Promise<ContributionWorkspace> {
  return updateContributionWorkspace(workspaceId, update)
}
