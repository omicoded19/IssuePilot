import type { Request } from 'express'
import { env } from '../config/env.js'
import { findStoredAuthUserBySessionToken } from './auth-database-service.js'
import type { AuthUser } from '../types/auth.js'
import { AppError } from '../utils/app-error.js'
import { decryptSecret } from '../utils/auth-crypto.js'
import { parseCookies } from '../utils/cookies.js'

const SESSION_COOKIE = 'issuepilot_session'

export interface AuthenticatedGitHubContext {
  user: AuthUser
  accessToken: string
}

export async function requireAuthenticatedGitHubContext(
  request: Request,
): Promise<AuthenticatedGitHubContext> {
  const sessionToken = parseCookies(request)[SESSION_COOKIE]
  if (!sessionToken) {
    throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Sign in with GitHub to track pull requests.')
  }

  if (!env.AUTH_ENCRYPTION_KEY) {
    throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'GitHub authentication is not fully configured.')
  }

  const storedUser = await findStoredAuthUserBySessionToken(sessionToken)
  if (!storedUser) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Your IssuePilot session has expired. Sign in again.')
  }

  const accessToken = decryptSecret(
    storedUser.encryptedAccessToken,
    storedUser.accessTokenIv,
    storedUser.accessTokenAuthTag,
    env.AUTH_ENCRYPTION_KEY,
  )

  return { user: storedUser, accessToken }
}
