import { recommendationCatalog } from '../data/recommendation-catalog.js'
import type {
  RecommendationData,
  RecommendationRequest,
  RecommendedRepository,
} from '../types/recommendation.js'
import { AppError } from '../utils/app-error.js'
import { fetchRecommendationRepositoryBundle } from './github-service.js'
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
  const results = await mapWithConcurrency(
    recommendationCatalog,
    4,
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
    recommendationCatalog,
  )
  return persistRecommendationRun(request, draft)
}

export { getLatestRecommendationRun }
