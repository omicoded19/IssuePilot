import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  generateAndPersistRecommendations,
  getLatestRecommendationRun,
} from '../services/recommendation-service.js'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import { AppError } from '../utils/app-error.js'
import { assertAuthenticatedUsername } from '../utils/auth-ownership.js'

const githubUsername = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(/^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/, 'Enter a valid GitHub username.')

const skillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  wantToLearn: z.boolean(),
})

const availabilitySchema = z.object({
  hoursPerWeek: z.number().int().min(1).max(80),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  repositorySize: z.enum(['Small', 'Medium', 'Large']),
  organizationType: z.enum(['Startup', 'Foundation', 'Community', 'Enterprise']),
})

export const recommendationBodySchema = z.object({
  username: githubUsername,
  skills: z.array(skillSchema).min(1).max(40),
  contributionPreferences: z.array(z.string().trim().min(1).max(60)).max(20),
  availability: availabilitySchema,
})

export const generateRecommendations: RequestHandler = async (request, response) => {
  const body = response.locals.validatedBody as z.infer<typeof recommendationBodySchema>
  const { user } = await requireAuthenticatedGitHubContext(request)
  assertAuthenticatedUsername(body.username, user.username)
  const recommendations = await generateAndPersistRecommendations({ ...body, username: user.username })
  response.status(201).json({ success: true, data: recommendations })
}

export const getLatestRecommendations: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const parsed = githubUsername.safeParse(request.params.username)
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_GITHUB_USERNAME', 'Enter a valid GitHub username.')
  }

  assertAuthenticatedUsername(parsed.data, user.username)
  const recommendations = await getLatestRecommendationRun(user.username)
  if (!recommendations) {
    throw new AppError(
      404,
      'RECOMMENDATIONS_NOT_FOUND',
      'No saved recommendations were found for this developer.',
    )
  }

  response.json({ success: true, data: recommendations })
}
