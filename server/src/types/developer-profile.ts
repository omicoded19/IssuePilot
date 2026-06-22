import type { Confidence } from './repository.js'

export type SuggestedProficiency = 'Beginner' | 'Intermediate' | 'Advanced'

export interface DeveloperProfileMetadata {
  githubUserId: string
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  publicRepos: number
  followers: number
  following: number
  githubCreatedAt: string
  githubUpdatedAt: string
}

export interface DeveloperLanguageSignal {
  name: string
  bytes: number
  percentage: number
  repositoryCount: number
  repositories: string[]
}

export interface DeveloperTechnologySignal {
  name: string
  category: string
  repositoryCount: number
  repositories: string[]
  evidence: string[]
  confidence: Confidence
  suggestedProficiency: SuggestedProficiency
}

export interface AnalysedDeveloperRepository {
  githubRepositoryId: string
  name: string
  fullName: string
  description: string | null
  githubUrl: string
  primaryLanguage: string | null
  stars: number
  forks: number
  topics: string[]
  pushedAt: string | null
  packageManifestFound: boolean
}

export interface DeveloperProfileAnalysisData {
  profile: DeveloperProfileMetadata
  languages: DeveloperLanguageSignal[]
  technologies: DeveloperTechnologySignal[]
  repositories: AnalysedDeveloperRepository[]
  analysisMetadata: {
    analysisId: string
    analysedAt: string
    repositoriesAnalysed: number
    totalPublicRepositories: number
    source: 'GitHub REST API'
    isAiGenerated: false
    persisted: boolean
    notes: string[]
  }
}

export interface DeveloperProfileDraft
  extends Omit<DeveloperProfileAnalysisData, 'analysisMetadata'> {
  analysisMetadata: Omit<
    DeveloperProfileAnalysisData['analysisMetadata'],
    'analysisId' | 'persisted'
  >
}
