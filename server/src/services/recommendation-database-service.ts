import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type {
  RecommendationData,
  RecommendationDraft,
  RecommendationRequest,
} from '../types/recommendation.js'
import { AppError } from '../utils/app-error.js'

interface RecommendationRow {
  id: string
  username: string
  requestProfile: RecommendationRequest
  organizations: RecommendationData['organizations']
  repositories: RecommendationData['repositories']
  candidateRepositoriesChecked: number
  repositoriesReturned: number
  organizationsReturned: number
  scoringVersion: string
  notes: string[]
  generatedAt: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapRow(row: RecommendationRow): RecommendationData {
  return {
    username: row.username,
    organizations: row.organizations,
    repositories: row.repositories,
    metadata: {
      recommendationId: row.id,
      generatedAt: toIso(row.generatedAt),
      candidateRepositoriesChecked: row.candidateRepositoriesChecked,
      repositoriesReturned: row.repositoriesReturned,
      organizationsReturned: row.organizationsReturned,
      scoringVersion: row.scoringVersion,
      persisted: true,
      notes: row.notes,
    },
  }
}

export async function persistRecommendationRun(
  request: RecommendationRequest,
  draft: RecommendationDraft,
): Promise<RecommendationData> {
  const id = randomUUID()

  try {
    const result = await pool.query<RecommendationRow>(
      `
        INSERT INTO "RecommendationRun" (
          "id", "username", "requestProfile", "organizations", "repositories",
          "candidateRepositoriesChecked", "repositoriesReturned", "organizationsReturned",
          "scoringVersion", "notes", "generatedAt", "createdAt"
        ) VALUES (
          $1, $2, $3::jsonb, $4::jsonb, $5::jsonb,
          $6, $7, $8, $9, $10::jsonb, $11, NOW()
        )
        RETURNING *
      `,
      [
        id,
        draft.username,
        JSON.stringify(request),
        JSON.stringify(draft.organizations),
        JSON.stringify(draft.repositories),
        draft.metadata.candidateRepositoriesChecked,
        draft.metadata.repositoriesReturned,
        draft.metadata.organizationsReturned,
        draft.metadata.scoringVersion,
        JSON.stringify(draft.metadata.notes),
        draft.metadata.generatedAt,
      ],
    )

    const row = result.rows[0]
    if (!row) throw new Error('Recommendation insert returned no row.')
    return mapRow(row)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not save the recommendation results.',
    )
  }
}

export async function getLatestRecommendationRun(
  username: string,
): Promise<RecommendationData | null> {
  try {
    const result = await pool.query<RecommendationRow>(
      `
        SELECT * FROM "RecommendationRun"
        WHERE LOWER("username") = LOWER($1)
        ORDER BY "generatedAt" DESC
        LIMIT 1
      `,
      [username],
    )
    return result.rows[0] ? mapRow(result.rows[0]) : null
  } catch {
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not retrieve the saved recommendations.',
    )
  }
}
