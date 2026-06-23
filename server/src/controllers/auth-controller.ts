import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import {
  createAuthSession,
  deleteAuthSession,
  findAuthUserBySessionToken,
  upsertAuthUser,
} from '../services/auth-database-service.js'
import {
  createGitHubAuthorizationUrl,
  exchangeGitHubCode,
  fetchAuthenticatedGitHubUser,
} from '../services/github-oauth-service.js'
import { createOpaqueToken, encryptSecret, safeTokenEquals } from '../utils/auth-crypto.js'
import { parseCookies } from '../utils/cookies.js'
import { AppError } from '../utils/app-error.js'

const SESSION_COOKIE = 'issuepilot_session'
const OAUTH_STATE_COOKIE = 'issuepilot_oauth_state'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const OAUTH_STATE_DURATION_MS = 10 * 60 * 1000

function authConfigured(): boolean {
  return Boolean(
    env.GITHUB_OAUTH_CLIENT_ID &&
      env.GITHUB_OAUTH_CLIENT_SECRET &&
      env.GITHUB_OAUTH_CALLBACK_URL &&
      env.AUTH_ENCRYPTION_KEY,
  )
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  }
}

function getClientIp(request: Parameters<RequestHandler>[0]): string | null {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? null
  return request.socket.remoteAddress ?? null
}

export const getAuthStatus: RequestHandler = async (request, response, next) => {
  try {
    const token = parseCookies(request)[SESSION_COOKIE]
    const user = token ? await findAuthUserBySessionToken(token) : null

    response.setHeader('Cache-Control', 'no-store')
    response.json({
      success: true,
      data: {
        configured: authConfigured(),
        authenticated: Boolean(user),
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const startGitHubAuth: RequestHandler = (_request, response, next) => {
  try {
    if (!authConfigured()) {
      throw new AppError(
        503,
        'GITHUB_OAUTH_NOT_CONFIGURED',
        'GitHub sign-in is not configured on this IssuePilot server.',
      )
    }

    const state = createOpaqueToken(24)
    response.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(OAUTH_STATE_DURATION_MS))
    response.redirect(
      createGitHubAuthorizationUrl({
        clientId: env.GITHUB_OAUTH_CLIENT_ID!,
        callbackUrl: env.GITHUB_OAUTH_CALLBACK_URL!,
        state,
      }),
    )
  } catch (error) {
    next(error)
  }
}

export const completeGitHubAuth: RequestHandler = async (request, response) => {
  const redirect = new URL('/auth/callback', env.CLIENT_URL)

  try {
    if (!authConfigured()) {
      redirect.searchParams.set('error', 'oauth_not_configured')
      response.redirect(redirect.toString())
      return
    }

    const code = typeof request.query.code === 'string' ? request.query.code : null
    const state = typeof request.query.state === 'string' ? request.query.state : null
    const oauthError = typeof request.query.error === 'string' ? request.query.error : null
    const storedState = parseCookies(request)[OAUTH_STATE_COOKIE]

    response.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(0))

    if (oauthError) {
      redirect.searchParams.set('error', oauthError)
      response.redirect(redirect.toString())
      return
    }

    if (!code || !state || !storedState || !safeTokenEquals(state, storedState)) {
      redirect.searchParams.set('error', 'invalid_oauth_state')
      response.redirect(redirect.toString())
      return
    }

    const accessToken = await exchangeGitHubCode(code, {
      clientId: env.GITHUB_OAUTH_CLIENT_ID!,
      clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET!,
      callbackUrl: env.GITHUB_OAUTH_CALLBACK_URL!,
    })
    const { user: githubUser, email } = await fetchAuthenticatedGitHubUser(accessToken)
    const encrypted = encryptSecret(accessToken, env.AUTH_ENCRYPTION_KEY!)
    const user = await upsertAuthUser({
      githubUser,
      email,
      encryptedAccessToken: encrypted.encryptedValue,
      accessTokenIv: encrypted.iv,
      accessTokenAuthTag: encrypted.authTag,
    })

    const sessionToken = createOpaqueToken()
    await createAuthSession({
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      userAgent: request.get('user-agent') ?? null,
      ipAddress: getClientIp(request),
    })

    response.cookie(SESSION_COOKIE, sessionToken, cookieOptions(SESSION_DURATION_MS))
    redirect.searchParams.set('status', 'success')
    response.redirect(redirect.toString())
  } catch (error) {
    console.error('GitHub OAuth callback failed:', error)
    redirect.searchParams.set('error', 'github_auth_failed')
    response.redirect(redirect.toString())
  }
}

export const getCurrentAuthUser: RequestHandler = async (request, response, next) => {
  try {
    const token = parseCookies(request)[SESSION_COOKIE]
    if (!token) {
      throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Sign in with GitHub to continue.')
    }

    const user = await findAuthUserBySessionToken(token)
    if (!user) {
      response.clearCookie(SESSION_COOKIE, cookieOptions(0))
      throw new AppError(401, 'SESSION_EXPIRED', 'Your IssuePilot session has expired.')
    }

    response.setHeader('Cache-Control', 'no-store')
    response.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

export const logout: RequestHandler = async (request, response, next) => {
  try {
    const token = parseCookies(request)[SESSION_COOKIE]
    if (token) await deleteAuthSession(token)

    response.clearCookie(SESSION_COOKIE, cookieOptions(0))
    response.json({ success: true, data: { loggedOut: true } })
  } catch (error) {
    next(error)
  }
}
