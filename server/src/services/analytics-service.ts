import { buildUserAnalytics } from './analytics-engine.js'
import { getAnalyticsSourceData } from './analytics-database-service.js'

export async function getUserAnalytics(username: string, authUserId: string) {
  const source = await getAnalyticsSourceData(username, authUserId)
  return buildUserAnalytics(username, source)
}
