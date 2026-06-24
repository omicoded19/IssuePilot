import { pool } from '../lib/database.js'
import type { ContributionProfileData } from '../types/contribution-profile.js'
import { AppError } from '../utils/app-error.js'

interface ContributionProfileRow {
  authUserId: string
  skills: ContributionProfileData['skills']
  contributionPreferences: string[]
  availability: ContributionProfileData['availability']
  onboardingComplete: boolean
  updatedAt: Date | string
}

function mapRow(row: ContributionProfileRow): ContributionProfileData {
  return {
    skills: row.skills,
    contributionPreferences: row.contributionPreferences,
    availability: row.availability,
    onboardingComplete: row.onboardingComplete,
    updatedAt: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : new Date(row.updatedAt).toISOString(),
  }
}

export async function getContributionProfile(
  authUserId: string,
): Promise<ContributionProfileData | null> {
  try {
    const result = await pool.query<ContributionProfileRow>(
      'SELECT * FROM "ContributionProfile" WHERE "authUserId" = $1',
      [authUserId],
    )
    return result.rows[0] ? mapRow(result.rows[0]) : null
  } catch {
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not load your contribution profile.',
    )
  }
}

export async function upsertContributionProfile(
  authUserId: string,
  profile: Omit<ContributionProfileData, 'updatedAt'>,
): Promise<ContributionProfileData> {
  try {
    const result = await pool.query<ContributionProfileRow>(
      `
        INSERT INTO "ContributionProfile" (
          "authUserId", "skills", "contributionPreferences", "availability",
          "onboardingComplete", "createdAt", "updatedAt"
        ) VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, NOW(), NOW())
        ON CONFLICT ("authUserId") DO UPDATE SET
          "skills" = EXCLUDED."skills",
          "contributionPreferences" = EXCLUDED."contributionPreferences",
          "availability" = EXCLUDED."availability",
          "onboardingComplete" = EXCLUDED."onboardingComplete",
          "updatedAt" = NOW()
        RETURNING *
      `,
      [
        authUserId,
        JSON.stringify(profile.skills),
        JSON.stringify(profile.contributionPreferences),
        JSON.stringify(profile.availability),
        profile.onboardingComplete,
      ],
    )

    const row = result.rows[0]
    if (!row) throw new Error('Contribution profile upsert returned no row.')
    return mapRow(row)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'Could not save your contribution profile.',
    )
  }
}
