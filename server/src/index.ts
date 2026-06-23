import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './lib/database.js'
import { closeCacheConnection } from './services/cache-service.js'

const server = app.listen(env.PORT, () => {
  console.log(`IssuePilot API running at http://localhost:${env.PORT}`)
})

async function shutdown(signal: string): Promise<void> {
  console.log(`\nReceived ${signal}. Shutting down IssuePilot API...`)
  server.close(async () => {
    await Promise.all([pool.end(), closeCacheConnection()])
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
