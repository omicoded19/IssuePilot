import type { QueryResultRow } from 'pg'
import { pool } from '../lib/database.js'
import type { AuthUser } from '../types/auth.js'

interface AccountDataRow extends QueryResultRow {
  [key: string]: unknown
}

interface AccountDataExport {
  exportedAt: string
  account: AuthUser
  contributionProfile: AccountDataRow | null
  developerProfileAnalyses: AccountDataRow[]
  recommendationRuns: AccountDataRow[]
  contributionWorkspaces: AccountDataRow[]
  pullRequestTracking: AccountDataRow[]
  performanceBenchmarks: AccountDataRow[]
}

export async function exportAccountData(
  user: AuthUser,
): Promise<AccountDataExport> {
  const [
    contributionProfile,
    developerProfileAnalyses,
    recommendationRuns,
    contributionWorkspaces,
    pullRequestTracking,
    performanceBenchmarks,
  ] = await Promise.all([
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "ContributionProfile"
        WHERE "authUserId" = $1
      `,
      [user.id],
    ),
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "DeveloperProfileAnalysis"
        WHERE
          "githubUserId" = $1
          OR LOWER("username") = LOWER($2)
        ORDER BY "analysedAt" DESC
      `,
      [user.githubUserId, user.username],
    ),
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "RecommendationRun"
        WHERE LOWER("username") = LOWER($1)
        ORDER BY "generatedAt" DESC
      `,
      [user.username],
    ),
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "ContributionWorkspace"
        WHERE LOWER("username") = LOWER($1)
        ORDER BY "updatedAt" DESC
      `,
      [user.username],
    ),
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "PullRequestTracking"
        WHERE "authUserId" = $1
        ORDER BY "updatedAt" DESC
      `,
      [user.id],
    ),
    pool.query<AccountDataRow>(
      `
        SELECT *
        FROM "PerformanceBenchmark"
        WHERE "authUserId" = $1
        ORDER BY "createdAt" DESC
      `,
      [user.id],
    ),
  ])

  return {
    exportedAt: new Date().toISOString(),
    account: user,
    contributionProfile:
      contributionProfile.rows[0] ?? null,
    developerProfileAnalyses:
      developerProfileAnalyses.rows,
    recommendationRuns:
      recommendationRuns.rows,
    contributionWorkspaces:
      contributionWorkspaces.rows,
    pullRequestTracking:
      pullRequestTracking.rows,
    performanceBenchmarks:
      performanceBenchmarks.rows,
  }
}

export async function deleteAccountData(
  user: AuthUser,
): Promise<void> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `
        DELETE FROM "ContributionWorkspace"
        WHERE LOWER("username") = LOWER($1)
      `,
      [user.username],
    )

    await client.query(
      `
        DELETE FROM "RecommendationRun"
        WHERE LOWER("username") = LOWER($1)
      `,
      [user.username],
    )

    await client.query(
      `
        DELETE FROM "DeveloperProfileAnalysis"
        WHERE
          "githubUserId" = $1
          OR LOWER("username") = LOWER($2)
      `,
      [user.githubUserId, user.username],
    )

    await client.query(
      `
        DELETE FROM "AuthUser"
        WHERE "id" = $1
      `,
      [user.id],
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
