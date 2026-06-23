import type { RequestHandler } from 'express'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import { getUserAnalytics } from '../services/analytics-service.js'

export const getMyAnalytics: RequestHandler = async (request, response, next) => {
  try {
    const { user } = await requireAuthenticatedGitHubContext(request)
    const analytics = await getUserAnalytics(user.username, user.id)
    response.setHeader('Cache-Control', 'no-store')
    response.json({ success: true, data: analytics })
  } catch (error) {
    next(error)
  }
}
