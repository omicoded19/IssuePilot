import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type {
  ContributionWorkspace,
  ContributionWorkspaceUpdate,
} from '../types/issue-intelligence.js'
import { AppError } from '../utils/app-error.js'

interface RepositoryIdRow {
  id: string
}

interface WorkspaceRow {
  id: string
  workspace: ContributionWorkspace
  progress: ContributionWorkspace['progress']
  personalNotes: string
  createdAt: Date | string
  updatedAt: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

async function findRepositoryId(owner: string, repository: string): Promise<string | null> {
  const result = await pool.query<RepositoryIdRow>(
    `SELECT "id" FROM "Repository"
     WHERE LOWER("owner") = LOWER($1) AND LOWER("name") = LOWER($2)
     LIMIT 1`,
    [owner, repository],
  )
  return result.rows[0]?.id ?? null
}

function mapWorkspace(row: WorkspaceRow): ContributionWorkspace {
  return {
    ...row.workspace,
    id: row.id,
    progress: row.progress,
    personalNotes: row.personalNotes,
    metadata: {
      ...row.workspace.metadata,
      updatedAt: toIso(row.updatedAt),
      persisted: true,
    },
  }
}

export async function persistContributionWorkspace(
  workspace: Omit<ContributionWorkspace, 'metadata'> & {
    metadata: Omit<ContributionWorkspace['metadata'], 'persisted'>
  },
): Promise<ContributionWorkspace> {
  try {
    const repositoryId = await findRepositoryId(
      workspace.repository.owner,
      workspace.repository.name,
    )
    if (!repositoryId) {
      throw new AppError(
        404,
        'ANALYSIS_NOT_FOUND',
        'Analyse the repository before creating a contribution workspace.',
      )
    }

    const workspaceId = workspace.id || randomUUID()
    const result = await pool.query<WorkspaceRow>(
      `INSERT INTO "ContributionWorkspace" (
         "id", "username", "repositoryId", "issueNumber", "workspace",
         "progress", "personalNotes", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, NOW(), NOW())
       ON CONFLICT ("username", "repositoryId", "issueNumber") DO UPDATE SET
         "workspace" = EXCLUDED."workspace",
         "progress" = "ContributionWorkspace"."progress",
         "personalNotes" = "ContributionWorkspace"."personalNotes",
         "updatedAt" = NOW()
       RETURNING *`,
      [
        workspaceId,
        workspace.username.toLowerCase(),
        repositoryId,
        workspace.issue.number,
        JSON.stringify({ ...workspace, id: workspaceId, metadata: { ...workspace.metadata, persisted: true } }),
        JSON.stringify(workspace.progress),
        workspace.personalNotes,
      ],
    )

    const row = result.rows[0]
    if (!row) throw new Error('PostgreSQL did not return the workspace.')
    return mapWorkspace(row)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not save the contribution workspace.')
  }
}

export async function getContributionWorkspace(
  username: string,
  owner: string,
  repository: string,
  issueNumber: number,
): Promise<ContributionWorkspace | null> {
  try {
    const result = await pool.query<WorkspaceRow>(
      `SELECT workspace.*
       FROM "ContributionWorkspace" workspace
       INNER JOIN "Repository" repository ON repository."id" = workspace."repositoryId"
       WHERE LOWER(workspace."username") = LOWER($1)
         AND LOWER(repository."owner") = LOWER($2)
         AND LOWER(repository."name") = LOWER($3)
         AND workspace."issueNumber" = $4
       LIMIT 1`,
      [username, owner, repository, issueNumber],
    )
    const row = result.rows[0]
    return row ? mapWorkspace(row) : null
  } catch {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not load the contribution workspace.')
  }
}

export async function updateContributionWorkspace(
  workspaceId: string,
  update: ContributionWorkspaceUpdate,
): Promise<ContributionWorkspace> {
  try {
    const result = await pool.query<WorkspaceRow>(
      `UPDATE "ContributionWorkspace"
       SET "progress" = $2::jsonb,
           "personalNotes" = $3,
           "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING *`,
      [workspaceId, JSON.stringify(update.progress), update.personalNotes],
    )
    const row = result.rows[0]
    if (!row) throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Contribution workspace not found.')
    return mapWorkspace(row)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not update the contribution workspace.')
  }
}
