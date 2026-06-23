import type { RequestHandler } from 'express'
import { z } from 'zod'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import {
  getPerformanceDashboard,
  runRepositoryPerformanceBenchmark,
} from '../services/performance-service.js'

export const performanceBenchmarkBodySchema = z.object({
  repositoryUrl: z.string().trim().min(1),
})

export const getMyPerformance: RequestHandler = async (request, response, next) => {
  try {
    const { user } = await requireAuthenticatedGitHubContext(request)
    const data = await getPerformanceDashboard(user.id)
    response.setHeader('Cache-Control', 'no-store')
    response.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const runPerformanceBenchmark: RequestHandler = async (request, response, next) => {
  try {
    const { user } = await requireAuthenticatedGitHubContext(request)
    const body = response.locals.validatedBody as z.infer<typeof performanceBenchmarkBodySchema>
    const data = await runRepositoryPerformanceBenchmark(user.id, body.repositoryUrl)
    response.status(201).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
