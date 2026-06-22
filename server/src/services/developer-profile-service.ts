import type { DeveloperProfileAnalysisData } from '../types/developer-profile.js'
import { fetchDeveloperBundle } from './github-service.js'
import { AppError } from '../utils/app-error.js'
import { analyseDeveloperBundle } from './developer-profile-analysis-service.js'
import {
  getStoredDeveloperProfileAnalysis,
  persistDeveloperProfileAnalysis,
} from './developer-profile-database-service.js'

export async function analyseAndPersistDeveloperProfile(
  username: string,
): Promise<DeveloperProfileAnalysisData> {
  try {
    const bundle = await fetchDeveloperBundle(username)
    const analysis = analyseDeveloperBundle(bundle)
    return persistDeveloperProfileAnalysis(analysis)
  } catch (error) {
    if (error instanceof AppError && error.code === 'REPOSITORY_NOT_FOUND') {
      throw new AppError(404, 'GITHUB_USER_NOT_FOUND', 'GitHub user not found.')
    }
    throw error
  }
}

export { getStoredDeveloperProfileAnalysis }
