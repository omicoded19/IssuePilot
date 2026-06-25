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
  following?: number
  profileUrl?: string
  company?: string | null
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
  | 'Accessibility'
  | 'Performance'
  | 'Developer tools'
  | 'API/SDK'
  | 'Data/Database'
  | 'DevOps/CI'
  | 'Mobile'
  | 'Security'
  | 'CLI'
  | 'Localization'
  | 'Curriculum/Education'
  | 'Refactoring'

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type RepositorySize = 'Small' | 'Medium' | 'Large'

export type OrganizationType = 'Startup' | 'Foundation' | 'Community' | 'Enterprise'

export interface AvailabilityPreferences {
  hoursPerWeek: number
  difficulty: DifficultyLevel
  repositorySize: RepositorySize
  organizationType: OrganizationType
}
