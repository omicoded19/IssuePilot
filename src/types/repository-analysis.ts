export type DetectionConfidence = 'high' | 'medium' | 'low'
export type IssueAvailability =
  | 'probably_available'
  | 'possibly_claimed'
  | 'needs_review'

export interface ApiRepositoryMetadata {
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

export interface DetectedTechnology {
  name: string
  category: string
  evidence: string
  confidence: DetectionConfidence
}

export interface RootStructureEntry {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  githubUrl: string
  downloadUrl: string | null
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

export interface RepositorySetupAnalysis {
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

export interface ContributionReadinessAnalysis {
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

export interface AnalysedIssue {
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

export interface RealRepositoryAnalysis {
  repository: ApiRepositoryMetadata
  languages: LanguageBreakdown[]
  technologies: DetectedTechnology[]
  rootStructure: RootStructureEntry[]
  documents: RepositoryDocuments
  setup: RepositorySetupAnalysis
  contributionReadiness: ContributionReadinessAnalysis
  scores: RepositoryScores
  issues: AnalysedIssue[]
  analysisMetadata: {
    analysisId: string
    analysedAt: string
    source: 'GitHub REST API'
    isAiGenerated: false
    persisted: boolean
  }
}
