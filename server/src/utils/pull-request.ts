import type {
  PullRequestReview,
  PullRequestReviewDecision,
  PullRequestStatus,
} from '../types/pull-request.js'
import { AppError } from './app-error.js'

export interface PullRequestCoordinates {
  owner: string
  repository: string
  number: number
}

export function parsePullRequestUrl(value: string): PullRequestCoordinates {
  const trimmed = value.trim()
  let parsed: URL

  try {
    parsed = new URL(trimmed)
  } catch {
    throw new AppError(400, 'INVALID_PULL_REQUEST_URL', 'Enter a complete GitHub pull-request URL.')
  }

  if (parsed.hostname.toLowerCase() !== 'github.com') {
    throw new AppError(400, 'INVALID_PULL_REQUEST_URL', 'Only github.com pull-request URLs are supported.')
  }

  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts.length !== 4 || parts[2] !== 'pull' || !/^\d+$/.test(parts[3] ?? '')) {
    throw new AppError(
      400,
      'INVALID_PULL_REQUEST_URL',
      'Use a URL like https://github.com/owner/repository/pull/123.',
    )
  }

  return {
    owner: parts[0]!,
    repository: parts[1]!,
    number: Number(parts[3]),
  }
}

export function issueReferenceStrength(
  text: string | null | undefined,
  owner: string,
  repository: string,
  issueNumber: number,
): 'closing' | 'mention' | 'none' {
  if (!text) return 'none'

  const escapedOwner = owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedRepository = repository.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const number = String(issueNumber)
  const closing = new RegExp(
    `\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+(?:(?:${escapedOwner}/${escapedRepository})?#${number}|https://github\\.com/${escapedOwner}/${escapedRepository}/issues/${number})\\b`,
    'i',
  )
  if (closing.test(text)) return 'closing'

  const mention = new RegExp(
    `(?:^|[^\\d])(?:(?:${escapedOwner}/${escapedRepository})?#${number}|https://github\\.com/${escapedOwner}/${escapedRepository}/issues/${number})(?:\\b|$)`,
    'i',
  )
  return mention.test(text) ? 'mention' : 'none'
}

export function latestReviewsByAuthor(reviews: PullRequestReview[]): PullRequestReview[] {
  const latest = new Map<string, PullRequestReview>()
  const sorted = [...reviews].sort((left, right) => {
    const leftTime = left.submittedAt ? Date.parse(left.submittedAt) : 0
    const rightTime = right.submittedAt ? Date.parse(right.submittedAt) : 0
    return leftTime - rightTime
  })

  for (const review of sorted) {
    if (!review.author || review.state === 'PENDING') continue
    latest.set(review.author.toLowerCase(), review)
  }

  return [...latest.values()]
}

export function deriveReviewDecision(
  reviews: PullRequestReview[],
  requestedReviewers: string[],
): PullRequestReviewDecision {
  const latest = latestReviewsByAuthor(reviews)
  if (latest.some((review) => review.state === 'CHANGES_REQUESTED')) return 'changes_requested'
  if (latest.some((review) => review.state === 'APPROVED')) return 'approved'
  if (latest.some((review) => review.state === 'COMMENTED')) return 'commented'
  if (requestedReviewers.length > 0) return 'review_requested'
  return 'none'
}

export function derivePullRequestStatus(input: {
  state: 'open' | 'closed'
  draft: boolean
  merged: boolean
  reviewDecision: PullRequestReviewDecision
}): PullRequestStatus {
  if (input.merged) return 'merged'
  if (input.state === 'closed') return 'closed'
  if (input.draft) return 'draft'
  if (input.reviewDecision === 'changes_requested') return 'changes_requested'
  if (input.reviewDecision === 'approved') return 'approved'
  if (input.reviewDecision !== 'none') return 'in_review'
  return 'open'
}
