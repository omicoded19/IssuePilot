import { Router } from 'express'
import {
  analyzeDeveloperBodySchema,
  analyzeDeveloperProfile,
  getDeveloperProfile,
} from '../controllers/developer-profile-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const developerProfileRouter = Router()

developerProfileRouter.post(
  '/analyze',
  createRateLimit({ namespace: 'developer-analysis', windowSeconds: 3600, maxRequests: 12 }),
  validateBody(analyzeDeveloperBodySchema),
  analyzeDeveloperProfile,
)
developerProfileRouter.get('/:username', getDeveloperProfile)
