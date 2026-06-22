import type { RecommendationRequest } from '@/types/recommendation'
import type {
  AvailabilityPreferences,
  ContributionPreference,
  Skill,
} from '@/types/user'

interface RecommendationProfileInput {
  username: string
  skills: Skill[]
  contributionPreferences: ContributionPreference[]
  availability: AvailabilityPreferences
}

export function createRecommendationRequest({
  username,
  skills,
  contributionPreferences,
  availability,
}: RecommendationProfileInput): RecommendationRequest {
  return {
    username,
    skills: skills.map(({ name, proficiency, wantToLearn }) => ({
      name,
      proficiency,
      wantToLearn,
    })),
    contributionPreferences,
    availability,
  }
}
