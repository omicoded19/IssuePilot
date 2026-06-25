import { recommendationCatalog } from '../data/recommendation-catalog.js'
import type {
  RecommendationData,
  RecommendationRequest,
  RecommendedRepository,
} from '../types/recommendation.js'
import { AppError } from '../utils/app-error.js'
import { fetchRecommendationRepositoryBundle } from './github-service.js'
import { discoverRecommendationCatalog } from './recommendation-discovery-service.js'
import {
  createRecommendationDraft,
  scoreRecommendationCandidate,
} from './recommendation-engine.js'
import {
  getLatestRecommendationRun,
  persistRecommendationRun,
} from './recommendation-database-service.js'

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
  const output = new Array<TOutput>(items.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      output[index] = await mapper(items[index] as TInput)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  )
  return output
}

export async function generateAndPersistRecommendations(
  request: RecommendationRequest,
): Promise<RecommendationData> {
  const discoveredCatalog = await discoverRecommendationCatalog(request)
  const candidatesByRepository = new Map(
    recommendationCatalog.map((candidate) => [
      `${candidate.owner}/${candidate.repository}`.toLowerCase(),
      candidate,
    ]),
  )

  for (const candidate of discoveredCatalog) {
    const key = `${candidate.owner}/${candidate.repository}`.toLowerCase()
    if (!candidatesByRepository.has(key)) candidatesByRepository.set(key, candidate)
  }

  const candidateCatalog = [...candidatesByRepository.values()]
  const results = await mapWithConcurrency(
    candidateCatalog,
    5,
    async (candidate): Promise<RecommendedRepository | null> => {
      const bundle = await fetchRecommendationRepositoryBundle(
        candidate.owner,
        candidate.repository,
      )
      if (!bundle) return null
      return scoreRecommendationCandidate(request, candidate, bundle)
    },
  )

  const repositories = results.filter(
    (repository): repository is RecommendedRepository => repository !== null,
  )

  if (repositories.length === 0) {
    throw new AppError(
      502,
      'RECOMMENDATIONS_UNAVAILABLE',
      'GitHub did not return any candidate repositories for recommendation.',
    )
  }

  const draft = createRecommendationDraft(
    request,
    repositories,
    candidateCatalog,
  )
  return persistRecommendationRun(request, draft)
}

export { getLatestRecommendationRun }
