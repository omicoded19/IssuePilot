import { Router } from 'express'
import {
  analyzeDeveloperBodySchema,
  analyzeDeveloperProfile,
  getDeveloperProfile,
} from '../controllers/developer-profile-controller.js'
import { validateBody } from '../middleware/validate-request.js'

export const developerProfileRouter = Router()

developerProfileRouter.post(
  '/analyze',
  validateBody(analyzeDeveloperBodySchema),
  analyzeDeveloperProfile,
)
developerProfileRouter.get('/:username', getDeveloperProfile)
