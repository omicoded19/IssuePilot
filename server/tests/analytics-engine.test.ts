import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildUserAnalytics } from '../src/services/analytics-engine.js'
import type { AnalyticsSourceData } from '../src/types/analytics.js'

const now = new Date('2026-06-24T12:00:00.000Z')

const source: AnalyticsSourceData = {
  profiles: [
    {
      id: 'profile-1',
      repositoriesAnalysed: 8,
      technologies: [
        { name: 'TypeScript', repositoryCount: 5 },
        { name: 'React', repositoryCount: 3 },
      ],
      analysedAt: '2026-06-20T12:00:00.000Z',
    },
  ],
  recommendations: [
    {
      id: 'run-1',
      candidateRepositoriesChecked: 20,
      repositoriesReturned: 5,
      organizationsReturned: 3,
      repositories: [
        { fullName: 'one/repo', matchScore: 90 },
        { fullName: 'two/repo', matchScore: 80 },
      ],
      generatedAt: '2026-06-21T12:00:00.000Z',
    },
  ],
  workspaces: [
    {
      id: 'workspace-1',
      workspace: {
        repository: { fullName: 'one/repo' },
        issue: { number: 10, title: 'Fix test', matchScore: 75 },
      },
      progress: [
        { id: 'repository-analysed', label: 'Repository analysed', completed: true },
        { id: 'issue-selected', label: 'Issue selected', completed: true },
        { id: 'merged', label: 'Merged', completed: false },
      ],
      createdAt: '2026-06-22T12:00:00.000Z',
      updatedAt: '2026-06-22T12:00:00.000Z',
    },
  ],
  pullRequests: [
    {
      id: 'tracking-1',
      status: 'merged',
      reviewDecision: 'approved',
      snapshot: {
        repository: { fullName: 'one/repo' },
        pullRequest: {
          number: 4,
          title: 'Fix test behavior',
          merged: true,
          status: 'merged',
        },
      },
      lastSyncedAt: '2026-06-23T12:00:00.000Z',
    },
  ],
}

describe('buildUserAnalytics', () => {
  it('calculates real totals, averages, and funnel values', () => {
    const analytics = buildUserAnalytics('omicoded19', source, now)

    assert.equal(analytics.username, 'omicoded19')
    assert.equal(analytics.metrics.find((metric) => metric.label === 'Repositories Evaluated')?.value, 20)
    assert.equal(analytics.metrics.find((metric) => metric.label === 'Merge Success Rate')?.value, '100%')
    assert.equal(analytics.metrics.find((metric) => metric.label === 'Average Repository Match')?.value, '85%')
    assert.equal(analytics.metrics.find((metric) => metric.label === 'Average Issue Match')?.value, '75%')
    assert.equal(analytics.contributionFunnel.at(-1)?.value, 1)
  })

  it('handles an empty account without inventing activity', () => {
    const analytics = buildUserAnalytics(
      'empty-user',
      { profiles: [], recommendations: [], workspaces: [], pullRequests: [] },
      now,
    )

    assert.equal(analytics.metrics.find((metric) => metric.label === 'Contributions Started')?.value, 0)
    assert.equal(analytics.metrics.find((metric) => metric.label === 'Merge Success Rate')?.value, '0%')
    assert.deepEqual(analytics.recentActivity, [])
    assert.deepEqual(analytics.pullRequestStatus, [])
  })
})
