import type { RepositoryAnalysisData, RepositoryCoordinates } from '../types/repository.js'
import { fetchRepositoryBundle } from './github-service.js'
import { analyseRepositoryBundle } from './repository-analysis-service.js'
import {
  getStoredRepositoryAnalysis,
  persistRepositoryAnalysis,
} from './repository-database-service.js'

export async function analyseAndPersistRepository(
  coordinates: RepositoryCoordinates,
): Promise<RepositoryAnalysisData> {
  const bundle = await fetchRepositoryBundle(coordinates)
  const analysis = analyseRepositoryBundle(bundle)
  return persistRepositoryAnalysis(analysis)
}

export { getStoredRepositoryAnalysis }
