import { pool } from '../lib/database.js'
import type {
  AnalyticsSourceData,
  ProfileAnalyticsRow,
  PullRequestAnalyticsRow,
  RecommendationAnalyticsRow,
  WorkspaceAnalyticsRow,
} from '../types/analytics.js'
import { AppError } from '../utils/app-error.js'

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export async function getAnalyticsSourceData(
  username: string,
  authUserId: string,
): Promise<AnalyticsSourceData> {
  try {
    const [profilesResult, recommendationsResult, workspacesResult, pullRequestsResult] =
      await Promise.all([
        pool.query<ProfileAnalyticsRow>(
          `SELECT "id", "repositoriesAnalysed", "technologies", "analysedAt"
           FROM "DeveloperProfileAnalysis"
           WHERE LOWER("username") = LOWER($1)
           ORDER BY "analysedAt" ASC`,
          [username],
        ),
        pool.query<RecommendationAnalyticsRow>(
          `SELECT "id", "candidateRepositoriesChecked", "repositoriesReturned",
                  "organizationsReturned", "repositories", "generatedAt"
           FROM "RecommendationRun"
           WHERE LOWER("username") = LOWER($1)
           ORDER BY "generatedAt" ASC`,
          [username],
        ),
        pool.query<WorkspaceAnalyticsRow>(
          `SELECT "id", "workspace", "progress", "createdAt", "updatedAt"
           FROM "ContributionWorkspace"
           WHERE LOWER("username") = LOWER($1)
           ORDER BY "createdAt" ASC`,
          [username],
        ),
        pool.query<PullRequestAnalyticsRow>(
          `SELECT "id", "status", "reviewDecision", "snapshot", "lastSyncedAt"
           FROM "PullRequestTracking"
           WHERE "authUserId" = $1
           ORDER BY "lastSyncedAt" ASC`,
          [authUserId],
        ),
      ])

    return {
      profiles: profilesResult.rows.map((row) => ({
        ...row,
        analysedAt: toIso(row.analysedAt),
      })),
      recommendations: recommendationsResult.rows.map((row) => ({
        ...row,
        generatedAt: toIso(row.generatedAt),
      })),
      workspaces: workspacesResult.rows.map((row) => ({
        ...row,
        createdAt: toIso(row.createdAt),
        updatedAt: toIso(row.updatedAt),
      })),
      pullRequests: pullRequestsResult.rows.map((row) => ({
        ...row,
        lastSyncedAt: toIso(row.lastSyncedAt),
      })),
    }
  } catch (error) {
    console.error('Analytics query failed:', error instanceof Error ? error.message : error)
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not load contribution analytics.')
  }
}
