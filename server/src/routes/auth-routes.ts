import { Router } from 'express'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'
import {
  getMyContributionProfile,
  saveMyContributionProfile,
} from '../controllers/contribution-profile-controller.js'
import { contributionProfileBodySchema } from '../schemas/contribution-profile-schema.js'
import {
  completeGitHubAuth,
  deleteMyAccount,
  exportMyAccountData,
  getAuthStatus,
  getCurrentAuthUser,
  logout,
  startGitHubAuth,
} from '../controllers/auth-controller.js'

export const authRouter = Router()

authRouter.get('/status', getAuthStatus)
authRouter.get(
  '/github/start',
  createRateLimit({ namespace: 'oauth-start', windowSeconds: 600, maxRequests: 20 }),
  startGitHubAuth,
)
authRouter.get('/github/callback', completeGitHubAuth)
authRouter.get('/me', getCurrentAuthUser)
authRouter.post('/logout', logout)
authRouter.get('/data-export', exportMyAccountData)
authRouter.delete('/account', deleteMyAccount)

authRouter.get('/contribution-profile', getMyContributionProfile)
authRouter.put(
  '/contribution-profile',
  validateBody(contributionProfileBodySchema),
  saveMyContributionProfile,
)
