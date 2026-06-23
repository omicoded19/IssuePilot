import { Router } from 'express'
import {
  getPullRequestTracking,
  pullRequestSyncBodySchema,
  syncPullRequest,
} from '../controllers/pull-request-controller.js'
import { validateBody } from '../middleware/validate-request.js'

export const pullRequestRouter = Router()

pullRequestRouter.get('/workspaces/:workspaceId', getPullRequestTracking)
pullRequestRouter.post(
  '/workspaces/:workspaceId/sync',
  validateBody(pullRequestSyncBodySchema),
  syncPullRequest,
)
