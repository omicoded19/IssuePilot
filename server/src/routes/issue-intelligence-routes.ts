import { Router } from 'express'
import {
  createWorkspace,
  getWorkspace,
  issueRecommendationBodySchema,
  recommendIssues,
  updateWorkspace,
  workspaceBodySchema,
  workspaceUpdateBodySchema,
} from '../controllers/issue-intelligence-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const issueIntelligenceRouter = Router()

issueIntelligenceRouter.post(
  '/recommend',
  createRateLimit({ namespace: 'issue-recommendations', windowSeconds: 600, maxRequests: 30 }),
  validateBody(issueRecommendationBodySchema),
  recommendIssues,
)
issueIntelligenceRouter.post(
  '/workspace',
  createRateLimit({ namespace: 'workspace-create', windowSeconds: 600, maxRequests: 30 }),
  validateBody(workspaceBodySchema),
  createWorkspace,
)
issueIntelligenceRouter.get(
  '/workspace/:username/:owner/:repository/:issueNumber',
  getWorkspace,
)
issueIntelligenceRouter.patch(
  '/workspace/:workspaceId',
  validateBody(workspaceUpdateBodySchema),
  updateWorkspace,
)
