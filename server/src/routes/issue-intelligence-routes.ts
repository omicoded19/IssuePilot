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

export const issueIntelligenceRouter = Router()

issueIntelligenceRouter.post(
  '/recommend',
  validateBody(issueRecommendationBodySchema),
  recommendIssues,
)
issueIntelligenceRouter.post(
  '/workspace',
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
