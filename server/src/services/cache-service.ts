import { createClient, type RedisClientType } from 'redis'
import { env } from '../config/env.js'

type RedisClient = RedisClientType<{}, {}, {}, 3, {}>

export type CacheConnectionStatus = 'disabled' | 'connecting' | 'connected' | 'unavailable'

export interface CacheStatus {
  status: CacheConnectionStatus
  configured: boolean
  backend: 'Redis' | 'none'
  ttlSeconds: number
  lastError: string | null
}

let client: RedisClient | null = null
let connectionPromise: Promise<RedisClient | null> | null = null
let connectionStatus: CacheConnectionStatus = env.REDIS_URL ? 'unavailable' : 'disabled'
let lastError: string | null = null

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Redis error'
}

async function createConnectedClient(): Promise<RedisClient | null> {
  if (!env.REDIS_URL) {
    connectionStatus = 'disabled'
    return null
  }

  connectionStatus = 'connecting'

  if (client?.isOpen) {
    try {
      client.destroy()
    } catch {
      // A stale client should not prevent a fresh connection attempt.
    }
    client = null
  }

  const nextClient = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: 1_500,
      reconnectStrategy: false,
    },
  })

  nextClient.on('error', (error) => {
    connectionStatus = 'unavailable'
    lastError = safeErrorMessage(error)
  })

  try {
    await nextClient.connect()
    client = nextClient
    connectionStatus = 'connected'
    lastError = null
    return nextClient
  } catch (error) {
    connectionStatus = 'unavailable'
    lastError = safeErrorMessage(error)
    try {
      nextClient.destroy()
    } catch {
      // The connection may already be closed after a failed connect attempt.
    }
    return null
  }
}

export async function getCacheClient(): Promise<RedisClient | null> {
  if (!env.REDIS_URL) return null
  if (client?.isReady) return client

  if (!connectionPromise) {
    connectionPromise = createConnectedClient().finally(() => {
      connectionPromise = null
    })
  }

  return connectionPromise
}

export async function getCacheStatus(): Promise<CacheStatus> {
  const connectedClient = await getCacheClient()
  if (connectedClient?.isReady) {
    connectionStatus = 'connected'
  }

  return {
    status: connectionStatus,
    configured: Boolean(env.REDIS_URL),
    backend: env.REDIS_URL ? 'Redis' : 'none',
    ttlSeconds: env.REDIS_CACHE_TTL_SECONDS,
    lastError,
  }
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const connectedClient = await getCacheClient()
  if (!connectedClient) return null

  try {
    const value = await connectedClient.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    connectionStatus = 'unavailable'
    lastError = safeErrorMessage(error)
    return null
  }
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlSeconds = env.REDIS_CACHE_TTL_SECONDS,
): Promise<boolean> {
  const connectedClient = await getCacheClient()
  if (!connectedClient) return false

  try {
    await connectedClient.set(key, JSON.stringify(value), { EX: ttlSeconds })
    return true
  } catch (error) {
    connectionStatus = 'unavailable'
    lastError = safeErrorMessage(error)
    return false
  }
}

export async function deleteCachedValue(key: string): Promise<boolean> {
  const connectedClient = await getCacheClient()
  if (!connectedClient) return false

  try {
    await connectedClient.del(key)
    return true
  } catch (error) {
    connectionStatus = 'unavailable'
    lastError = safeErrorMessage(error)
    return false
  }
}

export async function closeCacheConnection(): Promise<void> {
  if (!client?.isOpen) return
  try {
    await client.quit()
  } finally {
    client = null
    connectionStatus = env.REDIS_URL ? 'unavailable' : 'disabled'
  }
}
