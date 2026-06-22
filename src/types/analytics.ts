export type FlowNodeStatus = 'Completed' | 'Ready' | 'In Progress' | 'Locked' | 'Warning'

export interface FlowNodeData {
  id: string
  label: string
  description: string
  status: FlowNodeStatus
  requiredActions: string[]
  importantInfo: string[]
  checklist: { id: string; label: string; checked: boolean }[]
}

export interface MetricWithTrend {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface AnalyticsData {
  metrics: MetricWithTrend[]
  repositoryMatchesOverTime: ChartDataPoint[]
  contributionActivity: ChartDataPoint[]
  pullRequestStatus: ChartDataPoint[]
  contributionFunnel: ChartDataPoint[]
  technologyDistribution: ChartDataPoint[]
  timeSaved: ChartDataPoint[]
  matchScoreDistribution: ChartDataPoint[]
}

export interface DashboardData {
  metrics: MetricWithTrend[]
  weeklyContributions: ChartDataPoint[]
  contributionFunnel: ChartDataPoint[]
  recentActivity: ActivityItem[]
  currentContribution: CurrentContribution | null
}

export interface ActivityItem {
  id: string
  type: 'analysis' | 'issue' | 'pr' | 'merge'
  title: string
  description: string
  timestamp: string
}

export interface CurrentContribution {
  issueId: string
  issueTitle: string
  repositoryName: string
  progress: number
  currentStep: string
}
