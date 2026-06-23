import { env } from '../config/env.js'
import type {
  GitHubContentResponse,
  GitHubIssueResponse,
  GitHubIssueCommentResponse,
  GitHubRepositoryResponse,
} from '../types/github.js'
import type { RepositoryCoordinates } from '../types/repository.js'
import { AppError } from '../utils/app-error.js'
import { recordGitHubRequest } from './github-request-metrics.js'

const GITHUB_API_BASE = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_TEXT_FILE_BYTES = 300_000

export interface RetrievedFile {
  path: string
  size: number
  content: string | null
}

export interface GitHubRepositoryBundle {
  repository: GitHubRepositoryResponse
  languages: Record<string, number>
  rootContents: GitHubContentResponse[]
  githubContents: GitHubContentResponse[]
  files: Map<string, RetrievedFile>
  hasIssueTemplates: boolean
  issues: GitHubIssueResponse[]
}

function createHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'IssuePilot',
  }

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
  }

  return headers
}

async function githubRequest<T>(path: string): Promise<T> {
  recordGitHubRequest()
  let response: Response

  try {
    response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: createHeaders(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new AppError(502, 'GITHUB_TIMEOUT', 'GitHub took too long to respond. Please try again.')
    }
    throw new AppError(502, 'GITHUB_UNAVAILABLE', 'Could not connect to GitHub. Please try again.')
  }

  if (!response.ok) {
    let message = 'GitHub request failed.'
    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? message
    } catch {
      // GitHub occasionally returns an empty or non-JSON error response.
    }

    const rateLimited =
      response.status === 429 ||
      response.headers.get('x-ratelimit-remaining') === '0' ||
      message.toLowerCase().includes('rate limit')

    if (rateLimited) {
      throw new AppError(
        429,
        'GITHUB_RATE_LIMIT',
        'GitHub API rate limit reached. Add a GitHub token or try again later.',
      )
    }

    if (response.status === 404) {
      throw new AppError(404, 'REPOSITORY_NOT_FOUND', 'Repository not found or it is private.')
    }

    if (response.status === 401 || response.status === 403) {
      throw new AppError(403, 'GITHUB_ACCESS_DENIED', 'GitHub denied access to this repository.')
    }

    throw new AppError(502, 'GITHUB_API_ERROR', `GitHub API error: ${message}`)
  }

  return (await response.json()) as T
}

async function optionalGitHubRequest<T>(path: string): Promise<T | null> {
  try {
    return await githubRequest<T>(path)
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

function normalizePath(path: string): string {
  return path.toLowerCase()
}

function decodeContent(entry: GitHubContentResponse): string | null {
  if (!entry.content || entry.encoding !== 'base64' || entry.size > MAX_TEXT_FILE_BYTES) {
    return null
  }

  return Buffer.from(entry.content.replace(/\n/g, ''), 'base64').toString('utf8')
}

async function retrieveFile(
  coordinates: RepositoryCoordinates,
  path: string,
): Promise<RetrievedFile | null> {
  const encodedPath = path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  const result = await optionalGitHubRequest<GitHubContentResponse | GitHubContentResponse[]>(
    `/repos/${encodeURIComponent(coordinates.owner)}/${encodeURIComponent(coordinates.repository)}/contents/${encodedPath}`,
  )

  if (!result || Array.isArray(result)) {
    return null
  }

  return {
    path: result.path,
    size: result.size,
    content: decodeContent(result),
  }
}

const rootFileNames = new Set([
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'dockerfile',
  'docker-compose.yml',
  'compose.yml',
  '.nvmrc',
  '.node-version',
  '.tool-versions',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'pyproject.toml',
  'requirements.txt',
  'cargo.toml',
  'go.mod',
  '.env.example',
  'contributing',
  'contributing.md',
  'code_of_conduct.md',
  'security.md',
])

function isRelevantRootFile(entry: GitHubContentResponse): boolean {
  if (entry.type !== 'file') return false
  const name = entry.name.toLowerCase()
  return name.startsWith('readme') || rootFileNames.has(name)
}

export async function fetchRepositoryBundle(
  coordinates: RepositoryCoordinates,
): Promise<GitHubRepositoryBundle> {
  const owner = encodeURIComponent(coordinates.owner)
  const repository = encodeURIComponent(coordinates.repository)

  const [repositoryData, languages, rootContents, issues] = await Promise.all([
    githubRequest<GitHubRepositoryResponse>(`/repos/${owner}/${repository}`),
    githubRequest<Record<string, number>>(`/repos/${owner}/${repository}/languages`),
    githubRequest<GitHubContentResponse[]>(`/repos/${owner}/${repository}/contents`),
    githubRequest<GitHubIssueResponse[]>(
      `/repos/${owner}/${repository}/issues?state=open&sort=updated&direction=desc&per_page=100`,
    ),
  ])

  const githubDirectory = rootContents.find(
    (entry) => entry.type === 'dir' && entry.name.toLowerCase() === '.github',
  )

  const githubContents = githubDirectory
    ? ((await optionalGitHubRequest<GitHubContentResponse[]>(
        `/repos/${owner}/${repository}/contents/.github`,
      )) ?? [])
    : []

  const relevantPaths = new Set<string>()
  rootContents.filter(isRelevantRootFile).forEach((entry) => relevantPaths.add(entry.path))

  for (const entry of githubContents) {
    const name = entry.name.toLowerCase()
    if (
      entry.type === 'file' &&
      (name === 'contributing.md' ||
        name === 'code_of_conduct.md' ||
        name === 'security.md' ||
        name.startsWith('pull_request_template'))
    ) {
      relevantPaths.add(entry.path)
    }
  }

  const retrieved = await Promise.all(
    [...relevantPaths].map((path) => retrieveFile(coordinates, path)),
  )

  const files = new Map<string, RetrievedFile>()
  for (const file of retrieved) {
    if (file) files.set(normalizePath(file.path), file)
  }

  const hasIssueTemplates = githubContents.some(
    (entry) => entry.name.toLowerCase() === 'issue_template',
  )

  return {
    repository: repositoryData,
    languages,
    rootContents,
    githubContents,
    files,
    hasIssueTemplates,
    issues,
  }
}

export interface DeveloperRepositoryBundleItem {
  repository: import('../types/github.js').GitHubUserRepositoryResponse
  languages: Record<string, number>
  packageManifest: RetrievedFile | null
}

export interface GitHubDeveloperBundle {
  user: import('../types/github.js').GitHubUserResponse
  repositories: DeveloperRepositoryBundleItem[]
  totalPublicRepositories: number
}

function developerRepositoryScore(
  repository: import('../types/github.js').GitHubUserRepositoryResponse,
): number {
  const pushedAt = repository.pushed_at ? Date.parse(repository.pushed_at) : 0
  const recency = pushedAt > 0
    ? Math.max(0, 365 - Math.floor((Date.now() - pushedAt) / 86_400_000))
    : 0
  return repository.stargazers_count * 4 + repository.forks_count * 2 + recency
}

export async function fetchDeveloperBundle(username: string): Promise<GitHubDeveloperBundle> {
  const encodedUsername = encodeURIComponent(username)
  const [user, repositories] = await Promise.all([
    githubRequest<import('../types/github.js').GitHubUserResponse>(`/users/${encodedUsername}`),
    githubRequest<import('../types/github.js').GitHubUserRepositoryResponse[]>(
      `/users/${encodedUsername}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
    ),
  ])

  const selected = repositories
    .filter((repository) => !repository.fork && !repository.archived)
    .sort((a, b) => developerRepositoryScore(b) - developerRepositoryScore(a))
    .slice(0, 12)

  const analysedRepositories = await Promise.all(
    selected.map(async (repository) => {
      const coordinates = {
        owner: repository.owner.login,
        repository: repository.name,
      }
      const owner = encodeURIComponent(coordinates.owner)
      const name = encodeURIComponent(coordinates.repository)
      const [languages, packageManifest] = await Promise.all([
        optionalGitHubRequest<Record<string, number>>(`/repos/${owner}/${name}/languages`),
        retrieveFile(coordinates, 'package.json'),
      ])

      return {
        repository,
        languages: languages ?? {},
        packageManifest,
      }
    }),
  )

  return {
    user,
    repositories: analysedRepositories,
    totalPublicRepositories: user.public_repos,
  }
}

export interface RecommendationRepositoryBundle {
  repository: GitHubRepositoryResponse
  rootContents: GitHubContentResponse[]
  issues: GitHubIssueResponse[]
}

export async function fetchRecommendationRepositoryBundle(
  ownerName: string,
  repositoryName: string,
): Promise<RecommendationRepositoryBundle | null> {
  const owner = encodeURIComponent(ownerName)
  const repository = encodeURIComponent(repositoryName)

  const repositoryData = await optionalGitHubRequest<GitHubRepositoryResponse>(
    `/repos/${owner}/${repository}`,
  )

  if (!repositoryData || repositoryData.archived || repositoryData.fork) {
    return null
  }

  const [rootContents, issues] = await Promise.all([
    optionalGitHubRequest<GitHubContentResponse[]>(
      `/repos/${owner}/${repository}/contents`,
    ),
    optionalGitHubRequest<GitHubIssueResponse[]>(
      `/repos/${owner}/${repository}/issues?state=open&sort=updated&direction=desc&per_page=100`,
    ),
  ])

  return {
    repository: repositoryData,
    rootContents: Array.isArray(rootContents) ? rootContents : [],
    issues: Array.isArray(issues) ? issues : [],
  }
}


export interface GitHubIssueDetailsBundle {
  issue: GitHubIssueResponse
  comments: GitHubIssueCommentResponse[]
}

export async function fetchIssueDetails(
  ownerName: string,
  repositoryName: string,
  issueNumber: number,
): Promise<GitHubIssueDetailsBundle> {
  const owner = encodeURIComponent(ownerName)
  const repository = encodeURIComponent(repositoryName)
  const issue = await githubRequest<GitHubIssueResponse>(
    `/repos/${owner}/${repository}/issues/${issueNumber}`,
  )

  if (issue.pull_request) {
    throw new AppError(400, 'PULL_REQUEST_NOT_ISSUE', 'The selected number belongs to a pull request, not an issue.')
  }

  const comments = issue.comments > 0
    ? await githubRequest<GitHubIssueCommentResponse[]>(
        `/repos/${owner}/${repository}/issues/${issueNumber}/comments?per_page=30`,
      )
    : []

  return { issue, comments }
}
