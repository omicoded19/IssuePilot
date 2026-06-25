import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { parseRepositoryRouteId } from '@/services/repository-api'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { RealRepositoryAnalysisPage } from './RealRepositoryAnalysisPage'

export function RepositoryAnalysisPage() {
  const { repositoryId = '' } = useParams<{ repositoryId: string }>()
  const coordinates = parseRepositoryRouteId(repositoryId)
  const { currentAnalysis, status, error, loadStored } =
    useRepositoryAnalysisStore()
  const requestedRouteRef = useRef<string | null>(null)

  const currentMatchesRoute =
    coordinates !== null &&
    currentAnalysis?.repository.owner.toLowerCase() ===
      coordinates.owner.toLowerCase() &&
    currentAnalysis.repository.name.toLowerCase() ===
      coordinates.repository.toLowerCase()

  useEffect(() => {
    if (!coordinates || currentMatchesRoute) return

    const routeKey = `${coordinates.owner}/${coordinates.repository}`.toLowerCase()
    if (requestedRouteRef.current === routeKey) return
    requestedRouteRef.current = routeKey

    void loadStored(coordinates.owner, coordinates.repository).catch(() => {
      // The store exposes a safe error state below.
    })
  }, [coordinates, currentMatchesRoute, loadStored])

  if (!coordinates) {
    return (
      <div className="glass-card mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Repository route is invalid</h1>
        <p className="mt-3 text-sm text-slate-400">
          Open a repository from your live recommendations or analyse one manually.
        </p>
        <a
          href="/repositories"
          className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Go to repositories
        </a>
      </div>
    )
  }

  if (status === 'loading' || (!currentMatchesRoute && status === 'idle')) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-6">
          <p className="text-sm text-cyan-300">Loading stored repository analysis…</p>
        </div>
        <LoadingSkeleton lines={7} />
      </div>
    )
  }

  if (!currentMatchesRoute || !currentAnalysis) {
    return (
      <div className="glass-card mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Analysis unavailable</h1>
        <p className="mt-3 text-sm text-slate-400">
          {error ?? 'This repository has not been analysed yet.'}
        </p>
        <a
          href="/"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Analyse a repository
        </a>
      </div>
    )
  }

  return <RealRepositoryAnalysisPage analysis={currentAnalysis} />
}
