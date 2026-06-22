import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createContributionWorkspaceDraft,
  createIssueRecommendationData,
  inferContributionType,
  inferDifficulty,
} from '../src/services/issue-intelligence-engine.js'
import type { GitHubIssueCommentResponse, GitHubIssueResponse } from '../src/types/github.js'
import type { IssueRecommendationRequest } from '../src/types/issue-intelligence.js'
import type { RepositoryAnalysisData, SuitableIssue } from '../src/types/repository.js'

const request: IssueRecommendationRequest = {
  owner: 'example',
  repository: 'project',
  username: 'developer',
  skills: [
    { name: 'TypeScript', proficiency: 'Advanced', wantToLearn: false },
    { name: 'React', proficiency: 'Intermediate', wantToLearn: false },
    { name: 'Jest', proficiency: 'Beginner', wantToLearn: true },
  ],
  contributionPreferences: ['Bug fixes', 'Testing', 'Frontend'],
  availability: {
    hoursPerWeek: 8,
    difficulty: 'Intermediate',
    repositorySize: 'Medium',
    organizationType: 'Community',
  },
}

const storedIssue: SuitableIssue = {
  githubIssueId: '55',
  number: 55,
  title: 'Fix TypeScript validation error and add Jest coverage',
  bodyPreview: 'Validation currently returns the wrong error. Add a regression test.',
  githubUrl: 'https://github.com/example/project/issues/55',
  labels: ['good first issue', 'bug', 'typescript'],
  state: 'open',
  author: 'maintainer',
  assignees: [],
  comments: 2,
  githubCreatedAt: '2026-01-01T00:00:00Z',
  githubUpdatedAt: '2026-01-02T00:00:00Z',
  availabilityStatus: 'probably_available',
  availabilityExplanation: 'No assignee was detected.',
}

const analysis: RepositoryAnalysisData = {
  repository: {
    githubRepositoryId: '1',
    owner: 'example',
    name: 'project',
    fullName: 'example/project',
    description: 'Example project',
    githubUrl: 'https://github.com/example/project',
    defaultBranch: 'main',
    primaryLanguage: 'TypeScript',
    stars: 100,
    forks: 20,
    watchers: 100,
    openIssuesCount: 8,
    license: 'MIT',
    topics: ['typescript'],
    repositorySize: 20_000,
    isArchived: false,
    isFork: false,
    githubCreatedAt: '2024-01-01T00:00:00Z',
    githubUpdatedAt: '2026-01-01T00:00:00Z',
    githubPushedAt: '2026-01-01T00:00:00Z',
  },
  languages: [{ name: 'TypeScript', bytes: 1000, percentage: 100 }],
  technologies: [
    { name: 'TypeScript', category: 'language', evidence: 'GitHub language data', confidence: 'high' },
    { name: 'React', category: 'frontend', evidence: 'package.json', confidence: 'high' },
    { name: 'Jest', category: 'testing', evidence: 'package.json', confidence: 'high' },
  ],
  rootStructure: [
    { name: 'src', path: 'src', type: 'dir', githubUrl: '', downloadUrl: null },
    { name: 'tests', path: 'tests', type: 'dir', githubUrl: '', downloadUrl: null },
    { name: 'README.md', path: 'README.md', type: 'file', githubUrl: '', downloadUrl: null },
    { name: 'CONTRIBUTING.md', path: 'CONTRIBUTING.md', type: 'file', githubUrl: '', downloadUrl: null },
    { name: 'package.json', path: 'package.json', type: 'file', githubUrl: '', downloadUrl: null },
  ],
  documents: {
    readme: { path: 'README.md', exists: true, contentPreview: '# Project', size: 10 },
    contributing: { path: 'CONTRIBUTING.md', exists: true, contentPreview: '# Contributing', size: 10 },
    codeOfConduct: { path: 'CODE_OF_CONDUCT.md', exists: false, contentPreview: null, size: null },
    security: { path: 'SECURITY.md', exists: false, contentPreview: null, size: null },
    pullRequestTemplate: { path: '.github/PULL_REQUEST_TEMPLATE.md', exists: true, contentPreview: null, size: 10 },
    packageManifest: { path: 'package.json', exists: true, contentPreview: '{}', size: 2 },
  },
  setup: {
    packageManager: 'npm',
    nodeVersion: '>=20',
    installCommand: 'npm install',
    developmentCommand: 'npm run dev',
    buildCommand: 'npm run build',
    testCommand: 'npm run test',
    lintCommand: 'npm run lint',
    formatCommand: null,
    typecheckCommand: 'npm run typecheck',
    requiresDocker: false,
    hasEnvironmentExample: false,
    environmentFileNames: [],
    confidenceNotes: [],
  },
  contributionReadiness: {
    hasReadme: true,
    hasContributingGuide: true,
    hasCodeOfConduct: false,
    hasSecurityPolicy: false,
    hasIssueTemplates: true,
    hasPullRequestTemplate: true,
    hasPackageManifest: true,
    hasTests: true,
    hasLintConfiguration: true,
    hasTypeChecking: true,
    hasDockerSetup: false,
    hasEnvironmentExample: false,
  },
  scores: {
    documentationQuality: { value: 85, reasons: ['README'], penalties: [] },
    beginnerFriendliness: { value: 88, reasons: ['Good first issue'], penalties: [] },
    repositoryActivity: { value: 90, reasons: ['Recent push'], penalties: [] },
    setupSimplicity: { value: 80, reasons: ['Scripts detected'], penalties: [] },
    contributionReadiness: { value: 90, reasons: ['Tests and lint'], penalties: [] },
  },
  issues: [storedIssue],
  analysisMetadata: {
    analysisId: 'analysis-1',
    analysedAt: '2026-01-02T00:00:00Z',
    source: 'GitHub REST API',
    isAiGenerated: false,
    persisted: true,
  },
}

const githubIssue: GitHubIssueResponse = {
  id: 55,
  number: 55,
  title: storedIssue.title,
  body: '## Current behavior\nValidation returns a generic error.\n\n## Expected behavior\nReturn the typed validation message and add a test.',
  html_url: storedIssue.githubUrl,
  labels: storedIssue.labels.map((name) => ({ name })),
  state: 'open',
  user: { login: 'maintainer' },
  assignees: [],
  comments: 1,
  created_at: storedIssue.githubCreatedAt,
  updated_at: storedIssue.githubUpdatedAt,
}

const comments: GitHubIssueCommentResponse[] = [
  {
    id: 1,
    body: 'I would like to work on this issue.',
    html_url: `${storedIssue.githubUrl}#issuecomment-1`,
    user: { login: 'contributor' },
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
]

describe('issue intelligence engine', () => {
  it('infers issue type and difficulty from transparent signals', () => {
    assert.equal(inferContributionType(storedIssue), 'Bug fix')
    assert.equal(inferDifficulty(storedIssue), 'Beginner')
  })

  it('ranks issues using skills, preferences and repository readiness', () => {
    const data = createIssueRecommendationData(request, analysis)
    const result = data.issues[0]

    assert.ok(result)
    assert.ok(result.matchScore >= 80)
    assert.ok(result.matchedSkills.includes('TypeScript'))
    assert.ok(result.learningSkills.includes('Jest'))
    assert.equal(result.contributionType, 'Bug fix')
    assert.equal(data.metadata.isAiGenerated, false)
  })

  it('creates a repository-specific workspace and flags a possible claim comment', () => {
    const workspace = createContributionWorkspaceDraft(
      'workspace-1',
      request,
      analysis,
      storedIssue,
      githubIssue,
      comments,
    )

    assert.match(workspace.currentBehavior, /generic error/i)
    assert.match(workspace.expectedBehavior, /typed validation message/i)
    assert.equal(workspace.issue.availabilityStatus, 'needs_review')
    assert.ok(workspace.inspectionTargets.some((target) => target.path === 'CONTRIBUTING.md'))
    assert.ok(workspace.gitCommands.some((command) => command.command.includes('upstream/main')))
    assert.ok(workspace.possibleRisks.some((risk) => risk.includes('contributor')))
  })
})
