import type { WorkspaceProgressStep } from './issue-intelligence'

export type PullRequestStatus =
  | 'open'
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'merged'
  | 'closed'

export type PullRequestReviewDecision =
  | 'none'
  | 'review_requested'
  | 'commented'
  | 'changes_requested'
  | 'approved'

export type PullRequestMatchMethod =
  | 'manual_url'
  | 'closing_reference'
  | 'issue_reference'
  | 'single_recent_author_pr'

export type PullRequestChecksStatus =
  | 'passed'
  | 'failed'
  | 'pending'
  | 'not_found'

export interface PullRequestCandidate {
  githubPullRequestId: string
  number: number
  title: string
  githubUrl: string
  state: 'open' | 'closed'
  draft: boolean
  author: string
  headBranch: string
  baseBranch: string
  createdAt: string
  updatedAt: string
  referencesIssue: boolean
  referenceStrength: 'closing' | 'mention' | 'none'
}

export interface PullRequestReview {
  id: string
  author: string | null
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'
  body: string | null
  submittedAt: string | null
  githubUrl: string | null
}

export interface PullRequestTimelineEvent {
  type: 'opened' | 'review_requested' | 'reviewed' | 'changes_requested' | 'approved' | 'closed' | 'merged'
  label: string
  actor: string | null
  occurredAt: string
}

export interface PullRequestAutomationEvidence {
  maintainerContacted: boolean
  repositoryForked: boolean
  branchCreated: boolean
  changeImplemented: boolean
  testsStatus: PullRequestChecksStatus
  checksTotal: number
  checksSuccessful: number
  explanations: string[]
}

export interface TrackedPullRequest {
  githubPullRequestId: string
  number: number
  title: string
  body: string | null
  githubUrl: string
  state: 'open' | 'closed'
  status: PullRequestStatus
  reviewDecision: PullRequestReviewDecision
  draft: boolean
  merged: boolean
  author: string
  headBranch: string
  headSha: string
  headRepositoryFullName: string | null
  baseBranch: string
  additions: number
  deletions: number
  changedFiles: number
  commits: number
  conversationComments: number
  reviewComments: number
  requestedReviewers: string[]
  reviews: PullRequestReview[]
  timeline: PullRequestTimelineEvent[]
  createdAt: string
  updatedAt: string
  mergedAt: string | null
  closedAt: string | null
}

export interface PullRequestTrackingData {
  id: string | null
  workspaceId: string
  repository: {
    owner: string
    name: string
    fullName: string
  }
  issueNumber: number
  matchMethod: PullRequestMatchMethod | null
  pullRequest: TrackedPullRequest | null
  candidates: PullRequestCandidate[]
  workspaceProgress: WorkspaceProgressStep[]
  automationEvidence: PullRequestAutomationEvidence
  metadata: {
    syncedAt: string
    persisted: boolean
    source: 'GitHub REST API'
    note: string
  }
}
