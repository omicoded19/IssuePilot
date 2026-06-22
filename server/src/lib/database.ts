import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

const useSsl =
  env.DATABASE_SSL ||
  env.DATABASE_URL.includes('sslmode=require') ||
  env.DATABASE_URL.includes('ssl=true')

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message)
})
