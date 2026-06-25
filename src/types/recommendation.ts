import type {
  AvailabilityPreferences,
  ContributionPreference,
  Skill,
} from './user'

export interface RecommendationRequest {
  username: string
  skills: Pick<Skill, 'name' | 'proficiency' | 'wantToLearn'>[]
  contributionPreferences: ContributionPreference[]
  availability: AvailabilityPreferences
}

export interface RecommendationScoreBreakdown {
  technologyMatch: number
  contributionPreferenceMatch: number
  difficultyMatch: number
  repositorySizeMatch: number
  organizationTypeMatch: number
  repositoryActivity: number
  beginnerOpportunity: number
  issueFreshness: number
}

export interface RecommendedRepositoryData {
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  repositorySize: 'Small' | 'Medium' | 'Large'
  suitableIssueCount: number
  freshIssueCount: number
  latestIssueUpdatedAt: string | null
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

export interface RecommendedOrganizationData {
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  organizationSize: 'Small' | 'Medium' | 'Large'
  repositoryIds: string[]
  dataSource: 'GitHub REST API + deterministic scoring'
}

export interface RecommendationData {
  username: string
  organizations: RecommendedOrganizationData[]
  repositories: RecommendedRepositoryData[]
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
