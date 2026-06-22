import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyseRepositoryBundle } from '../src/services/repository-analysis-service.js'
import type { GitHubRepositoryBundle } from '../src/services/github-service.js'

function bundle(): GitHubRepositoryBundle {
  const packageJson = JSON.stringify({
    engines: { node: '>=20' },
    scripts: { dev: 'vite', build: 'tsc && vite build', test: 'node --test', lint: 'eslint .' },
    dependencies: { react: '^19.0.0', express: '^5.0.0' },
    devDependencies: { typescript: '^5.0.0', vite: '^7.0.0' },
  })

  return {
    repository: {
      id: 1,
      name: 'demo',
      full_name: 'issuepilot/demo',
      description: 'Demo repository',
      html_url: 'https://github.com/issuepilot/demo',
      default_branch: 'main',
      language: 'TypeScript',
      stargazers_count: 10,
      forks_count: 2,
      subscribers_count: 3,
      watchers_count: 10,
      open_issues_count: 1,
      license: { spdx_id: 'MIT', name: 'MIT License' },
      topics: ['react'],
      size: 100,
      archived: false,
      fork: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
      owner: { login: 'issuepilot' },
    },
    languages: { TypeScript: 900, JavaScript: 100 },
    rootContents: [
      { name: 'README.md', path: 'README.md', type: 'file', html_url: '', download_url: null, size: 10 },
      { name: 'CONTRIBUTING.md', path: 'CONTRIBUTING.md', type: 'file', html_url: '', download_url: null, size: 10 },
      { name: 'package.json', path: 'package.json', type: 'file', html_url: '', download_url: null, size: packageJson.length },
      { name: 'package-lock.json', path: 'package-lock.json', type: 'file', html_url: '', download_url: null, size: 10 },
      { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file', html_url: '', download_url: null, size: 10 },
      { name: 'tests', path: 'tests', type: 'dir', html_url: '', download_url: null, size: 0 },
    ],
    githubContents: [],
    files: new Map([
      ['readme.md', { path: 'README.md', size: 10, content: '# Demo' }],
      ['contributing.md', { path: 'CONTRIBUTING.md', size: 10, content: '# Contributing' }],
      ['package.json', { path: 'package.json', size: packageJson.length, content: packageJson }],
    ]),
    hasIssueTemplates: true,
    issues: [
      {
        id: 99,
        number: 4,
        title: 'Improve docs',
        body: 'Clarify setup.',
        html_url: 'https://github.com/issuepilot/demo/issues/4',
        labels: [{ name: 'good first issue' }],
        state: 'open',
        user: { login: 'maintainer' },
        assignees: [],
        comments: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ],
  }
}

describe('analyseRepositoryBundle', () => {
  it('detects technologies and package scripts from evidence', () => {
    const result = analyseRepositoryBundle(bundle())
    const names = result.technologies.map((technology) => technology.name)

    assert.ok(names.includes('React'))
    assert.ok(names.includes('Express'))
    assert.ok(names.includes('TypeScript'))
    assert.equal(result.setup.packageManager, 'npm')
    assert.equal(result.setup.developmentCommand, 'npm run dev')
    assert.equal(result.setup.testCommand, 'npm run test')
  })

  it('calculates transparent scores and issue availability', () => {
    const result = analyseRepositoryBundle(bundle())

    assert.ok(result.scores.documentationQuality.value > 50)
    assert.ok(result.scores.beginnerFriendliness.reasons.length > 0)
    assert.equal(result.issues[0]?.availabilityStatus, 'probably_available')
  })
})
