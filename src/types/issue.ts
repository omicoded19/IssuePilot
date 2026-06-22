export type AvailabilityStatus = 'Available' | 'Probably available' | 'Likely taken' | 'Assigned'

export type ContributionType =
  | 'Bug fix'
  | 'Feature'
  | 'Documentation'
  | 'Testing'
  | 'Refactoring'
  | 'UI improvement'

export interface Issue {
  id: string
  repositoryId: string
  title: string
  number: number
  matchScore: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Beginner–Intermediate'
  estimatedTime: string
  technologies: string[]
  contributionType: ContributionType
  maintainerActivity: string
  availability: AvailabilityStatus
  likelyFiles: string
  repositoryKnowledgeRequired: string
  labels: string[]
  matchReason: string
  hasAssignee: boolean
  hasLinkedPR: boolean
  body?: string
}

export interface WorkspaceData {
  issueId: string
  currentBehavior: string
  expectedBehavior: string
  requiredConcepts: string[]
  likelyRelevantFiles: { path: string; reason: string }[]
  suggestedApproach: string[]
  possibleRisks: string[]
  maintainerInstructions: string
  personalNotes: string
  filesInspected: string[]
  commandsExecuted: string[]
  errorsEncountered: string[]
  maintainerMessagePreview: string
  prDescriptionPreview: string
  testingChecklist: string[]
  prChecklist: string[]
  gitCommands: { label: string; command: string }[]
}

export type WorkspaceStep =
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

export interface WorkspaceStepInfo {
  id: WorkspaceStep
  label: string
  completed: boolean
}
