import { Router } from 'express'
import { getMyAnalytics } from '../controllers/analytics-controller.js'

export const analyticsRouter = Router()

analyticsRouter.get('/me', getMyAnalytics)
