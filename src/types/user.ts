export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Skill {
  id: string
  name: string
  proficiency: ProficiencyLevel
  wantToLearn: boolean
}

export interface UserProfile {
  username: string
  displayName: string
  avatarUrl: string
  githubConnected: boolean
  bio: string
  location: string
  publicRepos: number
  followers: number
}

export type ContributionPreference =
  | 'Frontend'
  | 'Backend'
  | 'Full stack'
  | 'Documentation'
  | 'Testing'
  | 'Bug fixes'
  | 'Features'
  | 'UI improvements'
  | 'Developer tools'

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type RepositorySize = 'Small' | 'Medium' | 'Large'

export type OrganizationType = 'Startup' | 'Foundation' | 'Community' | 'Enterprise'

export interface AvailabilityPreferences {
  hoursPerWeek: number
  difficulty: DifficultyLevel
  repositorySize: RepositorySize
  organizationType: OrganizationType
}
