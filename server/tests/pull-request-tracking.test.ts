import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PullRequestReview } from '../src/types/pull-request.js'
import {
  derivePullRequestStatus,
  deriveReviewDecision,
  issueReferenceStrength,
  parsePullRequestUrl,
} from '../src/utils/pull-request.js'

describe('pull-request tracking helpers', () => {
  it('parses a GitHub pull-request URL', () => {
    assert.deepEqual(
      parsePullRequestUrl('https://github.com/appwrite/appwrite/pull/123'),
      { owner: 'appwrite', repository: 'appwrite', number: 123 },
    )
  })

  it('rejects non pull-request URLs', () => {
    assert.throws(() => parsePullRequestUrl('https://github.com/appwrite/appwrite/issues/123'))
    assert.throws(() => parsePullRequestUrl('https://gitlab.com/appwrite/appwrite/pull/123'))
  })

  it('detects closing and normal issue references', () => {
    assert.equal(
      issueReferenceStrength('Fixes #42', 'appwrite', 'appwrite', 42),
      'closing',
    )
    assert.equal(
      issueReferenceStrength('Related to appwrite/appwrite#42', 'appwrite', 'appwrite', 42),
      'mention',
    )
    assert.equal(
      issueReferenceStrength('Updates account validation', 'appwrite', 'appwrite', 42),
      'none',
    )
  })

  it('uses the latest review from each reviewer', () => {
    const reviews: PullRequestReview[] = [
      {
        id: '1',
        author: 'maintainer',
        state: 'CHANGES_REQUESTED',
        body: null,
        submittedAt: '2026-06-20T10:00:00.000Z',
        githubUrl: null,
      },
      {
        id: '2',
        author: 'maintainer',
        state: 'APPROVED',
        body: null,
        submittedAt: '2026-06-21T10:00:00.000Z',
        githubUrl: null,
      },
    ]

    assert.equal(deriveReviewDecision(reviews, []), 'approved')
  })

  it('derives merged and changes-requested statuses', () => {
    assert.equal(
      derivePullRequestStatus({
        state: 'closed',
        draft: false,
        merged: true,
        reviewDecision: 'approved',
      }),
      'merged',
    )
    assert.equal(
      derivePullRequestStatus({
        state: 'open',
        draft: false,
        merged: false,
        reviewDecision: 'changes_requested',
      }),
      'changes_requested',
    )
  })
})
