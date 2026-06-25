import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type {
  PullRequestAutomationEvidence,
  PullRequestMatchMethod,
  PullRequestTrackingData,
  TrackedPullRequest,
} from '../types/pull-request.js'
import type { WorkspaceProgressStep } from '../types/issue-intelligence.js'
import { AppError } from '../utils/app-error.js'

interface TrackingRow {
  id: string
  workspaceId: string
  snapshot: PullRequestTrackingData
  lastSyncedAt: Date | string
}

interface WorkspaceProgressRow {
  progress: WorkspaceProgressStep[]
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function emptyAutomationEvidence(): PullRequestAutomationEvidence {
  return {
    maintainerContacted: false,
    repositoryForked: false,
    branchCreated: false,
    changeImplemented: false,
    testsStatus: 'not_found',
    checksTotal: 0,
    checksSuccessful: 0,
    explanations: [],
  }
}

function normalizeTrackingSnapshot(
  row: TrackingRow,
): PullRequestTrackingData {
  return {
    ...row.snapshot,
    id: row.id,
    automationEvidence:
      row.snapshot.automationEvidence ?? emptyAutomationEvidence(),
    metadata: {
      ...row.snapshot.metadata,
      syncedAt: toIso(row.lastSyncedAt),
      persisted: true,
    },
  }
}

export function synchronizeProgressFromPullRequest(
  progress: WorkspaceProgressStep[],
  pullRequest: TrackedPullRequest,
  evidence: PullRequestAutomationEvidence,
): WorkspaceProgressStep[] {
  const hasReview =
    pullRequest.reviews.some((review) => review.state !== 'PENDING') ||
    pullRequest.conversationComments > 0 ||
    pullRequest.reviewComments > 0

  return progress.map((step) => {
    if (step.id === 'maintainer-contacted') {
      return { ...step, completed: step.completed || evidence.maintainerContacted }
    }
    if (step.id === 'repository-forked') {
      return { ...step, completed: step.completed || evidence.repositoryForked }
    }
    if (step.id === 'branch-created') {
      return { ...step, completed: step.completed || evidence.branchCreated }
    }
    if (step.id === 'change-implemented') {
      return { ...step, completed: step.completed || evidence.changeImplemented }
    }
    if (step.id === 'tests-passed') {
      return { ...step, completed: evidence.testsStatus === 'passed' }
    }
    if (step.id === 'pull-request-opened') return { ...step, completed: true }
    if (step.id === 'review-received') {
      return { ...step, completed: step.completed || hasReview }
    }
    if (step.id === 'merged') return { ...step, completed: pullRequest.merged }
    return step
  })
}

export async function persistPullRequestTracking(input: {
  workspaceId: string
  authUserId: string
  repository: PullRequestTrackingData['repository']
  issueNumber: number
  matchMethod: PullRequestMatchMethod
  pullRequest: TrackedPullRequest
  automationEvidence: PullRequestAutomationEvidence
  candidates: PullRequestTrackingData['candidates']
}): Promise<PullRequestTrackingData> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const workspaceResult = await client.query<WorkspaceProgressRow>(
      `SELECT "progress" FROM "ContributionWorkspace" WHERE "id" = $1 FOR UPDATE`,
      [input.workspaceId],
    )
    const workspace = workspaceResult.rows[0]
    if (!workspace) {
      throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Contribution workspace not found.')
    }

    const workspaceProgress = synchronizeProgressFromPullRequest(
      workspace.progress,
      input.pullRequest,
      input.automationEvidence,
    )
    await client.query(
      `UPDATE "ContributionWorkspace"
       SET "progress" = $2::jsonb,
           "updatedAt" = NOW()
       WHERE "id" = $1`,
      [input.workspaceId, JSON.stringify(workspaceProgress)],
    )

    const id = randomUUID()
    const syncedAt = new Date().toISOString()
    const snapshot: PullRequestTrackingData = {
      id,
      workspaceId: input.workspaceId,
      repository: input.repository,
      issueNumber: input.issueNumber,
      matchMethod: input.matchMethod,
      pullRequest: input.pullRequest,
      candidates: input.candidates,
      workspaceProgress,
      automationEvidence: input.automationEvidence,
      metadata: {
        syncedAt,
        persisted: true,
        source: 'GitHub REST API',
        note:
          'GitHub evidence automatically updates fork, branch, changes, checks, review, and merge progress.',
      },
    }

    const result = await client.query<TrackingRow>(
      `INSERT INTO "PullRequestTracking" (
         "id", "workspaceId", "authUserId", "githubPullRequestId",
         "pullRequestNumber", "status", "reviewDecision", "snapshot",
         "lastSyncedAt", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW(), NOW())
       ON CONFLICT ("workspaceId") DO UPDATE SET
         "authUserId" = EXCLUDED."authUserId",
         "githubPullRequestId" = EXCLUDED."githubPullRequestId",
         "pullRequestNumber" = EXCLUDED."pullRequestNumber",
         "status" = EXCLUDED."status",
         "reviewDecision" = EXCLUDED."reviewDecision",
         "snapshot" = EXCLUDED."snapshot",
         "lastSyncedAt" = NOW(),
         "updatedAt" = NOW()
       RETURNING "id", "workspaceId", "snapshot", "lastSyncedAt"`,
      [
        id,
        input.workspaceId,
        input.authUserId,
        input.pullRequest.githubPullRequestId,
        input.pullRequest.number,
        input.pullRequest.status,
        input.pullRequest.reviewDecision,
        JSON.stringify(snapshot),
      ],
    )

    await client.query('COMMIT')
    const row = result.rows[0]
    if (!row) throw new Error('PostgreSQL did not return pull-request tracking data.')

    return {
      ...normalizeTrackingSnapshot(row),
      workspaceProgress,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof AppError) throw error
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not save pull-request tracking data.')
  } finally {
    client.release()
  }
}

export async function getStoredPullRequestTracking(
  workspaceId: string,
  authUserId: string,
): Promise<PullRequestTrackingData | null> {
  try {
    const result = await pool.query<TrackingRow>(
      `SELECT "id", "workspaceId", "snapshot", "lastSyncedAt"
       FROM "PullRequestTracking"
       WHERE "workspaceId" = $1 AND "authUserId" = $2
       LIMIT 1`,
      [workspaceId, authUserId],
    )
    const row = result.rows[0]
    return row ? normalizeTrackingSnapshot(row) : null
  } catch {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not load pull-request tracking data.')
  }
}

export async function listStoredPullRequestTrackings(
  authUserId: string,
): Promise<PullRequestTrackingData[]> {
  try {
    const result = await pool.query<TrackingRow>(
      `SELECT "id", "workspaceId", "snapshot", "lastSyncedAt"
       FROM "PullRequestTracking"
       WHERE "authUserId" = $1
       ORDER BY
         CASE WHEN "status" IN ('open', 'draft', 'in_review', 'changes_requested', 'approved')
           THEN 0 ELSE 1 END,
         "lastSyncedAt" DESC`,
      [authUserId],
    )
    return result.rows.map(normalizeTrackingSnapshot)
  } catch {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not load tracked pull requests.')
  }
}
