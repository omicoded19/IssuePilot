import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type { PerformanceBenchmarkResult } from '../types/performance.js'
import { AppError } from '../utils/app-error.js'

interface PerformanceBenchmarkRow {
  id: string
  owner: string
  repository: string
  coldDurationMs: number
  warmDurationMs: number
  latencyReductionPercent: number
  coldGitHubRequests: number
  warmGitHubRequests: number
  githubRequestReductionPercent: number
  cacheBackend: string
  cacheTtlSeconds: number
  createdAt: Date | string
}

function toResult(row: PerformanceBenchmarkRow): PerformanceBenchmarkResult {
  return {
    id: row.id,
    owner: row.owner,
    repository: row.repository,
    fullName: `${row.owner}/${row.repository}`,
    coldDurationMs: Number(row.coldDurationMs),
    warmDurationMs: Number(row.warmDurationMs),
    latencyReductionPercent: Number(row.latencyReductionPercent),
    coldGitHubRequests: row.coldGitHubRequests,
    warmGitHubRequests: row.warmGitHubRequests,
    githubRequestReductionPercent: Number(row.githubRequestReductionPercent),
    cacheBackend: 'Redis',
    cacheTtlSeconds: row.cacheTtlSeconds,
    createdAt: new Date(row.createdAt).toISOString(),
  }
}

export async function savePerformanceBenchmark(
  authUserId: string,
  benchmark: Omit<PerformanceBenchmarkResult, 'id' | 'fullName' | 'createdAt'>,
): Promise<PerformanceBenchmarkResult> {
  try {
    const id = randomUUID()
    const result = await pool.query<PerformanceBenchmarkRow>(
      `INSERT INTO "PerformanceBenchmark" (
        "id", "authUserId", "owner", "repository",
        "coldDurationMs", "warmDurationMs", "latencyReductionPercent",
        "coldGitHubRequests", "warmGitHubRequests", "githubRequestReductionPercent",
        "cacheBackend", "cacheTtlSeconds", "createdAt"
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        id,
        authUserId,
        benchmark.owner,
        benchmark.repository,
        benchmark.coldDurationMs,
        benchmark.warmDurationMs,
        benchmark.latencyReductionPercent,
        benchmark.coldGitHubRequests,
        benchmark.warmGitHubRequests,
        benchmark.githubRequestReductionPercent,
        benchmark.cacheBackend,
        benchmark.cacheTtlSeconds,
      ],
    )

    const row = result.rows[0]
    if (!row) throw new Error('PostgreSQL did not return the benchmark.')
    return toResult(row)
  } catch (error) {
    console.error('Performance benchmark save failed:', error instanceof Error ? error.message : error)
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not save the performance benchmark.')
  }
}

export async function getPerformanceBenchmarks(
  authUserId: string,
  limit = 10,
): Promise<PerformanceBenchmarkResult[]> {
  try {
    const result = await pool.query<PerformanceBenchmarkRow>(
      `SELECT * FROM "PerformanceBenchmark"
       WHERE "authUserId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [authUserId, limit],
    )
    return result.rows.map(toResult)
  } catch (error) {
    console.error('Performance benchmark query failed:', error instanceof Error ? error.message : error)
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Could not load performance benchmarks.')
  }
}
