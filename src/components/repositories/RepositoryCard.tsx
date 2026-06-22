import { useState } from 'react'
import { Bookmark, GitFork, LoaderCircle, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MatchScoreRing } from '@/components/common/MatchScoreRing'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { createRepositoryRouteId } from '@/services/repository-api'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { useSavedStore } from '@/store/savedStore'
import type { Repository } from '@/types/repository'
import { cn } from '@/lib/cn'

interface RepositoryCardProps {
  repository: Repository
  viewMode?: 'grid' | 'list'
  className?: string
}

export function RepositoryCard({ repository, viewMode = 'grid', className }: RepositoryCardProps) {
  const navigate = useNavigate()
  const [analysing, setAnalysing] = useState(false)
  const { toggleRepository, isRepositorySaved } = useSavedStore()
  const analyzeRepository = useRepositoryAnalysisStore((state) => state.analyze)
  const saved = isRepositorySaved(repository.id)

  const route = `/repositories/${repository.id}`

  const handleAnalyze = async () => {
    if (repository.recommendationSource !== 'real') {
      navigate(route)
      return
    }

    setAnalysing(true)
    try {
      const analysis = await analyzeRepository(repository.githubUrl)
      navigate(
        `/repositories/${createRepositoryRouteId(
          analysis.repository.owner,
          analysis.repository.name,
        )}`,
      )
    } finally {
      setAnalysing(false)
    }
  }

  if (viewMode === 'list') {
    return (
      <div className={cn('glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-500/20 transition-all', className)}>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            className="font-medium text-white hover:text-cyan-300 transition-colors text-left"
          >
            {repository.fullName}
          </button>
          <p className="text-xs text-slate-500 mt-0.5">{repository.organization}</p>
          <p className="text-sm text-slate-400 mt-1 line-clamp-1">{repository.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {repository.technologies.slice(0, 4).map((technology) => (
              <TechnologyBadge key={technology} name={technology} variant="outline" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <RepoStats stars={repository.stars} forks={repository.forks} language={repository.primaryLanguage} />
          <MatchScoreRing score={repository.matchScore} size={48} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleRepository(repository.id)}
              aria-label={saved ? 'Unsave repository' : 'Save repository'}
              className={cn('p-2 rounded-lg border transition-colors', saved ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-slate-400 hover:border-white/20')}
            >
              <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
            </button>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={analysing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {analysing && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
              {analysing ? 'Analysing' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('glass-card p-5 hover:border-indigo-500/20 transition-all hover:glow-indigo flex flex-col', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            className="font-semibold text-white hover:text-cyan-300 transition-colors truncate block text-left max-w-full"
          >
            {repository.fullName}
          </button>
          <p className="text-xs text-slate-500 mt-0.5">{repository.organization}</p>
        </div>
        <button
          type="button"
          onClick={() => toggleRepository(repository.id)}
          aria-label={saved ? 'Unsave repository' : 'Save repository'}
          className={cn('p-1.5 rounded-lg border transition-colors shrink-0', saved ? 'border-cyan-500/30 text-cyan-400' : 'border-white/10 text-slate-400 hover:border-white/20')}
        >
          <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-2 line-clamp-2 flex-1">{repository.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {repository.technologies.slice(0, 3).map((technology) => (
          <TechnologyBadge key={technology} name={technology} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <RepoStats stars={repository.stars} forks={repository.forks} language={repository.primaryLanguage} />
        <MatchScoreRing score={repository.matchScore} size={52} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500">
        <span>{repository.suitableIssueCount} suitable issues</span>
        <span>Setup: {repository.setupComplexity}</span>
        <span>Docs: {repository.documentationQuality}%</span>
        <span>{repository.difficulty}</span>
      </div>

      <p className="text-xs text-slate-500 mt-3 line-clamp-2">{repository.matchReason}</p>

      {repository.recommendationSource === 'real' && (
        <div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-cyan-300">Real recommendation</p>
          {repository.gaps?.[0] && (
            <p className="mt-1 text-[11px] text-slate-500">Watch-out: {repository.gaps[0]}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={analysing}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-60 text-white rounded-lg transition-colors"
      >
        {analysing && <LoaderCircle className="w-4 h-4 animate-spin" />}
        {analysing ? 'Analysing Repository' : 'Analyze Repository'}
      </button>
    </div>
  )
}

function RepoStats({ stars, forks, language }: { stars: number; forks: number; language: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className="flex items-center gap-1"><Star className="w-3 h-3" />{stars.toLocaleString()}</span>
      <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{forks.toLocaleString()}</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" />{language}</span>
    </div>
  )
}
