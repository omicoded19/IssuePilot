import { Router } from 'express'
import {
  analyzeRepository,
  analyzeRepositoryBodySchema,
  getRepository,
  listRepositoryIssues,
  reanalyzeRepository,
} from '../controllers/repository-controller.js'
import { validateBody } from '../middleware/validate-request.js'

export const repositoryRouter = Router()

repositoryRouter.post('/analyze', validateBody(analyzeRepositoryBodySchema), analyzeRepository)
repositoryRouter.post('/:owner/:repository/reanalyze', reanalyzeRepository)
repositoryRouter.get('/:owner/:repository/issues', listRepositoryIssues)
repositoryRouter.get('/:owner/:repository', getRepository)
