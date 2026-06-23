import { Router } from 'express'
import {
  completeGitHubAuth,
  getAuthStatus,
  getCurrentAuthUser,
  logout,
  startGitHubAuth,
} from '../controllers/auth-controller.js'

export const authRouter = Router()

authRouter.get('/status', getAuthStatus)
authRouter.get('/github/start', startGitHubAuth)
authRouter.get('/github/callback', completeGitHubAuth)
authRouter.get('/me', getCurrentAuthUser)
authRouter.post('/logout', logout)
