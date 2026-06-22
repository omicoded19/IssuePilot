import assert from 'node:assert/strict'
import test from 'node:test'
import { analyseDeveloperBundle } from '../src/services/developer-profile-analysis-service.js'
import type { GitHubDeveloperBundle } from '../src/services/github-service.js'

function bundle(): GitHubDeveloperBundle {
  return {
    user: {
      id: 1,
      login: 'sample-dev',
      name: 'Sample Dev',
      avatar_url: 'https://example.com/avatar.png',
      html_url: 'https://github.com/sample-dev',
      bio: 'Developer',
      location: 'India',
      company: null,
      blog: '',
      public_repos: 3,
      followers: 10,
      following: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    totalPublicRepositories: 3,
    repositories: [
      {
        repository: {
          id: 10,
          name: 'web-app',
          full_name: 'sample-dev/web-app',
          description: 'A React app',
          html_url: 'https://github.com/sample-dev/web-app',
          default_branch: 'main',
          language: 'TypeScript',
          stargazers_count: 3,
          forks_count: 1,
          watchers_count: 3,
          open_issues_count: 0,
          license: null,
          topics: ['react'],
          size: 100,
          archived: false,
          fork: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          pushed_at: '2026-01-01T00:00:00Z',
          owner: { login: 'sample-dev' },
        },
        languages: { TypeScript: 900, CSS: 100 },
        packageManifest: {
          path: 'package.json',
          size: 100,
          content: JSON.stringify({
            dependencies: { react: '^19.0.0', express: '^5.0.0' },
            devDependencies: { vite: '^8.0.0' },
          }),
        },
      },
    ],
  }
}

test('detects languages and package technologies from developer repositories', () => {
  const result = analyseDeveloperBundle(bundle())

  assert.equal(result.profile.username, 'sample-dev')
  assert.equal(result.languages[0]?.name, 'TypeScript')
  assert.equal(result.languages[0]?.percentage, 90)
  assert.ok(result.technologies.some((technology) => technology.name === 'React'))
  assert.ok(result.technologies.some((technology) => technology.name === 'Express'))
  assert.ok(result.technologies.some((technology) => technology.name === 'Node.js'))
  assert.equal(result.repositories.length, 1)
  assert.equal(result.analysisMetadata.isAiGenerated, false)
})

test('does not invent package technologies when package.json is absent', () => {
  const input = bundle()
  input.repositories[0]!.packageManifest = null
  const result = analyseDeveloperBundle(input)

  assert.equal(result.technologies.some((technology) => technology.name === 'React'), false)
  assert.equal(result.technologies.some((technology) => technology.name === 'Node.js'), false)
  assert.ok(result.technologies.some((technology) => technology.name === 'TypeScript'))
})
