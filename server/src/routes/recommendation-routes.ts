import { Router } from 'express'
import {
  generateRecommendations,
  getLatestRecommendations,
  recommendationBodySchema,
} from '../controllers/recommendation-controller.js'
import { validateBody } from '../middleware/validate-request.js'

export const recommendationRouter = Router()

recommendationRouter.post(
  '/',
  validateBody(recommendationBodySchema),
  generateRecommendations,
)
recommendationRouter.get('/:username/latest', getLatestRecommendations)
