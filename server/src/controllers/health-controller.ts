import type { RequestHandler } from 'express'
import { pool } from '../lib/database.js'
import { AppError } from '../utils/app-error.js'

export const healthCheck: RequestHandler = async (_request, response) => {
  try {
    await pool.query('SELECT 1')
  } catch {
    throw new AppError(503, 'DATABASE_UNAVAILABLE', 'IssuePilot API is running, but PostgreSQL is unavailable.')
  }

  response.json({
    success: true,
    message: 'IssuePilot API is running',
    database: 'connected',
    timestamp: new Date().toISOString(),
  })
}
