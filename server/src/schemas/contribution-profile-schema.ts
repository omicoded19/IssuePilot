import { z } from 'zod'

const proficiency = z.enum(['Beginner', 'Intermediate', 'Advanced'])

export const contributionProfileBodySchema = z.object({
  skills: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    proficiency,
    wantToLearn: z.boolean(),
  })).max(60),
  contributionPreferences: z.array(z.string().trim().min(1).max(80)).max(20),
  availability: z.object({
    hoursPerWeek: z.number().int().min(1).max(80),
    difficulty: proficiency,
    repositorySize: z.enum(['Small', 'Medium', 'Large']),
    organizationType: z.enum(['Startup', 'Foundation', 'Community', 'Enterprise']),
  }),
  onboardingComplete: z.boolean(),
})
