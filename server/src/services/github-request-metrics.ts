import { AsyncLocalStorage } from 'node:async_hooks'

interface GitHubRequestMetricStore {
  requestCount: number
}

const storage = new AsyncLocalStorage<GitHubRequestMetricStore>()

export function recordGitHubRequest(): void {
  const store = storage.getStore()
  if (store) store.requestCount += 1
}

export async function runWithGitHubRequestMetrics<T>(
  operation: () => Promise<T>,
): Promise<{ result: T; requestCount: number }> {
  const store: GitHubRequestMetricStore = { requestCount: 0 }
  const result = await storage.run(store, operation)
  return { result, requestCount: store.requestCount }
}
