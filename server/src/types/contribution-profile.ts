import type {
  RecommendationAvailabilityInput,
  RecommendationSkillInput,
} from './recommendation.js'

export interface ContributionProfileData {
  skills: RecommendationSkillInput[]
  contributionPreferences: string[]
  availability: RecommendationAvailabilityInput
  onboardingComplete: boolean
  updatedAt: string
}
