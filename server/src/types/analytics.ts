export interface AnalyticsMetric {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
}

export interface AnalyticsChartPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface AnalyticsActivityItem {
  id: string
  type: 'profile' | 'recommendation' | 'workspace' | 'pull_request' | 'merge'
  title: string
  description: string
  occurredAt: string
}

export interface UserAnalyticsData {
  username: string
  metrics: AnalyticsMetric[]
  repositoryMatchesOverTime: AnalyticsChartPoint[]
  contributionActivity: AnalyticsChartPoint[]
  pullRequestStatus: AnalyticsChartPoint[]
  contributionFunnel: AnalyticsChartPoint[]
  technologyDistribution: AnalyticsChartPoint[]
  timeSaved: AnalyticsChartPoint[]
  matchScoreDistribution: AnalyticsChartPoint[]
  workspaceProgress: AnalyticsChartPoint[]
  recentActivity: AnalyticsActivityItem[]
  metadata: {
    generatedAt: string
    periodDays: number
    dataSource: 'PostgreSQL activity records'
    isEstimatedTimeSaved: true
    timeSavedFormula: string
    notes: string[]
  }
}

export interface ProfileAnalyticsRow {
  id: string
  repositoriesAnalysed: number
  technologies: Array<{
    name: string
    repositoryCount?: number
  }>
  analysedAt: string
}

export interface RecommendationAnalyticsRow {
  id: string
  candidateRepositoriesChecked: number
  repositoriesReturned: number
  organizationsReturned: number
  repositories: Array<{
    fullName?: string
    matchScore?: number
  }>
  generatedAt: string
}

export interface WorkspaceAnalyticsRow {
  id: string
  workspace: {
    repository?: { fullName?: string }
    issue?: { number?: number; title?: string; matchScore?: number }
  }
  progress: Array<{ id: string; label?: string; completed: boolean }>
  createdAt: string
  updatedAt: string
}

export interface PullRequestAnalyticsRow {
  id: string
  status: string
  reviewDecision: string
  snapshot: {
    pullRequest?: {
      number?: number
      title?: string
      githubUrl?: string
      merged?: boolean
      status?: string
    } | null
    repository?: { fullName?: string }
  }
  lastSyncedAt: string
}

export interface AnalyticsSourceData {
  profiles: ProfileAnalyticsRow[]
  recommendations: RecommendationAnalyticsRow[]
  workspaces: WorkspaceAnalyticsRow[]
  pullRequests: PullRequestAnalyticsRow[]
}
