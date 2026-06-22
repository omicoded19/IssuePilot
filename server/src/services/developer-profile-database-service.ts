import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type {
  DeveloperLanguageSignal,
  DeveloperProfileAnalysisData,
  DeveloperProfileDraft,
  DeveloperTechnologySignal,
  AnalysedDeveloperRepository,
} from '../types/developer-profile.js'
import { AppError } from '../utils/app-error.js'

interface DeveloperProfileRow {
  id: string
  githubUserId: string
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  publicRepos: number
  followers: number
  following: number
  githubCreatedAt: Date | string
  githubUpdatedAt: Date | string
  languages: DeveloperLanguageSignal[]
  technologies: DeveloperTechnologySignal[]
  repositories: AnalysedDeveloperRepository[]
  analysisNotes: string[]
  repositoriesAnalysed: number
  analysedAt: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapRow(row: DeveloperProfileRow): DeveloperProfileAnalysisData {
  return {
    profile: {
      githubUserId: row.githubUserId,
      username: row.username,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      profileUrl: row.profileUrl,
      bio: row.bio,
      location: row.location,
      company: row.company,
      blog: row.blog,
      publicRepos: row.publicRepos,
      followers: row.followers,
      following: row.following,
      githubCreatedAt: toIso(row.githubCreatedAt),
      githubUpdatedAt: toIso(row.githubUpdatedAt),
    },
    languages: row.languages,
    technologies: row.technologies,
    repositories: row.repositories,
    analysisMetadata: {
      analysisId: row.id,
      analysedAt: toIso(row.analysedAt),
      repositoriesAnalysed: row.repositoriesAnalysed,
      totalPublicRepositories: row.publicRepos,
      source: 'GitHub REST API',
      isAiGenerated: false,
      persisted: true,
      notes: row.analysisNotes,
    },
  }
}

export async function persistDeveloperProfileAnalysis(
  draft: DeveloperProfileDraft,
): Promise<DeveloperProfileAnalysisData> {
  const id = randomUUID()
  const profile = draft.profile

  try {
    const result = await pool.query<DeveloperProfileRow>(
      `
        INSERT INTO "DeveloperProfileAnalysis" (
          "id", "githubUserId", "username", "displayName", "avatarUrl",
          "profileUrl", "bio", "location", "company", "blog",
          "publicRepos", "followers", "following", "githubCreatedAt",
          "githubUpdatedAt", "languages", "technologies", "repositories",
          "analysisNotes", "repositoriesAnalysed", "analysedAt", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16::jsonb, $17::jsonb, $18::jsonb,
          $19::jsonb, $20, $21, NOW(), NOW()
        )
        RETURNING *
      `,
      [
        id,
        profile.githubUserId,
        profile.username.toLowerCase(),
        profile.displayName,
        profile.avatarUrl,
        profile.profileUrl,
        profile.bio,
        profile.location,
        profile.company,
        profile.blog,
        profile.publicRepos,
        profile.followers,
        profile.following,
        profile.githubCreatedAt,
        profile.githubUpdatedAt,
        JSON.stringify(draft.languages),
        JSON.stringify(draft.technologies),
        JSON.stringify(draft.repositories),
        JSON.stringify(draft.analysisMetadata.notes),
        draft.analysisMetadata.repositoriesAnalysed,
        draft.analysisMetadata.analysedAt,
      ],
    )

    const row = result.rows[0]
    if (!row) throw new Error('Profile analysis insert returned no row.')
    return mapRow(row)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not save the GitHub profile analysis.',
    )
  }
}

export async function getStoredDeveloperProfileAnalysis(
  username: string,
): Promise<DeveloperProfileAnalysisData | null> {
  try {
    const result = await pool.query<DeveloperProfileRow>(
      `
        SELECT * FROM "DeveloperProfileAnalysis"
        WHERE LOWER("username") = LOWER($1)
        ORDER BY "analysedAt" DESC
        LIMIT 1
      `,
      [username],
    )
    return result.rows[0] ? mapRow(result.rows[0]) : null
  } catch {
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not retrieve the stored GitHub profile analysis.',
    )
  }
}
