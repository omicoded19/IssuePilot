import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  getStoredIssues,
  getStoredRepositoryAnalysis,
} from '../services/repository-database-service.js'
import { analyseAndPersistRepositoryWithTelemetry } from '../services/repository-service.js'
import { AppError } from '../utils/app-error.js'
import { parseRepositoryUrl } from '../utils/repository-url.js'

export const analyzeRepositoryBodySchema = z.object({
  repositoryUrl: z.string().trim().min(1),
})

const issueQuerySchema = z.object({
  label: z.string().trim().min(1).optional(),
  availability: z
    .enum(['probably_available', 'possibly_claimed', 'needs_review'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const analyzeRepository: RequestHandler = async (_request, response) => {
  const body = response.locals.validatedBody as z.infer<typeof analyzeRepositoryBodySchema>
  const coordinates = parseRepositoryUrl(body.repositoryUrl)
  const execution = await analyseAndPersistRepositoryWithTelemetry(coordinates)
  response.setHeader('X-IssuePilot-Cache', execution.telemetry.cacheStatus)
  response.setHeader('X-GitHub-Requests', String(execution.telemetry.githubRequestCount))
  response.setHeader('Server-Timing', `issuepilot;dur=${execution.telemetry.durationMs}`)
  response.status(201).json({ success: true, data: execution.analysis })
}

function requiredParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== 'string' || !value) {
    throw new AppError(400, 'INVALID_ROUTE_PARAMETER', `Missing ${name} route parameter.`)
  }
  return value
}

export const getRepository: RequestHandler = async (request, response) => {
  const owner = requiredParam(request.params.owner, 'owner')
  const repository = requiredParam(request.params.repository, 'repository')
  const analysis = await getStoredRepositoryAnalysis(owner, repository)

  if (!analysis) {
    throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'This repository has not been analysed yet.')
  }

  response.json({ success: true, data: analysis })
}

export const reanalyzeRepository: RequestHandler = async (request, response) => {
  const coordinates = {
    owner: requiredParam(request.params.owner, 'owner'),
    repository: requiredParam(request.params.repository, 'repository'),
  }
  const execution = await analyseAndPersistRepositoryWithTelemetry(coordinates, { forceRefresh: true })
  response.setHeader('X-IssuePilot-Cache', execution.telemetry.cacheStatus)
  response.setHeader('X-GitHub-Requests', String(execution.telemetry.githubRequestCount))
  response.setHeader('Server-Timing', `issuepilot;dur=${execution.telemetry.durationMs}`)
  response.status(201).json({ success: true, data: execution.analysis })
}

export const listRepositoryIssues: RequestHandler = async (request, response) => {
  const query = issueQuerySchema.safeParse(request.query)
  if (!query.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Issue filters are invalid.', query.error.flatten())
  }

  const issues = await getStoredIssues(
    requiredParam(request.params.owner, 'owner'),
    requiredParam(request.params.repository, 'repository'),
    query.data,
  )

  response.json({ success: true, data: issues })
}
