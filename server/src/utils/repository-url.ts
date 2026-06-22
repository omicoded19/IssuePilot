import { AppError } from './app-error.js'
import type { RepositoryCoordinates } from '../types/repository.js'

const validSegment = /^[A-Za-z0-9_.-]+$/
const reservedSegments = new Set(['issues', 'pull', 'pulls', 'tree', 'blob', 'commits'])

export function parseRepositoryUrl(input: string): RepositoryCoordinates {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new AppError(400, 'INVALID_REPOSITORY_URL', 'Repository URL is required.')
  }

  let path: string

  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(trimmed)) {
    path = trimmed
  } else {
    const normalized = /^github\.com\//i.test(trimmed) ? `https://${trimmed}` : trimmed
    let url: URL
    try {
      url = new URL(normalized)
    } catch {
      throw new AppError(400, 'INVALID_REPOSITORY_URL', 'Enter a valid GitHub repository URL.')
    }

    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) {
      throw new AppError(400, 'UNSUPPORTED_REPOSITORY_HOST', 'Only github.com repository URLs are supported.')
    }

    if (url.search || url.hash) {
      throw new AppError(400, 'INVALID_REPOSITORY_URL', 'Repository URLs cannot include a query string or fragment.')
    }

    path = url.pathname
  }

  const segments = path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)

  if (segments.length !== 2) {
    throw new AppError(
      400,
      'INVALID_REPOSITORY_URL',
      'Use a repository URL in the form github.com/owner/repository.',
    )
  }

  const owner = segments[0]
  const repository = segments[1]?.replace(/\.git$/i, '')

  if (!owner || !repository || !validSegment.test(owner) || !validSegment.test(repository)) {
    throw new AppError(400, 'INVALID_REPOSITORY_URL', 'The repository owner or name is invalid.')
  }

  if (reservedSegments.has(repository.toLowerCase())) {
    throw new AppError(400, 'INVALID_REPOSITORY_URL', 'Enter the repository URL, not an issue or pull-request URL.')
  }

  return { owner, repository }
}
