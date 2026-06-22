import type { DashboardData } from '@/types/analytics'

export const dashboardData: DashboardData = {
  metrics: [
    { label: 'Organizations Matched', value: 24, trend: 12.5, trendLabel: 'vs last month' },
    { label: 'Repositories Analysed', value: 146, trend: 18.4, trendLabel: 'vs last month' },
    { label: 'Suitable Issues', value: 38, trend: 24.7, trendLabel: 'vs last month' },
    { label: 'Contributions Started', value: 5, trend: 25, trendLabel: 'vs last month' },
    { label: 'Pull Requests Opened', value: 3, trend: 0, trendLabel: 'vs last month' },
    { label: 'Pull Requests Merged', value: 2, trend: 100, trendLabel: 'vs last month' },
    { label: 'Merge Rate', value: '66.7%', trend: 12.5, trendLabel: 'vs last month' },
    { label: 'Onboarding Time Saved', value: '81%', trend: -82, trendLabel: 'reduction' },
  ],
  weeklyContributions: [
    { name: 'Mon', value: 2, hours: 3 },
    { name: 'Tue', value: 1, hours: 2 },
    { name: 'Wed', value: 3, hours: 5 },
    { name: 'Thu', value: 0, hours: 0 },
    { name: 'Fri', value: 2, hours: 4 },
    { name: 'Sat', value: 4, hours: 6 },
    { name: 'Sun', value: 1, hours: 2 },
  ],
  contributionFunnel: [
    { name: 'Repos Analysed', value: 146 },
    { name: 'Issues Shortlisted', value: 38 },
    { name: 'Contributions Started', value: 5 },
    { name: 'PRs Opened', value: 3 },
    { name: 'PRs Merged', value: 2 },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'analysis',
      title: 'Analysed appwrite/sdk-for-web',
      description: 'Match score: 92%. 8 suitable issues found.',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'issue',
      title: 'Selected issue #487',
      description: 'Improve validation error handling in account service',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      type: 'pr',
      title: 'Opened PR in TanStack/query',
      description: 'feat: add configurable retry delay',
      timestamp: '3 days ago',
    },
    {
      id: '4',
      type: 'merge',
      title: 'PR merged in open-sauced/app',
      description: 'fix: resolve dashboard loading state',
      timestamp: '1 week ago',
    },
    {
      id: '5',
      type: 'analysis',
      title: 'Analysed calcom/cal.com',
      description: 'Match score: 90%. 38 suitable issues found.',
      timestamp: '1 week ago',
    },
  ],
  currentContribution: {
    issueId: 'issue-validation-account',
    issueTitle: 'Improve validation error handling in account service',
    repositoryName: 'appwrite/sdk-for-web',
    progress: 35,
    currentStep: 'Prepare Local Environment',
  },
}
