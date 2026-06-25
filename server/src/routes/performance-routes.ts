import { Router } from 'express'
import {
  getMyPerformance,
  performanceBenchmarkBodySchema,
  runPerformanceBenchmark,
} from '../controllers/performance-controller.js'
import { validateBody } from '../middleware/validate-request.js'
import { createRateLimit } from '../middleware/rate-limit.js'

export const performanceRouter = Router()

performanceRouter.get('/me', getMyPerformance)
performanceRouter.post(
  '/benchmark',
  createRateLimit({ namespace: 'performance-benchmark', windowSeconds: 3600, maxRequests: 12 }),
  validateBody(performanceBenchmarkBodySchema),
  runPerformanceBenchmark,
)
