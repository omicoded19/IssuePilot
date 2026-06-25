import { Router } from 'express'
import {
  generateRecommendations,
  getLatestRecommendations,
  recommendationBodySchema,
} from '../controllers/recommendation-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const recommendationRouter = Router()

recommendationRouter.post(
  '/',
  createRateLimit({ namespace: 'recommendations', windowSeconds: 600, maxRequests: 20 }),
  validateBody(recommendationBodySchema),
  generateRecommendations,
)
recommendationRouter.get('/:username/latest', getLatestRecommendations)
