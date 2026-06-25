import { Router } from 'express'
import {
  analyzeRepository,
  analyzeRepositoryBodySchema,
  getRepository,
  listRepositoryIssues,
  reanalyzeRepository,
} from '../controllers/repository-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const repositoryRouter = Router()

repositoryRouter.post(
  '/analyze',
  createRateLimit({ namespace: 'repository-analysis', windowSeconds: 600, maxRequests: 30 }),
  validateBody(analyzeRepositoryBodySchema),
  analyzeRepository,
)
repositoryRouter.post(
  '/:owner/:repository/reanalyze',
  createRateLimit({ namespace: 'repository-reanalysis', windowSeconds: 600, maxRequests: 20 }),
  reanalyzeRepository,
)
repositoryRouter.get('/:owner/:repository/issues', listRepositoryIssues)
repositoryRouter.get('/:owner/:repository', getRepository)
