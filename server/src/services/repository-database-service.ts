import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { pool } from '../lib/database.js'
import type {
  AnalysisDraft,
  AnalysisScore,
  ContributionReadiness,
  DetectedTechnology,
  LanguageBreakdown,
  RepositoryAnalysisData,
  RepositoryDocuments,
  RepositoryScores,
  RepositorySetup,
  RootEntry,
  SuitableIssue,
} from '../types/repository.js'
import { AppError } from '../utils/app-error.js'

interface RepositoryRow {
  id: string
  githubRepositoryId: string
  owner: string
  name: string
  fullName: string
  description: string | null
  githubUrl: string
  defaultBranch: string
  primaryLanguage: string | null
  stars: number
  forks: number
  watchers: number
  openIssuesCount: number
  license: string | null
  topics: string[]
  repositorySize: number
  isArchived: boolean
  isFork: boolean
  githubCreatedAt: Date | string
  githubUpdatedAt: Date | string
  githubPushedAt: Date | string | null
}

interface AnalysisRow {
  id: string
  languages: LanguageBreakdown[]
  technologies: DetectedTechnology[]
  rootStructure: RootEntry[]
  documents: RepositoryDocuments
  setup: RepositorySetup
  contributionReadiness: ContributionReadiness
  scores: RepositoryScores
  analysedAt: Date | string
}

interface IssueRow {
  githubIssueId: string
  number: number
  title: string
  bodyPreview: string | null
  githubUrl: string
  labels: string[]
  state: string
  author: string | null
  assignees: string[]
  comments: number
  availabilityStatus: SuitableIssue['availabilityStatus']
  availabilityExplanation: string
  githubCreatedAt: Date | string
  githubUpdatedAt: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

async function upsertRepository(
  client: PoolClient,
  draft: AnalysisDraft,
): Promise<string> {
  const repository = draft.repository
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO "Repository" (
        "id", "githubRepositoryId", "owner", "name", "fullName",
        "description", "githubUrl", "defaultBranch", "primaryLanguage",
        "stars", "forks", "watchers", "openIssuesCount", "license",
        "topics", "repositorySize", "isArchived", "isFork",
        "githubCreatedAt", "githubUpdatedAt", "githubPushedAt",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15::jsonb, $16, $17, $18,
        $19, $20, $21,
        NOW(), NOW()
      )
      ON CONFLICT ("githubRepositoryId") DO UPDATE SET
        "owner" = EXCLUDED."owner",
        "name" = EXCLUDED."name",
        "fullName" = EXCLUDED."fullName",
        "description" = EXCLUDED."description",
        "githubUrl" = EXCLUDED."githubUrl",
        "defaultBranch" = EXCLUDED."defaultBranch",
        "primaryLanguage" = EXCLUDED."primaryLanguage",
        "stars" = EXCLUDED."stars",
        "forks" = EXCLUDED."forks",
        "watchers" = EXCLUDED."watchers",
        "openIssuesCount" = EXCLUDED."openIssuesCount",
        "license" = EXCLUDED."license",
        "topics" = EXCLUDED."topics",
        "repositorySize" = EXCLUDED."repositorySize",
        "isArchived" = EXCLUDED."isArchived",
        "isFork" = EXCLUDED."isFork",
        "githubCreatedAt" = EXCLUDED."githubCreatedAt",
        "githubUpdatedAt" = EXCLUDED."githubUpdatedAt",
        "githubPushedAt" = EXCLUDED."githubPushedAt",
        "updatedAt" = NOW()
      RETURNING "id"
    `,
    [
      randomUUID(),
      repository.githubRepositoryId,
      repository.owner,
      repository.name,
      repository.fullName,
      repository.description,
      repository.githubUrl,
      repository.defaultBranch,
      repository.primaryLanguage,
      repository.stars,
      repository.forks,
      repository.watchers,
      repository.openIssuesCount,
      repository.license,
      JSON.stringify(repository.topics),
      repository.repositorySize,
      repository.isArchived,
      repository.isFork,
      repository.githubCreatedAt,
      repository.githubUpdatedAt,
      repository.githubPushedAt,
    ],
  )

  const id = result.rows[0]?.id
  if (!id) throw new Error('PostgreSQL did not return a repository ID.')
  return id
}

async function insertAnalysis(
  client: PoolClient,
  repositoryId: string,
  draft: AnalysisDraft,
): Promise<string> {
  const analysisId = randomUUID()
  await client.query(
    `
      INSERT INTO "RepositoryAnalysis" (
        "id", "repositoryId", "languages", "technologies", "rootStructure",
        "documents", "setup", "contributionReadiness", "scores",
        "analysisVersion", "analysedAt", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3::jsonb, $4::jsonb, $5::jsonb,
        $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb,
        '1.0.0', $10, NOW(), NOW()
      )
    `,
    [
      analysisId,
      repositoryId,
      JSON.stringify(draft.languages),
      JSON.stringify(draft.technologies),
      JSON.stringify(draft.rootStructure),
      JSON.stringify(draft.documents),
      JSON.stringify(draft.setup),
      JSON.stringify(draft.contributionReadiness),
      JSON.stringify(draft.scores),
      draft.analysisMetadata.analysedAt,
    ],
  )
  return analysisId
}

async function upsertIssues(
  client: PoolClient,
  repositoryId: string,
  issues: SuitableIssue[],
): Promise<void> {
  for (const issue of issues) {
    await client.query(
      `
        INSERT INTO "Issue" (
          "id", "githubIssueId", "repositoryId", "number", "title",
          "bodyPreview", "githubUrl", "labels", "state", "author",
          "assignees", "comments", "availabilityStatus",
          "availabilityExplanation", "githubCreatedAt", "githubUpdatedAt",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8::jsonb, $9, $10,
          $11::jsonb, $12, $13,
          $14, $15, $16,
          NOW(), NOW()
        )
        ON CONFLICT ("githubIssueId") DO UPDATE SET
          "repositoryId" = EXCLUDED."repositoryId",
          "number" = EXCLUDED."number",
          "title" = EXCLUDED."title",
          "bodyPreview" = EXCLUDED."bodyPreview",
          "githubUrl" = EXCLUDED."githubUrl",
          "labels" = EXCLUDED."labels",
          "state" = EXCLUDED."state",
          "author" = EXCLUDED."author",
          "assignees" = EXCLUDED."assignees",
          "comments" = EXCLUDED."comments",
          "availabilityStatus" = EXCLUDED."availabilityStatus",
          "availabilityExplanation" = EXCLUDED."availabilityExplanation",
          "githubCreatedAt" = EXCLUDED."githubCreatedAt",
          "githubUpdatedAt" = EXCLUDED."githubUpdatedAt",
          "updatedAt" = NOW()
      `,
      [
        randomUUID(),
        issue.githubIssueId,
        repositoryId,
        issue.number,
        issue.title,
        issue.bodyPreview,
        issue.githubUrl,
        JSON.stringify(issue.labels),
        issue.state,
        issue.author,
        JSON.stringify(issue.assignees),
        issue.comments,
        issue.availabilityStatus,
        issue.availabilityExplanation,
        issue.githubCreatedAt,
        issue.githubUpdatedAt,
      ],
    )
  }
}

export async function persistRepositoryAnalysis(
  draft: AnalysisDraft,
): Promise<RepositoryAnalysisData> {
  const client = await pool.connect().catch(() => {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not connect to PostgreSQL.')
  })

  try {
    await client.query('BEGIN')
    const repositoryId = await upsertRepository(client, draft)
    const analysisId = await insertAnalysis(client, repositoryId, draft)
    await upsertIssues(client, repositoryId, draft.issues)
    await client.query('COMMIT')

    return {
      ...draft,
      analysisMetadata: {
        ...draft.analysisMetadata,
        analysisId,
        persisted: true,
      },
    }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error instanceof AppError) throw error
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not save repository analysis to PostgreSQL.')
  } finally {
    client.release()
  }
}

async function findRepository(owner: string, name: string): Promise<RepositoryRow | null> {
  const result = await pool.query<RepositoryRow>(
    `SELECT * FROM "Repository"
     WHERE LOWER("owner") = LOWER($1) AND LOWER("name") = LOWER($2)
     LIMIT 1`,
    [owner, name],
  )
  return result.rows[0] ?? null
}

function mapIssue(row: IssueRow): SuitableIssue {
  return {
    githubIssueId: row.githubIssueId,
    number: row.number,
    title: row.title,
    bodyPreview: row.bodyPreview,
    githubUrl: row.githubUrl,
    labels: row.labels,
    state: row.state,
    author: row.author,
    assignees: row.assignees,
    comments: row.comments,
    availabilityStatus: row.availabilityStatus,
    availabilityExplanation: row.availabilityExplanation,
    githubCreatedAt: toIso(row.githubCreatedAt),
    githubUpdatedAt: toIso(row.githubUpdatedAt),
  }
}

export async function getStoredRepositoryAnalysis(
  owner: string,
  name: string,
): Promise<RepositoryAnalysisData | null> {
  try {
    const repository = await findRepository(owner, name)
    if (!repository) return null

    const [analysisResult, issuesResult] = await Promise.all([
      pool.query<AnalysisRow>(
        `SELECT * FROM "RepositoryAnalysis"
         WHERE "repositoryId" = $1
         ORDER BY "analysedAt" DESC
         LIMIT 1`,
        [repository.id],
      ),
      pool.query<IssueRow>(
        `SELECT * FROM "Issue"
         WHERE "repositoryId" = $1
         ORDER BY "githubUpdatedAt" DESC
         LIMIT 20`,
        [repository.id],
      ),
    ])

    const analysis = analysisResult.rows[0]
    if (!analysis) return null

    return {
      repository: {
        githubRepositoryId: repository.githubRepositoryId,
        owner: repository.owner,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        githubUrl: repository.githubUrl,
        defaultBranch: repository.defaultBranch,
        primaryLanguage: repository.primaryLanguage,
        stars: repository.stars,
        forks: repository.forks,
        watchers: repository.watchers,
        openIssuesCount: repository.openIssuesCount,
        license: repository.license,
        topics: repository.topics,
        repositorySize: repository.repositorySize,
        isArchived: repository.isArchived,
        isFork: repository.isFork,
        githubCreatedAt: toIso(repository.githubCreatedAt),
        githubUpdatedAt: toIso(repository.githubUpdatedAt),
        githubPushedAt: repository.githubPushedAt ? toIso(repository.githubPushedAt) : null,
      },
      languages: analysis.languages,
      technologies: analysis.technologies,
      rootStructure: analysis.rootStructure,
      documents: analysis.documents,
      setup: analysis.setup,
      contributionReadiness: analysis.contributionReadiness,
      scores: analysis.scores,
      issues: issuesResult.rows.map(mapIssue),
      analysisMetadata: {
        analysisId: analysis.id,
        analysedAt: toIso(analysis.analysedAt),
        source: 'GitHub REST API',
        isAiGenerated: false,
        persisted: true,
      },
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not read repository analysis from PostgreSQL.')
  }
}

export async function getStoredIssues(
  owner: string,
  name: string,
  options: { label?: string; availability?: string; limit: number },
): Promise<SuitableIssue[]> {
  try {
    const repository = await findRepository(owner, name)
    if (!repository) return []

    const values: unknown[] = [repository.id]
    let availabilityClause = ''
    if (options.availability) {
      values.push(options.availability)
      availabilityClause = `AND "availabilityStatus" = $${values.length}`
    }
    values.push(Math.min(options.limit, 100))

    const result = await pool.query<IssueRow>(
      `SELECT * FROM "Issue"
       WHERE "repositoryId" = $1 ${availabilityClause}
       ORDER BY "githubUpdatedAt" DESC
       LIMIT $${values.length}`,
      values,
    )

    return result.rows
      .map(mapIssue)
      .filter((issue) =>
        options.label
          ? issue.labels.some((label) => label.toLowerCase() === options.label?.toLowerCase())
          : true,
      )
  } catch {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not read repository issues from PostgreSQL.')
  }
}

export type { AnalysisScore }
