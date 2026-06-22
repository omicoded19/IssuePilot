export interface Organization {
  id: string
  name: string
  slug: string
  description: string
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
  website: string
}
