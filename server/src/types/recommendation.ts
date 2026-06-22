import type { SuggestedProficiency } from './developer-profile.js'

export type RecommendationDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type RecommendationRepositorySize = 'Small' | 'Medium' | 'Large'
export type RecommendationOrganizationType = 'Startup' | 'Foundation' | 'Community' | 'Enterprise'

export interface RecommendationSkillInput {
  name: string
  proficiency: SuggestedProficiency
  wantToLearn: boolean
}

export interface RecommendationAvailabilityInput {
  hoursPerWeek: number
  difficulty: RecommendationDifficulty
  repositorySize: RecommendationRepositorySize
  organizationType: RecommendationOrganizationType
}

export interface RecommendationRequest {
  username: string
  skills: RecommendationSkillInput[]
  contributionPreferences: string[]
  availability: RecommendationAvailabilityInput
}

export interface RecommendationScoreBreakdown {
  technologyMatch: number
  contributionPreferenceMatch: number
  difficultyMatch: number
  repositorySizeMatch: number
  organizationTypeMatch: number
  repositoryActivity: number
  beginnerOpportunity: number
}

export interface RecommendedRepository {
  id: string
  owner: string
  name: string
  fullName: string
  organization: string
  organizationSlug: string
  description: string
  githubUrl: string
  matchScore: number
  scoreBreakdown: RecommendationScoreBreakdown
  stars: number
  forks: number
  primaryLanguage: string
  technologies: string[]
  difficulty: RecommendationDifficulty
  repositorySize: RecommendationRepositorySize
  suitableIssueCount: number
  openIssues: number
  recentActivity: string
  documentationQuality: number
  setupComplexity: 'Low' | 'Medium' | 'High'
  matchReason: string
  whyMatched: string[]
  gaps: string[]
  lastUpdated: string
  topics: string[]
  dataSource: 'GitHub REST API + deterministic scoring'
}

export interface RecommendedOrganization {
  id: string
  name: string
  slug: string
  description: string
  website: string
  logoInitials: string
  logoColor: string
  matchScore: number
  technologyMatch: number
  beginnerFriendliness: number
  maintainerActivity: number
  suitableRepositories: number
  beginnerFriendlyIssues: number
  averageResponseTime: string
  matchReason: string
  languages: string[]
  frameworks: string[]
  difficulty: RecommendationDifficulty
  organizationSize: RecommendationRepositorySize
  repositoryIds: string[]
  dataSource: 'GitHub REST API + deterministic scoring'
}

export interface RecommendationData {
  username: string
  organizations: RecommendedOrganization[]
  repositories: RecommendedRepository[]
  metadata: {
    recommendationId: string
    generatedAt: string
    candidateRepositoriesChecked: number
    repositoriesReturned: number
    organizationsReturned: number
    scoringVersion: string
    persisted: boolean
    notes: string[]
  }
}

export interface RecommendationDraft extends Omit<RecommendationData, 'metadata'> {
  metadata: Omit<RecommendationData['metadata'], 'recommendationId' | 'persisted'>
}
