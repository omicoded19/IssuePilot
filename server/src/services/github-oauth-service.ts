import type { GitHubEmail, GitHubOAuthUser } from '../types/auth.js'
import { AppError } from '../utils/app-error.js'

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_API_URL = 'https://api.github.com'

interface OAuthConfiguration {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

interface GitHubTokenResponse {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

export function createGitHubAuthorizationUrl(input: {
  clientId: string
  callbackUrl: string
  state: string
}): string {
  const url = new URL(GITHUB_AUTHORIZE_URL)
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('redirect_uri', input.callbackUrl)
  url.searchParams.set('scope', 'read:user user:email')
  url.searchParams.set('state', input.state)
  url.searchParams.set('allow_signup', 'true')
  return url.toString()
}

async function githubRequest<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'IssuePilot',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new AppError(
      502,
      'GITHUB_AUTH_PROFILE_FAILED',
      'GitHub authentication succeeded, but the user profile could not be loaded.',
    )
  }

  return response.json() as Promise<T>
}

export async function exchangeGitHubCode(
  code: string,
  configuration: OAuthConfiguration,
): Promise<string> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'IssuePilot',
    },
    body: new URLSearchParams({
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      code,
      redirect_uri: configuration.callbackUrl,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  const payload = (await response.json()) as GitHubTokenResponse
  if (!response.ok || !payload.access_token) {
    throw new AppError(
      502,
      'GITHUB_TOKEN_EXCHANGE_FAILED',
      payload.error_description ?? 'GitHub did not return an access token.',
    )
  }

  return payload.access_token
}

export async function fetchAuthenticatedGitHubUser(
  accessToken: string,
): Promise<{ user: GitHubOAuthUser; email: string | null }> {
  const user = await githubRequest<GitHubOAuthUser>('/user', accessToken)
  if (user.email) return { user, email: user.email }

  const emails = await githubRequest<GitHubEmail[]>('/user/emails', accessToken)
  const preferred =
    emails.find((email) => email.primary && email.verified) ??
    emails.find((email) => email.verified)

  return { user, email: preferred?.email ?? null }
}
