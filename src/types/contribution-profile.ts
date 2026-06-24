import type {
  AvailabilityPreferences,
  ContributionPreference,
  ProficiencyLevel,
} from './user'

export interface ContributionProfileSkill {
  name: string
  proficiency: ProficiencyLevel
  wantToLearn: boolean
}

export interface ContributionProfileData {
  skills: ContributionProfileSkill[]
  contributionPreferences: ContributionPreference[]
  availability: AvailabilityPreferences
  onboardingComplete: boolean
  updatedAt: string
}

export type ContributionProfileInput = Omit<ContributionProfileData, 'updatedAt'>
