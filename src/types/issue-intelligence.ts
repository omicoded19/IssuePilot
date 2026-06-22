import type { RecommendationRequest } from './recommendation'
import type {
  ApiRepositoryMetadata,
  IssueAvailability,
  RepositorySetupAnalysis,
} from './repository-analysis'

export type IssueDifficulty =
  | 'Beginner'
  | 'Beginner–Intermediate'
  | 'Intermediate'
  | 'Advanced'

export type IssueContributionType =
  | 'Bug fix'
  | 'Feature'
  | 'Documentation'
  | 'Testing'
  | 'Refactoring'
  | 'UI improvement'
  | 'Developer tooling'
  | 'Other'

export interface IssueScoreBreakdown {
  skillMatch: number
  contributionPreferenceMatch: number
  difficultyFit: number
  availability: number
  repositoryReadiness: number
}

export interface PersonalizedIssueRecommendation {
  githubIssueId: string
  number: number
  title: string
  bodyPreview: string | null
  githubUrl: string
  labels: string[]
  author: string | null
  assignees: string[]
  comments: number
  githubCreatedAt: string
  githubUpdatedAt: string
  availabilityStatus: IssueAvailability
  availabilityExplanation: string
  matchScore: number
  scoreBreakdown: IssueScoreBreakdown
  difficulty: IssueDifficulty
  estimatedTime: string
  contributionType: IssueContributionType
  requiredTechnologies: string[]
  matchedSkills: string[]
  learningSkills: string[]
  reasons: string[]
  warnings: string[]
}

export interface IssueRecommendationData {
  username: string
  repository: {
    owner: string
    name: string
    fullName: string
    githubUrl: string
    defaultBranch: string
  }
  issues: PersonalizedIssueRecommendation[]
  metadata: {
    generatedAt: string
    issuesChecked: number
    issuesReturned: number
    scoringVersion: string
    source: 'Stored GitHub data + deterministic scoring'
    isAiGenerated: false
  }
}

export interface IssueRecommendationRequest extends RecommendationRequest {
  owner: string
  repository: string
}

export interface GitHubIssueComment {
  author: string | null
  body: string
  githubUrl: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceInspectionTarget {
  path: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  exactFile: boolean
}

export type WorkspaceProgressId =
  | 'repository-analysed'
  | 'issue-selected'
  | 'maintainer-contacted'
  | 'repository-forked'
  | 'branch-created'
  | 'change-implemented'
  | 'tests-passed'
  | 'pull-request-opened'
  | 'review-received'
  | 'merged'

export interface WorkspaceProgressStep {
  id: WorkspaceProgressId
  label: string
  completed: boolean
}

export interface ContributionWorkspace {
  id: string
  username: string
  repository: ApiRepositoryMetadata
  issue: PersonalizedIssueRecommendation & {
    fullBody: string | null
    recentComments: GitHubIssueComment[]
  }
  issueSummary: string
  currentBehavior: string
  expectedBehavior: string
  requiredConcepts: string[]
  inspectionTargets: WorkspaceInspectionTarget[]
  suggestedApproach: string[]
  possibleRisks: string[]
  setup: RepositorySetupAnalysis
  gitCommands: Array<{ label: string; command: string }>
  maintainerMessage: string
  pullRequestDescription: string
  testingChecklist: string[]
  pullRequestChecklist: string[]
  progress: WorkspaceProgressStep[]
  personalNotes: string
  metadata: {
    generatedAt: string
    updatedAt: string
    source: 'GitHub REST API + deterministic workspace generator'
    isAiGenerated: false
    persisted: boolean
    uncertaintyNotes: string[]
  }
}

export interface ContributionWorkspaceRequest extends IssueRecommendationRequest {
  issueNumber: number
}

export interface ContributionWorkspaceUpdate {
  progress: WorkspaceProgressStep[]
  personalNotes: string
}
