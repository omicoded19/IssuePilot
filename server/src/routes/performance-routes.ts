import { Router } from 'express'
import {
  getMyPerformance,
  performanceBenchmarkBodySchema,
  runPerformanceBenchmark,
} from '../controllers/performance-controller.js'
import { validateBody } from '../middleware/validate-request.js'

export const performanceRouter = Router()

performanceRouter.get('/me', getMyPerformance)
performanceRouter.post(
  '/benchmark',
  validateBody(performanceBenchmarkBodySchema),
  runPerformanceBenchmark,
)
