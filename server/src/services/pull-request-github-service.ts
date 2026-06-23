import type {
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
  head: { ref: string }
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
