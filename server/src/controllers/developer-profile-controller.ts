import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  analyseAndPersistDeveloperProfile,
  getStoredDeveloperProfileAnalysis,
} from '../services/developer-profile-service.js'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import { AppError } from '../utils/app-error.js'
import { assertAuthenticatedUsername } from '../utils/auth-ownership.js'

const githubUsername = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(
    /^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/,
    'Enter a valid GitHub username.',
  )

export const analyzeDeveloperBodySchema = z.object({
  username: githubUsername,
})

export const analyzeDeveloperProfile: RequestHandler = async (request, response) => {
  const body = response.locals.validatedBody as z.infer<
    typeof analyzeDeveloperBodySchema
  >
  const { user } = await requireAuthenticatedGitHubContext(request)
  assertAuthenticatedUsername(body.username, user.username)
  const analysis = await analyseAndPersistDeveloperProfile(user.username)
  response.status(201).json({ success: true, data: analysis })
}

export const getDeveloperProfile: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const parsed = githubUsername.safeParse(request.params.username)
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_GITHUB_USERNAME', 'Enter a valid GitHub username.')
  }

  assertAuthenticatedUsername(parsed.data, user.username)
  const analysis = await getStoredDeveloperProfileAnalysis(user.username)
  if (!analysis) {
    throw new AppError(
      404,
      'PROFILE_ANALYSIS_NOT_FOUND',
      'This GitHub profile has not been analysed yet.',
    )
  }

  response.json({ success: true, data: analysis })
}
