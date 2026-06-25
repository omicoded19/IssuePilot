import type {
  PullRequestAutomationEvidence,
  PullRequestCandidate,
  PullRequestReview,
  TrackedPullRequest,
} from '../types/pull-request.js'
import { AppError } from '../utils/app-error.js'
import {
  derivePullRequestStatus,
  deriveReviewDecision,
  issueReferenceStrength,
} from '../utils/pull-request.js'

const GITHUB_API_BASE = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 15_000

interface GitHubPullRequestListItem {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  state: 'open' | 'closed'
  draft: boolean
  user: { login: string } | null
  head: {
    ref: string
    sha: string
    repo: {
      full_name: string
      fork: boolean
      owner: { login: string }
    } | null
  }
  base: { ref: string }
  created_at: string
  updated_at: string
}

interface GitHubPullRequestDetails extends GitHubPullRequestListItem {
  merged: boolean
  merged_at: string | null
  closed_at: string | null
  additions: number
  deletions: number
  changed_files: number
  commits: number
  comments: number
  review_comments: number
  requested_reviewers: Array<{ login: string }>
}

interface GitHubPullRequestReview {
  id: number
  user: { login: string } | null
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'
  body: string | null
  submitted_at: string | null
  html_url: string | null
}

interface GitHubIssueComment {
  user: { login: string } | null
}

interface GitHubRepositoryForkDetails {
  full_name: string
  fork: boolean
  parent?: { full_name: string }
  source?: { full_name: string }
}

interface GitHubCheckRun {
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending'
  conclusion:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'skipped'
    | 'timed_out'
    | 'action_required'
    | 'stale'
    | null
}

interface GitHubCheckRunsResponse {
  total_count: number
  check_runs: GitHubCheckRun[]
}

interface GitHubCombinedStatusResponse {
  state: 'error' | 'failure' | 'pending' | 'success'
  total_count: number
  statuses: Array<{ state: 'error' | 'failure' | 'pending' | 'success' }>
}

function createHeaders(accessToken: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': 'IssuePilot',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function githubRequest<T>(path: string, accessToken: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: createHeaders(accessToken),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new AppError(502, 'GITHUB_TIMEOUT', 'GitHub took too long to return pull-request data.')
    }
    throw new AppError(502, 'GITHUB_UNAVAILABLE', 'Could not connect to GitHub pull-request APIs.')
  }

  if (!response.ok) {
    let message = 'GitHub pull-request request failed.'
    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? message
    } catch {
      // Keep the stable message for non-JSON responses.
    }

    if (response.status === 404) {
      throw new AppError(404, 'PULL_REQUEST_NOT_FOUND', 'The pull request could not be found.')
    }
    if (response.status === 401) {
      throw new AppError(401, 'GITHUB_SESSION_EXPIRED', 'GitHub access expired. Sign in again.')
    }
    if (response.status === 403 || response.status === 429) {
      throw new AppError(429, 'GITHUB_RATE_LIMIT', 'GitHub temporarily denied the pull-request request. Try again later.')
    }

    throw new AppError(502, 'GITHUB_API_ERROR', `GitHub API error: ${message}`)
  }

  return response.json() as Promise<T>
}

async function optionalGitHubRequest<T>(
  path: string,
  accessToken: string,
): Promise<T | null> {
  try {
    return await githubRequest<T>(path, accessToken)
  } catch (error) {
    if (error instanceof AppError && error.code !== 'GITHUB_SESSION_EXPIRED') {
      return null
    }
    throw error
  }
}

function mapReview(review: GitHubPullRequestReview): PullRequestReview {
  return {
    id: String(review.id),
    author: review.user?.login ?? null,
    state: review.state,
    body: review.body,
    submittedAt: review.submitted_at,
    githubUrl: review.html_url,
  }
}

export async function fetchPullRequestCandidates(input: {
  owner: string
  repository: string
  username: string
  issueNumber: number
  accessToken: string
}): Promise<PullRequestCandidate[]> {
  const owner = encodeURIComponent(input.owner)
  const repository = encodeURIComponent(input.repository)
  const pulls = await githubRequest<GitHubPullRequestListItem[]>(
    `/repos/${owner}/${repository}/pulls?state=all&sort=updated&direction=desc&per_page=100`,
    input.accessToken,
  )

  return pulls
    .filter((pull) => pull.user?.login.toLowerCase() === input.username.toLowerCase())
    .slice(0, 20)
    .map((pull) => {
      const referenceStrength = issueReferenceStrength(
        `${pull.title}\n${pull.body ?? ''}`,
        input.owner,
        input.repository,
        input.issueNumber,
      )
      return {
        githubPullRequestId: String(pull.id),
        number: pull.number,
        title: pull.title,
        githubUrl: pull.html_url,
        state: pull.state,
        draft: pull.draft,
        author: pull.user?.login ?? input.username,
        headBranch: pull.head.ref,
        baseBranch: pull.base.ref,
        createdAt: pull.created_at,
        updatedAt: pull.updated_at,
        referencesIssue: referenceStrength !== 'none',
        referenceStrength,
      }
    })
}

export async function fetchTrackedPullRequest(input: {
  owner: string
  repository: string
  number: number
  accessToken: string
}): Promise<TrackedPullRequest> {
  const owner = encodeURIComponent(input.owner)
  const repository = encodeURIComponent(input.repository)
  const [pull, reviewsResponse] = await Promise.all([
    githubRequest<GitHubPullRequestDetails>(
      `/repos/${owner}/${repository}/pulls/${input.number}`,
      input.accessToken,
    ),
    githubRequest<GitHubPullRequestReview[]>(
      `/repos/${owner}/${repository}/pulls/${input.number}/reviews?per_page=100`,
      input.accessToken,
    ),
  ])

  const reviews = reviewsResponse.map(mapReview)
  const requestedReviewers = pull.requested_reviewers.map((reviewer) => reviewer.login)
  const reviewDecision = deriveReviewDecision(reviews, requestedReviewers)
  const status = derivePullRequestStatus({
    state: pull.state,
    draft: pull.draft,
    merged: pull.merged,
    reviewDecision,
  })

  const timeline: TrackedPullRequest['timeline'] = [
    {
      type: 'opened',
      label: pull.draft ? 'Draft pull request opened' : 'Pull request opened',
      actor: pull.user?.login ?? null,
      occurredAt: pull.created_at,
    },
  ]

  if (requestedReviewers.length > 0) {
    timeline.push({
      type: 'review_requested',
      label: `Review requested from ${requestedReviewers.join(', ')}`,
      actor: pull.user?.login ?? null,
      occurredAt: pull.updated_at,
    })
  }

  for (const review of reviews) {
    if (!review.submittedAt || review.state === 'PENDING') continue
    timeline.push({
      type:
        review.state === 'APPROVED'
          ? 'approved'
          : review.state === 'CHANGES_REQUESTED'
            ? 'changes_requested'
            : 'reviewed',
      label:
        review.state === 'APPROVED'
          ? 'Pull request approved'
          : review.state === 'CHANGES_REQUESTED'
            ? 'Changes requested'
            : 'Review comment submitted',
      actor: review.author,
      occurredAt: review.submittedAt,
    })
  }

  if (pull.merged && pull.merged_at) {
    timeline.push({
      type: 'merged',
      label: 'Pull request merged',
      actor: null,
      occurredAt: pull.merged_at,
    })
  } else if (pull.state === 'closed' && pull.closed_at) {
    timeline.push({
      type: 'closed',
      label: 'Pull request closed without merge',
      actor: null,
      occurredAt: pull.closed_at,
    })
  }

  timeline.sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))

  return {
    githubPullRequestId: String(pull.id),
    number: pull.number,
    title: pull.title,
    body: pull.body,
    githubUrl: pull.html_url,
    state: pull.state,
    status,
    reviewDecision,
    draft: pull.draft,
    merged: pull.merged,
    author: pull.user?.login ?? 'unknown',
    headBranch: pull.head.ref,
    headSha: pull.head.sha,
    headRepositoryFullName: pull.head.repo?.full_name ?? null,
    baseBranch: pull.base.ref,
    additions: pull.additions,
    deletions: pull.deletions,
    changedFiles: pull.changed_files,
    commits: pull.commits,
    conversationComments: pull.comments,
    reviewComments: pull.review_comments,
    requestedReviewers,
    reviews,
    timeline,
    createdAt: pull.created_at,
    updatedAt: pull.updated_at,
    mergedAt: pull.merged_at,
    closedAt: pull.closed_at,
  }
}


function deriveChecksStatus(
  checkRuns: GitHubCheckRunsResponse | null,
  combinedStatus: GitHubCombinedStatusResponse | null,
): Pick<PullRequestAutomationEvidence, 'testsStatus' | 'checksTotal' | 'checksSuccessful'> {
  const runs = checkRuns?.check_runs ?? []
  const statuses = combinedStatus?.statuses ?? []
  const checksTotal = runs.length + statuses.length

  if (checksTotal === 0) {
    return { testsStatus: 'not_found', checksTotal: 0, checksSuccessful: 0 }
  }

  const runFailureConclusions = new Set([
    'failure',
    'cancelled',
    'timed_out',
    'action_required',
    'stale',
  ])
  const runPassedConclusions = new Set(['success', 'neutral', 'skipped'])
  const hasFailedRun = runs.some(
    (run) => run.conclusion !== null && runFailureConclusions.has(run.conclusion),
  )
  const hasPendingRun = runs.some(
    (run) => run.status !== 'completed' || run.conclusion === null,
  )
  const hasFailedStatus = statuses.some(
    (status) => status.state === 'failure' || status.state === 'error',
  )
  const hasPendingStatus = statuses.some((status) => status.state === 'pending')

  const checksSuccessful =
    runs.filter(
      (run) => run.conclusion !== null && runPassedConclusions.has(run.conclusion),
    ).length + statuses.filter((status) => status.state === 'success').length

  if (hasFailedRun || hasFailedStatus) {
    return { testsStatus: 'failed', checksTotal, checksSuccessful }
  }
  if (hasPendingRun || hasPendingStatus) {
    return { testsStatus: 'pending', checksTotal, checksSuccessful }
  }
  return { testsStatus: 'passed', checksTotal, checksSuccessful }
}

export async function fetchPullRequestAutomationEvidence(input: {
  owner: string
  repository: string
  issueNumber: number
  username: string
  pullRequest: TrackedPullRequest
  accessToken: string
}): Promise<PullRequestAutomationEvidence> {
  const owner = encodeURIComponent(input.owner)
  const repository = encodeURIComponent(input.repository)
  const username = encodeURIComponent(input.username)
  const sha = encodeURIComponent(input.pullRequest.headSha)

  const [issueComments, forkDetails, checkRuns, combinedStatus] = await Promise.all([
    optionalGitHubRequest<GitHubIssueComment[]>(
      `/repos/${owner}/${repository}/issues/${input.issueNumber}/comments?per_page=100`,
      input.accessToken,
    ),
    optionalGitHubRequest<GitHubRepositoryForkDetails>(
      `/repos/${username}/${repository}`,
      input.accessToken,
    ),
    optionalGitHubRequest<GitHubCheckRunsResponse>(
      `/repos/${owner}/${repository}/commits/${sha}/check-runs?per_page=100`,
      input.accessToken,
    ),
    optionalGitHubRequest<GitHubCombinedStatusResponse>(
      `/repos/${owner}/${repository}/commits/${sha}/status`,
      input.accessToken,
    ),
  ])

  const issueCommentByUser = (issueComments ?? []).some(
    (comment) => comment.user?.login.toLowerCase() === input.username.toLowerCase(),
  )
  const expectedRepository = `${input.owner}/${input.repository}`.toLowerCase()
  const forkParent = forkDetails?.parent?.full_name ?? forkDetails?.source?.full_name ?? null
  const repositoryForked = Boolean(
    (forkDetails?.fork && forkParent?.toLowerCase() === expectedRepository) ||
      (input.pullRequest.headRepositoryFullName?.toLowerCase().startsWith(
        `${input.username.toLowerCase()}/`,
      ) && input.pullRequest.headRepositoryFullName.toLowerCase() !== expectedRepository),
  )
  const checks = deriveChecksStatus(checkRuns, combinedStatus)
  const maintainerContacted = issueCommentByUser || Boolean(input.pullRequest.githubUrl)
  const branchCreated = input.pullRequest.headBranch.trim().length > 0
  const changeImplemented =
    input.pullRequest.changedFiles > 0 && input.pullRequest.commits > 0

  const explanations: string[] = []
  explanations.push(
    issueCommentByUser
      ? 'A comment from your GitHub account was found on the linked issue.'
      : 'The opened pull request is treated as direct maintainer contact.',
  )
  explanations.push(
    repositoryForked
      ? 'GitHub evidence shows that the pull request branch comes from your fork.'
      : 'A matching fork could not be confirmed from GitHub.',
  )
  explanations.push(
    branchCreated
      ? `The pull request uses branch ${input.pullRequest.headBranch}.`
      : 'No pull-request branch was detected.',
  )
  explanations.push(
    changeImplemented
      ? `${input.pullRequest.changedFiles} changed file(s) across ${input.pullRequest.commits} commit(s) were detected.`
      : 'No committed file changes were detected on the pull request.',
  )
  explanations.push(
    checks.testsStatus === 'passed'
      ? `${checks.checksSuccessful}/${checks.checksTotal} detected checks passed.`
      : checks.testsStatus === 'not_found'
        ? 'No GitHub check runs or commit statuses were found yet.'
        : `GitHub checks are ${checks.testsStatus}.`,
  )

  return {
    maintainerContacted,
    repositoryForked,
    branchCreated,
    changeImplemented,
    ...checks,
    explanations,
  }
}
