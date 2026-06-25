import type { Request } from 'express'
import { requireAuthenticatedGitHubContext } from './auth-context-service.js'
import { getContributionWorkspaceById } from './issue-intelligence-database-service.js'
import {
  getStoredPullRequestTracking,
  listStoredPullRequestTrackings,
  persistPullRequestTracking,
} from './pull-request-database-service.js'
import {
  fetchPullRequestAutomationEvidence,
  fetchPullRequestCandidates,
  fetchTrackedPullRequest,
} from './pull-request-github-service.js'
import type {
  PullRequestMatchMethod,
  PullRequestSyncRequest,
  PullRequestTrackingData,
} from '../types/pull-request.js'
import { AppError } from '../utils/app-error.js'
import { parsePullRequestUrl } from '../utils/pull-request.js'

function assertWorkspaceOwner(workspaceUsername: string, authUsername: string): void {
  if (workspaceUsername.toLowerCase() !== authUsername.toLowerCase()) {
    throw new AppError(
      403,
      'WORKSPACE_ACCESS_DENIED',
      'This contribution workspace belongs to a different GitHub account.',
    )
  }
}

export async function synchronizeWorkspacePullRequest(
  request: Request,
  workspaceId: string,
  input: PullRequestSyncRequest,
): Promise<PullRequestTrackingData> {
  const auth = await requireAuthenticatedGitHubContext(request)
  const workspace = await getContributionWorkspaceById(workspaceId)
  if (!workspace) {
    throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Contribution workspace not found.')
  }
  assertWorkspaceOwner(workspace.username, auth.user.username)

  const repository = {
    owner: workspace.repository.owner,
    name: workspace.repository.name,
    fullName: workspace.repository.fullName,
  }

  let pullRequestNumber: number | null = null
  let matchMethod: PullRequestMatchMethod | null = null
  let candidates: Awaited<ReturnType<typeof fetchPullRequestCandidates>> = []

  if (input.pullRequestUrl?.trim()) {
    const parsed = parsePullRequestUrl(input.pullRequestUrl)
    if (
      parsed.owner.toLowerCase() !== repository.owner.toLowerCase() ||
      parsed.repository.toLowerCase() !== repository.name.toLowerCase()
    ) {
      throw new AppError(
        400,
        'PULL_REQUEST_REPOSITORY_MISMATCH',
        `The pull request must belong to ${repository.fullName}.`,
      )
    }
    pullRequestNumber = parsed.number
    matchMethod = 'manual_url'
  } else {
    candidates = await fetchPullRequestCandidates({
      owner: repository.owner,
      repository: repository.name,
      username: auth.user.username,
      issueNumber: workspace.issue.number,
      accessToken: auth.accessToken,
    })

    const closingMatch = candidates.find((candidate) => candidate.referenceStrength === 'closing')
    const mentionMatch = candidates.find((candidate) => candidate.referenceStrength === 'mention')

    if (closingMatch) {
      pullRequestNumber = closingMatch.number
      matchMethod = 'closing_reference'
    } else if (mentionMatch) {
      pullRequestNumber = mentionMatch.number
      matchMethod = 'issue_reference'
    } else if (candidates.length === 1) {
      pullRequestNumber = candidates[0]!.number
      matchMethod = 'single_recent_author_pr'
    }
  }

  if (pullRequestNumber === null) {
    return {
      id: null,
      workspaceId,
      repository,
      issueNumber: workspace.issue.number,
      matchMethod: null,
      pullRequest: null,
      candidates,
      workspaceProgress: workspace.progress,
      automationEvidence: {
        maintainerContacted: false,
        repositoryForked: false,
        branchCreated: false,
        changeImplemented: false,
        testsStatus: 'not_found',
        checksTotal: 0,
        checksSuccessful: 0,
        explanations: [],
      },
      metadata: {
        syncedAt: new Date().toISOString(),
        persisted: false,
        source: 'GitHub REST API',
        note:
          candidates.length > 0
            ? 'Multiple pull requests were found. Select the correct GitHub pull-request URL to begin tracking.'
            : 'No pull request authored by your connected GitHub account was found in this repository.',
      },
    }
  }

  const pullRequest = await fetchTrackedPullRequest({
    owner: repository.owner,
    repository: repository.name,
    number: pullRequestNumber,
    accessToken: auth.accessToken,
  })

  if (pullRequest.author.toLowerCase() !== auth.user.username.toLowerCase()) {
    throw new AppError(
      403,
      'PULL_REQUEST_ACCESS_DENIED',
      'IssuePilot only tracks pull requests authored by your connected GitHub account.',
    )
  }

  candidates = candidates.filter((candidate) => candidate.number !== pullRequest.number)
  const automationEvidence = await fetchPullRequestAutomationEvidence({
    owner: repository.owner,
    repository: repository.name,
    issueNumber: workspace.issue.number,
    username: auth.user.username,
    pullRequest,
    accessToken: auth.accessToken,
  })

  return persistPullRequestTracking({
    workspaceId,
    authUserId: auth.user.id,
    repository,
    issueNumber: workspace.issue.number,
    matchMethod: matchMethod!,
    pullRequest,
    automationEvidence,
    candidates,
  })
}

export async function loadWorkspacePullRequestTracking(
  request: Request,
  workspaceId: string,
): Promise<PullRequestTrackingData | null> {
  const auth = await requireAuthenticatedGitHubContext(request)
  const workspace = await getContributionWorkspaceById(workspaceId)
  if (!workspace) {
    throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Contribution workspace not found.')
  }
  assertWorkspaceOwner(workspace.username, auth.user.username)
  return getStoredPullRequestTracking(workspaceId, auth.user.id)
}


export async function listTrackedPullRequests(
  request: Request,
): Promise<PullRequestTrackingData[]> {
  const auth = await requireAuthenticatedGitHubContext(request)
  return listStoredPullRequestTrackings(auth.user.id)
}
