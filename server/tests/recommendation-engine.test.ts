import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RecommendationCatalogItem } from '../src/data/recommendation-catalog.js'
import { scoreRecommendationCandidate } from '../src/services/recommendation-engine.js'
import type { RecommendationRequest } from '../src/types/recommendation.js'
import type { RecommendationRepositoryBundle } from '../src/services/github-service.js'

const catalog: RecommendationCatalogItem = {
  owner: 'example',
  repository: 'project',
  organizationName: 'Example',
  organizationDescription: 'Example project',
  organizationWebsite: 'https://example.com',
  organizationType: 'Community',
  organizationColor: '#ffffff',
  technologies: ['TypeScript', 'React', 'Node.js'],
  contributionAreas: ['Frontend', 'Bug fixes', 'Testing'],
  difficulty: 'Intermediate',
  setupComplexity: 'Low',
}

const request: RecommendationRequest = {
  username: 'developer',
  skills: [
    { name: 'TypeScript', proficiency: 'Advanced', wantToLearn: false },
    { name: 'React', proficiency: 'Intermediate', wantToLearn: false },
    { name: 'Node.js', proficiency: 'Beginner', wantToLearn: true },
  ],
  contributionPreferences: ['Frontend', 'Bug fixes'],
  availability: {
    hoursPerWeek: 8,
    difficulty: 'Intermediate',
    repositorySize: 'Small',
    organizationType: 'Community',
  },
}

const bundle: RecommendationRepositoryBundle = {
  repository: {
    id: 1,
    name: 'project',
    full_name: 'example/project',
    description: 'A project',
    html_url: 'https://github.com/example/project',
    default_branch: 'main',
    language: 'TypeScript',
    stargazers_count: 100,
    forks_count: 20,
    watchers_count: 100,
    open_issues_count: 8,
    license: { spdx_id: 'MIT', name: 'MIT' },
    topics: ['typescript'],
    size: 20_000,
    archived: false,
    fork: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    owner: { login: 'example' },
  },
  rootContents: [
    {
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      html_url: null,
      download_url: null,
      size: 100,
    },
    {
      name: 'CONTRIBUTING.md',
      path: 'CONTRIBUTING.md',
      type: 'file',
      html_url: null,
      download_url: null,
      size: 100,
    },
  ],
  issues: [
    {
      id: 11,
      number: 3,
      title: 'Starter issue',
      body: null,
      html_url: 'https://github.com/example/project/issues/3',
      labels: [{ name: 'good first issue' }],
      state: 'open',
      user: { login: 'maintainer' },
      assignees: [],
      comments: 0,
      created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    },
  ],
}

describe('scoreRecommendationCandidate', () => {
  it('uses skills, preferences, repository activity and beginner issues', () => {
    const result = scoreRecommendationCandidate(request, catalog, bundle)

    assert.equal(result.fullName, 'example/project')
    assert.equal(result.suitableIssueCount, 1)
    assert.equal(result.repositorySize, 'Small')
    assert.ok(result.matchScore >= 75)
    assert.equal(result.freshIssueCount, 1)
    assert.ok(result.scoreBreakdown.issueFreshness >= 80)
    assert.ok(result.scoreBreakdown.technologyMatch > 60)
    assert.ok(result.whyMatched.some((reason) => reason.includes('TypeScript')))
  })


  it('prioritizes repositories with fresh unassigned issues', () => {
    const fresh = scoreRecommendationCandidate(request, catalog, bundle)
    const stale = scoreRecommendationCandidate(request, catalog, {
      ...bundle,
      issues: bundle.issues.map((issue) => ({
        ...issue,
        updated_at: '2024-01-01T00:00:00Z',
      })),
    })

    assert.ok(fresh.matchScore > stale.matchScore)
    assert.ok(fresh.scoreBreakdown.issueFreshness > stale.scoreBreakdown.issueFreshness)
  })

  it('reports missing technology evidence as a gap', () => {
    const result = scoreRecommendationCandidate(
      { ...request, skills: [{ name: 'Python', proficiency: 'Advanced', wantToLearn: false }] },
      catalog,
      bundle,
    )

    assert.ok(result.gaps.some((gap) => gap.includes('TypeScript')))
    assert.ok(result.matchScore < 75)
  })
})
