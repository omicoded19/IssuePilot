import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  generateAndPersistRecommendations,
  getLatestRecommendationRun,
} from '../services/recommendation-service.js'
import { AppError } from '../utils/app-error.js'

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

export const generateRecommendations: RequestHandler = async (_request, response) => {
  const body = response.locals.validatedBody as z.infer<typeof recommendationBodySchema>
  const recommendations = await generateAndPersistRecommendations(body)
  response.status(201).json({ success: true, data: recommendations })
}

export const getLatestRecommendations: RequestHandler = async (request, response) => {
  const parsed = githubUsername.safeParse(request.params.username)
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_GITHUB_USERNAME', 'Enter a valid GitHub username.')
  }

  const recommendations = await getLatestRecommendationRun(parsed.data)
  if (!recommendations) {
    throw new AppError(
      404,
      'RECOMMENDATIONS_NOT_FOUND',
      'No saved recommendations were found for this developer.',
    )
  }

  response.json({ success: true, data: recommendations })
}
