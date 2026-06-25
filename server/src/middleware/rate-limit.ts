import { createHash } from 'node:crypto'
import type { Request, RequestHandler } from 'express'
import { getCacheClient } from '../services/cache-service.js'
import { parseCookies } from '../utils/cookies.js'

interface RateLimitOptions {
  namespace: string
  windowSeconds: number
  maxRequests: number
}

interface RateLimitState {
  count: number
  resetAt: number
}

const SESSION_COOKIE = 'issuepilot_session'
const memoryLimits = new Map<string, RateLimitState>()
let requestsSinceCleanup = 0

function hashIdentifier(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32)
}

function getRequestIdentifier(request: Request): string {
  const sessionToken = parseCookies(request)[SESSION_COOKIE]

  if (sessionToken) {
    return `session:${hashIdentifier(sessionToken)}`
  }

  const address =
    request.ip ??
    request.socket.remoteAddress ??
    'unknown'

  return `ip:${hashIdentifier(address)}`
}

function consumeMemoryLimit(
  key: string,
  windowSeconds: number,
): RateLimitState {
  const now = Date.now()
  const existing = memoryLimits.get(key)

  if (!existing || existing.resetAt <= now) {
    const state: RateLimitState = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    }

    memoryLimits.set(key, state)
    return state
  }

  existing.count += 1
  return existing
}

function cleanExpiredMemoryLimits(): void {
  requestsSinceCleanup += 1

  if (requestsSinceCleanup < 250) {
    return
  }

  requestsSinceCleanup = 0
  const now = Date.now()

  for (const [key, state] of memoryLimits) {
    if (state.resetAt <= now) {
      memoryLimits.delete(key)
    }
  }
}

async function consumeRedisLimit(
  key: string,
  windowSeconds: number,
): Promise<RateLimitState | null> {
  const client = await getCacheClient()

  if (!client) {
    return null
  }

  try {
    const count = await client.incr(key)

    if (count === 1) {
      await client.expire(key, windowSeconds)
    }

    let ttlSeconds = await client.ttl(key)

    if (ttlSeconds < 0) {
      await client.expire(key, windowSeconds)
      ttlSeconds = windowSeconds
    }

    return {
      count,
      resetAt: Date.now() + ttlSeconds * 1000,
    }
  } catch {
    return null
  }
}

export function createRateLimit(
  options: RateLimitOptions,
): RequestHandler {
  if (!options.namespace.trim()) {
    throw new Error('Rate-limit namespace cannot be empty.')
  }

  if (
    !Number.isInteger(options.windowSeconds) ||
    options.windowSeconds <= 0
  ) {
    throw new Error(
      'Rate-limit windowSeconds must be a positive integer.',
    )
  }

  if (
    !Number.isInteger(options.maxRequests) ||
    options.maxRequests <= 0
  ) {
    throw new Error(
      'Rate-limit maxRequests must be a positive integer.',
    )
  }

  return async (request, response, next) => {
    try {
      cleanExpiredMemoryLimits()

      const identifier = getRequestIdentifier(request)
      const key =
        `issuepilot:rate-limit:` +
        `${options.namespace}:` +
        identifier

      const state =
        (await consumeRedisLimit(
          key,
          options.windowSeconds,
        )) ??
        consumeMemoryLimit(
          key,
          options.windowSeconds,
        )

      const remaining = Math.max(
        0,
        options.maxRequests - state.count,
      )

      response.setHeader(
        'RateLimit-Limit',
        String(options.maxRequests),
      )
      response.setHeader(
        'RateLimit-Remaining',
        String(remaining),
      )
      response.setHeader(
        'RateLimit-Reset',
        String(Math.ceil(state.resetAt / 1000)),
      )

      if (state.count > options.maxRequests) {
        const retryAfter = Math.max(
          1,
          Math.ceil(
            (state.resetAt - Date.now()) / 1000,
          ),
        )

        response.setHeader(
          'Retry-After',
          String(retryAfter),
        )
        response.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message:
              'Too many requests. Please try again later.',
          },
        })
        return
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
