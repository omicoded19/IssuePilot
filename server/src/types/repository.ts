export interface RepositoryCoordinates {
  owner: string
  repository: string
}

export interface RepositoryMetadata {
  githubRepositoryId: string
  owner: string
  name: string
  fullName: string
  description: string | null
  githubUrl: string
  defaultBranch: string
  primaryLanguage: string | null
  stars: number
  forks: number
  watchers: number
  openIssuesCount: number
  license: string | null
  topics: string[]
  repositorySize: number
  isArchived: boolean
  isFork: boolean
  githubCreatedAt: string
  githubUpdatedAt: string
  githubPushedAt: string | null
}

export interface LanguageBreakdown {
  name: string
  bytes: number
  percentage: number
}

export interface RootEntry {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  githubUrl: string
  downloadUrl: string | null
}

export type Confidence = 'high' | 'medium' | 'low'

export interface DetectedTechnology {
  name: string
  category: string
  evidence: string
  confidence: Confidence
}

export interface RepositoryDocument {
  path: string
  exists: boolean
  contentPreview: string | null
  size: number | null
}

export interface RepositoryDocuments {
  readme: RepositoryDocument
  contributing: RepositoryDocument
  codeOfConduct: RepositoryDocument
  security: RepositoryDocument
  pullRequestTemplate: RepositoryDocument
  packageManifest: RepositoryDocument
}

export interface RepositorySetup {
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | null
  nodeVersion: string | null
  installCommand: string | null
  developmentCommand: string | null
  buildCommand: string | null
  testCommand: string | null
  lintCommand: string | null
  formatCommand: string | null
  typecheckCommand: string | null
  requiresDocker: boolean
  hasEnvironmentExample: boolean
  environmentFileNames: string[]
  confidenceNotes: string[]
}

export interface ContributionReadiness {
  hasReadme: boolean
  hasContributingGuide: boolean
  hasCodeOfConduct: boolean
  hasSecurityPolicy: boolean
  hasIssueTemplates: boolean
  hasPullRequestTemplate: boolean
  hasPackageManifest: boolean
  hasTests: boolean
  hasLintConfiguration: boolean
  hasTypeChecking: boolean
  hasDockerSetup: boolean
  hasEnvironmentExample: boolean
}

export interface AnalysisScore {
  value: number
  reasons: string[]
  penalties: string[]
}

export interface RepositoryScores {
  documentationQuality: AnalysisScore
  beginnerFriendliness: AnalysisScore
  repositoryActivity: AnalysisScore
  setupSimplicity: AnalysisScore
  contributionReadiness: AnalysisScore
}

export type IssueAvailability =
  | 'probably_available'
  | 'possibly_claimed'
  | 'needs_review'

export interface SuitableIssue {
  githubIssueId: string
  number: number
  title: string
  bodyPreview: string | null
  githubUrl: string
  labels: string[]
  state: string
  author: string | null
  assignees: string[]
  comments: number
  githubCreatedAt: string
  githubUpdatedAt: string
  availabilityStatus: IssueAvailability
  availabilityExplanation: string
}

export interface RepositoryAnalysisData {
  repository: RepositoryMetadata
  languages: LanguageBreakdown[]
  technologies: DetectedTechnology[]
  rootStructure: RootEntry[]
  documents: RepositoryDocuments
  setup: RepositorySetup
  contributionReadiness: ContributionReadiness
  scores: RepositoryScores
  issues: SuitableIssue[]
  analysisMetadata: {
    analysisId: string
    analysedAt: string
    source: 'GitHub REST API'
    isAiGenerated: false
    persisted: boolean
  }
}

export interface AnalysisDraft
  extends Omit<RepositoryAnalysisData, 'analysisMetadata'> {
  analysisMetadata: Omit<RepositoryAnalysisData['analysisMetadata'], 'analysisId' | 'persisted'>
}
