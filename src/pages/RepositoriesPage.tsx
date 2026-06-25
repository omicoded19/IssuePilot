import { useMemo, useState } from 'react'
import { GitBranch, Grid3X3, Link2, List, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterBar } from '@/components/common/FilterBar'
import { RepositoryCard } from '@/components/repositories/RepositoryCard'
import { EmptyState } from '@/components/common/EmptyState'
import { createRecommendationRequest } from '@/lib/create-recommendation-request'
import { mapRecommendedRepository } from '@/lib/recommendation-mappers'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useSavedStore } from '@/store/savedStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUIStore } from '@/store/uiStore'
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/cn'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { createRepositoryRouteId } from '@/services/repository-api'

const filterConfig = [
  { key: 'language', label: 'Language', options: [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'php', label: 'PHP' },
    { id: 'python', label: 'Python' },
  ]},
  { key: 'difficulty', label: 'Difficulty', options: [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ]},
  { key: 'setup', label: 'Setup Complexity', options: [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
  ]},
]

type SortOption = 'match' | 'stars' | 'issues'

export function RepositoriesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<SortOption>('match')
  const [showSaved, setShowSaved] = useState(false)
  const [manualRepositoryUrl, setManualRepositoryUrl] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const organizationFilter = searchParams.get('organization')?.toLowerCase() ?? ''
  const viewMode = useUIStore((state) => state.repoViewMode)
  const setViewMode = useUIStore((state) => state.setRepoViewMode)
  const savedRepositoryIds = useSavedStore((state) => state.savedRepositoryIds)
  const profile = useUserStore((state) => state.profile)
  const contributionPreferences = useUserStore((state) => state.contributionPreferences)
  const availability = useUserStore((state) => state.availability)
  const skills = useSkillsStore((state) => state.skills)
  const recommendationData = useRecommendationStore((state) => state.data)
  const recommendationStatus = useRecommendationStore((state) => state.status)
  const recommendationError = useRecommendationStore((state) => state.error)
  const generateRecommendations = useRecommendationStore((state) => state.generate)
  const analyzeRepository = useRepositoryAnalysisStore((state) => state.analyze)
  const repositoryAnalysisStatus = useRepositoryAnalysisStore((state) => state.status)

  const repositories = useMemo(
    () => recommendationData
      ? recommendationData.repositories.map(mapRecommendedRepository)
      : [],
    [recommendationData],
  )

  const toggleFilter = (key: string, optionId: string) => {
    setActiveFilters((previous) => {
      const current = previous[key] ?? []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...previous, [key]: next }
    })
  }

  const handleGenerate = async () => {
    if (!profile.githubConnected || !profile.username || skills.length === 0) return
    await generateRecommendations(
      createRecommendationRequest({
        username: profile.username,
        skills,
        contributionPreferences,
        availability,
      }),
    )
  }

  const handleManualAnalysis = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = manualRepositoryUrl.trim()
    if (!value) {
      setManualError('Paste a public GitHub repository URL or owner/repository name.')
      return
    }

    setManualError(null)
    try {
      const analysis = await analyzeRepository(value)
      navigate(`/repositories/${createRepositoryRouteId(analysis.repository.owner, analysis.repository.name)}`)
    } catch (caught) {
      setManualError(caught instanceof Error ? caught.message : 'Could not analyse this repository.')
    }
  }

  const filtered = useMemo(() => {
    let nextRepositories = repositories.filter((repository) => {
      if (organizationFilter && repository.organizationId.toLowerCase() !== organizationFilter) return false
      if (showSaved && !savedRepositoryIds.includes(repository.id)) return false
      if (
        search &&
        !repository.fullName.toLowerCase().includes(search.toLowerCase()) &&
        !repository.description.toLowerCase().includes(search.toLowerCase())
      ) return false
      if (
        activeFilters.language?.length &&
        !activeFilters.language.some((filter) => repository.primaryLanguage.toLowerCase().includes(filter))
      ) return false
      if (
        activeFilters.difficulty?.length &&
        !activeFilters.difficulty.some((filter) => repository.difficulty.toLowerCase().includes(filter))
      ) return false
      if (
        activeFilters.setup?.length &&
        !activeFilters.setup.includes(repository.setupComplexity.toLowerCase())
      ) return false
      return true
    })

    nextRepositories = [...nextRepositories].sort((a, b) => {
      if (sort === 'stars') return b.stars - a.stars
      if (sort === 'issues') return b.suitableIssueCount - a.suitableIssueCount
      return b.matchScore - a.matchScore
    })

    return nextRepositories
  }, [repositories, organizationFilter, showSaved, savedRepositoryIds, search, activeFilters, sort])

  if (!profile.githubConnected) {
    return (
      <div>
        <PageHeader
          title="Repository Recommendations"
          description="Analyse your GitHub profile before generating repository matches."
        />
        <EmptyState
          icon={GitBranch}
          title="Contribution profile required"
          description="Your skills, preferred difficulty, available time, and contribution interests are used by the scoring engine."
          action={
            <Link to="/onboarding" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
              Analyse GitHub Profile
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Repository Recommendations"
        description="Repositories ranked using your skills, preferences, live GitHub metadata, activity, and beginner opportunities."
        actions={
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={recommendationStatus === 'loading'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm text-white"
          >
            {recommendationStatus === 'loading' ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : recommendationData ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {recommendationStatus === 'loading'
              ? 'Scoring Repositories'
              : recommendationData
                ? 'Refresh Recommendations'
                : 'Generate Recommendations'}
          </button>
        }
      />

      <section className="glass-card mb-5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-white">Analyse any public GitHub repository</h2>
            <p className="mt-1 text-xs text-slate-500">
              Manual analysis is not limited to the curated recommendation catalog or your detected GitHub skills.
            </p>
            <form onSubmit={handleManualAnalysis} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={manualRepositoryUrl}
                onChange={(event) => {
                  setManualRepositoryUrl(event.target.value)
                  setManualError(null)
                }}
                placeholder="https://github.com/owner/repository"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={repositoryAnalysisStatus === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {repositoryAnalysisStatus === 'loading' && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {repositoryAnalysisStatus === 'loading' ? 'Analysing' : 'Analyse repository'}
              </button>
            </form>
            {manualError && <p className="mt-2 text-xs text-rose-300">{manualError}</p>}
          </div>
        </div>
      </section>

      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={recommendationData
            ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300'
            : 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300'}>
            {recommendationData ? 'Live GitHub discovery' : 'Not generated yet'}
          </span>
          {recommendationData && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
              Weighted deterministic score
            </span>
          )}
          {organizationFilter && (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.delete('organization')
                setSearchParams(next)
              }}
              className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300"
            >
              Organization: {organizationFilter} ×
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {recommendationData
            ? `${recommendationData.metadata.repositoriesReturned} personalized results from ${recommendationData.metadata.candidateRepositoriesChecked} live-discovered and curated candidates. Another user can receive a different candidate set because discovery is built from their skills and preferences.`
            : 'Generate recommendations to search GitHub using your skills and preferences. IssuePilot no longer shows fake repository cards before generation.'}
        </p>
        {recommendationError && <p className="mt-2 text-sm text-rose-300">{recommendationError}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search repositories..." className="flex-1" />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300"
        >
          <option value="match">Sort by Match</option>
          <option value="stars">Sort by Stars</option>
          <option value="issues">Sort by Issues</option>
        </select>
        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={cn('p-2 rounded', viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={cn('p-2 rounded', viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowSaved(!showSaved)}
          className={cn(
            'px-3 py-2 text-sm rounded-lg border transition-colors',
            showSaved ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' : 'border-white/10 text-slate-400',
          )}
        >
          Saved ({savedRepositoryIds.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterBar
            filters={filterConfig}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters({})}
          />
        </div>

        <div className="lg:col-span-3">
          <p className="text-sm text-slate-400 mb-4">{filtered.length} repositories</p>
          {filtered.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title={recommendationData ? 'No repositories match these filters' : 'Generate live repository recommendations'}
              description={recommendationData
                ? 'Try adjusting your filters, contribution profile, or saved selection.'
                : 'IssuePilot will combine a curated quality baseline with live GitHub discovery based on your known skills, learning targets, and contribution preferences.'}
              action={!recommendationData ? (
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={recommendationStatus === 'loading'}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {recommendationStatus === 'loading' && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Generate recommendations
                </button>
              ) : undefined}
            />
          ) : (
            <div className={cn(
              viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-4',
            )}>
              {filtered.map((repository) => (
                <RepositoryCard key={repository.id} repository={repository} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
