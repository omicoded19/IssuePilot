import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  loadWorkspacePullRequestTracking,
  synchronizeWorkspacePullRequest,
} from '../services/pull-request-tracking-service.js'
import type { PullRequestSyncRequest } from '../types/pull-request.js'
import { AppError } from '../utils/app-error.js'

export const pullRequestSyncBodySchema = z.object({
  pullRequestUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
})

function workspaceId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value) {
    throw new AppError(400, 'INVALID_WORKSPACE_ID', 'Missing contribution workspace ID.')
  }
  return value
}

export const syncPullRequest: RequestHandler = async (request, response) => {
  const input = response.locals.validatedBody as PullRequestSyncRequest
  const result = await synchronizeWorkspacePullRequest(
    request,
    workspaceId(request.params.workspaceId),
    input,
  )
  response.json({ success: true, data: result })
}

export const getPullRequestTracking: RequestHandler = async (request, response) => {
  const result = await loadWorkspacePullRequestTracking(
    request,
    workspaceId(request.params.workspaceId),
  )
  if (!result) {
    throw new AppError(
      404,
      'PULL_REQUEST_TRACKING_NOT_FOUND',
      'No pull request is being tracked for this workspace yet.',
    )
  }
  response.json({ success: true, data: result })
}
