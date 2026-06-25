import { Router } from 'express'
import {
  getPullRequestTracking,
  getTrackedPullRequests,
  pullRequestSyncBodySchema,
  syncPullRequest,
} from '../controllers/pull-request-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const pullRequestRouter = Router()

pullRequestRouter.get('/', getTrackedPullRequests)
pullRequestRouter.get('/workspaces/:workspaceId', getPullRequestTracking)
pullRequestRouter.post(
  '/workspaces/:workspaceId/sync',
  createRateLimit({ namespace: 'pull-request-sync', windowSeconds: 600, maxRequests: 60 }),
  validateBody(pullRequestSyncBodySchema),
  syncPullRequest,
)
