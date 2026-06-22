export interface Repository {
  id: string
  name: string
  fullName: string
  organization: string
  organizationId: string
  description: string
  matchScore: number
  stars: number
  forks: number
  primaryLanguage: string
  technologies: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Beginner–Intermediate'
  suitableIssueCount: number
  recentActivity: string
  documentationQuality: number
  setupComplexity: 'Low' | 'Medium' | 'High'
  matchReason: string
  lastUpdated: string
  githubUrl: string
  openIssues: number
  contributors: number
  recommendationSource?: 'real' | 'demo'
  scoreBreakdown?: {
    technologyMatch: number
    contributionPreferenceMatch: number
    difficultyMatch: number
    repositorySizeMatch: number
    organizationTypeMatch: number
    repositoryActivity: number
    beginnerOpportunity: number
  }
  matchReasons?: string[]
  gaps?: string[]
}

export interface RepositoryAnalysis extends Repository {
  overallMatchScore: number
  technologyStack: string[]
  repositoryHealth: number
  maintainerActivityScore: number
  beginnerFriendliness: number
  possibleChallenges: string[]
  architecture: RepositoryArchitecture
  setup: RepositorySetup
  contributionRules: ContributionRules
  prPatterns: PRPatterns
}

export interface RepositoryArchitecture {
  summary: string
  importantFolders: { name: string; description: string; confidence: 'High' | 'Medium' | 'Low' }[]
  importantFiles: { path: string; description: string; confidence: 'High' | 'Medium' | 'Low' }[]
  dataFlow: { from: string; to: string; description: string }[]
  folderTree: FolderNode[]
}

export interface FolderNode {
  name: string
  type: 'folder' | 'file'
  children?: FolderNode[]
}

export interface RepositorySetup {
  nodeVersion: string
  packageManager: string
  installCommand: string
  devCommand: string
  testCommand: string
  lintCommand: string
  dockerRequired: boolean
  envRequired: boolean
  envVariables: string[]
}

export interface ContributionRules {
  readmeSummary: string
  contributingSummary: string
  commitConventions: string
  branchConventions: string
  testingExpectations: string
  prRequirements: string
}

export interface PRPatterns {
  averageReviewTime: string
  typicalPrSize: string
  commonFeedback: string[]
  mergeRate: number
  firstContributionTips: string[]
}
