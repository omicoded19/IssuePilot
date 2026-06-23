import type {
  AnalyticsActivityItem,
  AnalyticsChartPoint,
  AnalyticsMetric,
  AnalyticsSourceData,
  UserAnalyticsData,
} from '../types/analytics.js'

const PERIOD_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function toDate(value: string): Date {
  return new Date(value)
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round((numerator / denominator) * 100)
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function trend(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return round(((current - previous) / previous) * 100)
}

function isWithin(value: string, start: Date, end: Date): boolean {
  const date = toDate(value)
  return date >= start && date < end
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short' })
}

function buildMonthBuckets(now: Date, count: number): Array<{ key: string; name: string; start: Date; end: Date }> {
  const buckets = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    buckets.push({ key: monthKey(start), name: monthLabel(start), start, end })
  }
  return buckets
}

function buildWeekBuckets(now: Date, count: number): Array<{ name: string; start: Date; end: Date }> {
  const currentWeekStart = new Date(now)
  currentWeekStart.setHours(0, 0, 0, 0)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())

  return Array.from({ length: count }, (_, index) => {
    const weeksAgo = count - 1 - index
    const start = new Date(currentWeekStart.getTime() - weeksAgo * 7 * DAY_MS)
    const end = new Date(start.getTime() + 7 * DAY_MS)
    return { name: `W${index + 1}`, start, end }
  })
}

function matchScoreDistribution(scores: number[]): AnalyticsChartPoint[] {
  const buckets = [
    { name: '90-100%', min: 90, max: 100 },
    { name: '80-89%', min: 80, max: 89.999 },
    { name: '70-79%', min: 70, max: 79.999 },
    { name: '60-69%', min: 60, max: 69.999 },
    { name: '<60%', min: 0, max: 59.999 },
  ]

  return buckets.map((bucket) => ({
    name: bucket.name,
    value: scores.filter((score) => score >= bucket.min && score <= bucket.max).length,
  }))
}

function buildRecentActivity(source: AnalyticsSourceData): AnalyticsActivityItem[] {
  const activities: AnalyticsActivityItem[] = []

  for (const profile of source.profiles) {
    activities.push({
      id: `profile-${profile.id}`,
      type: 'profile',
      title: 'GitHub profile analysed',
      description: `${profile.repositoriesAnalysed} public repositories were used as skill evidence.`,
      occurredAt: profile.analysedAt,
    })
  }

  for (const run of source.recommendations) {
    activities.push({
      id: `recommendation-${run.id}`,
      type: 'recommendation',
      title: 'Repository recommendations generated',
      description: `${run.repositoriesReturned} matches returned from ${run.candidateRepositoriesChecked} candidates.`,
      occurredAt: run.generatedAt,
    })
  }

  for (const workspace of source.workspaces) {
    const repository = workspace.workspace.repository?.fullName ?? 'a repository'
    const issueNumber = workspace.workspace.issue?.number
    activities.push({
      id: `workspace-${workspace.id}`,
      type: 'workspace',
      title: 'Contribution workspace started',
      description: `${repository}${issueNumber ? ` issue #${issueNumber}` : ''}.`,
      occurredAt: workspace.createdAt,
    })
  }

  for (const tracking of source.pullRequests) {
    const pullRequest = tracking.snapshot.pullRequest
    const merged = tracking.status === 'merged' || Boolean(pullRequest?.merged)
    activities.push({
      id: `pull-request-${tracking.id}`,
      type: merged ? 'merge' : 'pull_request',
      title: merged ? 'Pull request merged' : 'Pull request tracked',
      description: pullRequest?.title ?? `Pull request #${pullRequest?.number ?? 'unknown'}`,
      occurredAt: tracking.lastSyncedAt,
    })
  }

  return activities
    .sort((a, b) => toDate(b.occurredAt).getTime() - toDate(a.occurredAt).getTime())
    .slice(0, 10)
}

export function buildUserAnalytics(
  username: string,
  source: AnalyticsSourceData,
  now = new Date(),
): UserAnalyticsData {
  const currentStart = new Date(now.getTime() - PERIOD_DAYS * DAY_MS)
  const previousStart = new Date(now.getTime() - PERIOD_DAYS * 2 * DAY_MS)

  const repositoryScores = source.recommendations.flatMap((run) =>
    run.repositories
      .map((repository) => Number(repository.matchScore))
      .filter((score) => Number.isFinite(score)),
  )
  const issueScores = source.workspaces
    .map((workspace) => Number(workspace.workspace.issue?.matchScore))
    .filter((score) => Number.isFinite(score))

  const repositoriesEvaluated = source.recommendations.reduce(
    (sum, run) => sum + run.candidateRepositoriesChecked,
    0,
  )
  const repositoriesRecommended = source.recommendations.reduce(
    (sum, run) => sum + run.repositoriesReturned,
    0,
  )
  const organizationsRecommended = source.recommendations.reduce(
    (sum, run) => sum + run.organizationsReturned,
    0,
  )
  const trackedPullRequests = source.pullRequests.length
  const mergedPullRequests = source.pullRequests.filter(
    (tracking) => tracking.status === 'merged' || tracking.snapshot.pullRequest?.merged,
  ).length
  const completedProgressSteps = source.workspaces.reduce(
    (sum, workspace) => sum + workspace.progress.filter((step) => step.completed).length,
    0,
  )
  const totalProgressSteps = source.workspaces.reduce(
    (sum, workspace) => sum + workspace.progress.length,
    0,
  )
  const activeContributions = source.workspaces.filter(
    (workspace) => !workspace.progress.some((step) => step.id === 'merged' && step.completed),
  ).length

  const currentProfiles = source.profiles.filter((row) => isWithin(row.analysedAt, currentStart, now)).length
  const previousProfiles = source.profiles.filter((row) => isWithin(row.analysedAt, previousStart, currentStart)).length
  const currentCandidates = source.recommendations
    .filter((row) => isWithin(row.generatedAt, currentStart, now))
    .reduce((sum, row) => sum + row.candidateRepositoriesChecked, 0)
  const previousCandidates = source.recommendations
    .filter((row) => isWithin(row.generatedAt, previousStart, currentStart))
    .reduce((sum, row) => sum + row.candidateRepositoriesChecked, 0)
  const currentWorkspaces = source.workspaces.filter((row) => isWithin(row.createdAt, currentStart, now)).length
  const previousWorkspaces = source.workspaces.filter((row) => isWithin(row.createdAt, previousStart, currentStart)).length
  const currentPullRequests = source.pullRequests.filter((row) => isWithin(row.lastSyncedAt, currentStart, now)).length
  const previousPullRequests = source.pullRequests.filter((row) => isWithin(row.lastSyncedAt, previousStart, currentStart)).length

  const estimatedMinutesSaved = repositoriesEvaluated * 2 + source.workspaces.length * 30
  const metrics: AnalyticsMetric[] = [
    { label: 'Profile Analyses', value: source.profiles.length, trend: trend(currentProfiles, previousProfiles), trendLabel: '30d' },
    { label: 'Repositories Evaluated', value: repositoriesEvaluated, trend: trend(currentCandidates, previousCandidates), trendLabel: '30d' },
    { label: 'Repositories Recommended', value: repositoriesRecommended },
    { label: 'Organizations Recommended', value: organizationsRecommended },
    { label: 'Contributions Started', value: source.workspaces.length, trend: trend(currentWorkspaces, previousWorkspaces), trendLabel: '30d' },
    { label: 'Active Contributions', value: activeContributions },
    { label: 'Pull Requests Tracked', value: trackedPullRequests, trend: trend(currentPullRequests, previousPullRequests), trendLabel: '30d' },
    { label: 'Pull Requests Merged', value: mergedPullRequests },
    { label: 'Merge Success Rate', value: `${percentage(mergedPullRequests, trackedPullRequests)}%` },
    { label: 'Average Repository Match', value: `${average(repositoryScores)}%` },
    { label: 'Average Issue Match', value: `${average(issueScores)}%` },
    { label: 'Contribution Completion', value: `${percentage(completedProgressSteps, totalProgressSteps)}%` },
  ]

  const months = buildMonthBuckets(now, 6)
  const repositoryMatchesOverTime = months.map((bucket) => {
    const matches = source.recommendations
      .filter((run) => isWithin(run.generatedAt, bucket.start, bucket.end))
      .reduce((sum, run) => sum + run.repositoriesReturned, 0)
    return { name: bucket.name, value: matches, matches }
  })

  const weeks = buildWeekBuckets(now, 8)
  const contributionActivity = weeks.map((bucket) => {
    const workspaces = source.workspaces.filter((row) => isWithin(row.createdAt, bucket.start, bucket.end)).length
    const pullRequests = source.pullRequests.filter((row) => isWithin(row.lastSyncedAt, bucket.start, bucket.end)).length
    const contributions = workspaces + pullRequests
    return { name: bucket.name, value: contributions, contributions }
  })

  const statusOrder = ['merged', 'approved', 'changes_requested', 'in_review', 'draft', 'open', 'closed']
  const pullRequestStatus = statusOrder
    .map((status) => ({
      name: status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      value: source.pullRequests.filter((tracking) => tracking.status === status).length,
    }))
    .filter((point) => point.value > 0)

  const latestProfile = [...source.profiles].sort(
    (a, b) => toDate(b.analysedAt).getTime() - toDate(a.analysedAt).getTime(),
  )[0]
  const technologyDistribution = (latestProfile?.technologies ?? [])
    .map((technology) => ({
      name: technology.name,
      value: Math.max(technology.repositoryCount ?? 1, 1),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  let cumulativeHours = 0
  const timeSaved = months.map((bucket) => {
    const candidateCount = source.recommendations
      .filter((run) => isWithin(run.generatedAt, bucket.start, bucket.end))
      .reduce((sum, run) => sum + run.candidateRepositoriesChecked, 0)
    const workspaceCount = source.workspaces.filter((row) => isWithin(row.createdAt, bucket.start, bucket.end)).length
    cumulativeHours += (candidateCount * 2 + workspaceCount * 30) / 60
    const hours = round(cumulativeHours)
    return { name: bucket.name, value: hours, hours }
  })

  const progressOrder = [
    'repository-analysed',
    'issue-selected',
    'maintainer-contacted',
    'repository-forked',
    'branch-created',
    'change-implemented',
    'tests-passed',
    'pull-request-opened',
    'review-received',
    'merged',
  ]
  const workspaceProgress = progressOrder.map((stepId) => {
    const matchingSteps = source.workspaces
      .flatMap((workspace) => workspace.progress)
      .filter((step) => step.id === stepId)
    return {
      name: matchingSteps[0]?.label ?? stepId.replaceAll('-', ' '),
      value: matchingSteps.filter((step) => step.completed).length,
    }
  })

  return {
    username,
    metrics,
    repositoryMatchesOverTime,
    contributionActivity,
    pullRequestStatus,
    contributionFunnel: [
      { name: 'Profiles', value: source.profiles.length },
      { name: 'Repos Evaluated', value: repositoriesEvaluated },
      { name: 'Recommended', value: repositoriesRecommended },
      { name: 'Started', value: source.workspaces.length },
      { name: 'PR Opened', value: trackedPullRequests },
      { name: 'Merged', value: mergedPullRequests },
    ],
    technologyDistribution,
    timeSaved,
    matchScoreDistribution: matchScoreDistribution(repositoryScores),
    workspaceProgress,
    recentActivity: buildRecentActivity(source),
    metadata: {
      generatedAt: now.toISOString(),
      periodDays: PERIOD_DAYS,
      dataSource: 'PostgreSQL activity records',
      isEstimatedTimeSaved: true,
      timeSavedFormula: '2 minutes per evaluated repository + 30 minutes per generated contribution workspace',
      notes: [
        'All totals come from records created by this IssuePilot installation.',
        'Recommendation and issue match scores are deterministic product scores, not machine-learning accuracy metrics.',
        `Estimated research time saved is ${round(estimatedMinutesSaved / 60)} hours using the documented formula.`,
      ],
    },
  }
}
