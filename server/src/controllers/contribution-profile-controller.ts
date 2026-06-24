import type { RequestHandler } from 'express'
import { z } from 'zod'
import { contributionProfileBodySchema } from '../schemas/contribution-profile-schema.js'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import {
  getContributionProfile,
  upsertContributionProfile,
} from '../services/contribution-profile-database-service.js'

export const getMyContributionProfile: RequestHandler = async (request, response, next) => {
  try {
    const { user } = await requireAuthenticatedGitHubContext(request)
    const profile = await getContributionProfile(user.id)
    response.setHeader('Cache-Control', 'no-store')
    response.json({ success: true, data: profile })
  } catch (error) {
    next(error)
  }
}

export const saveMyContributionProfile: RequestHandler = async (request, response, next) => {
  try {
    const { user } = await requireAuthenticatedGitHubContext(request)
    const body = response.locals.validatedBody as z.infer<typeof contributionProfileBodySchema>
    const profile = await upsertContributionProfile(user.id, body)
    response.json({ success: true, data: profile })
  } catch (error) {
    next(error)
  }
}
