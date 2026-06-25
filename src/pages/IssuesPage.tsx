import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleDot, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { FilterBar } from '@/components/common/FilterBar'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { PersonalizedIssueCard } from '@/components/issues/PersonalizedIssueCard'
import { createRecommendationRequest } from '@/lib/create-recommendation-request'
import { parseRepositoryRouteId } from '@/services/repository-api'
import { useIssueIntelligenceStore } from '@/store/issueIntelligenceStore'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'

const filterConfig = [
  {
    key: 'difficulty',
    label: 'Difficulty',
    options: [
      { id: 'beginner', label: 'Beginner' },
      { id: 'intermediate', label: 'Intermediate' },
      { id: 'advanced', label: 'Advanced' },
    ],
  },
  {
    key: 'contributionType',
    label: 'Contribution Type',
    options: [
      { id: 'bug fix', label: 'Bug fix' },
      { id: 'feature', label: 'Feature' },
      { id: 'documentation', label: 'Documentation' },
      { id: 'testing', label: 'Testing' },
      { id: 'ui improvement', label: 'UI improvement' },
    ],
  },
  {
    key: 'availability',
    label: 'Availability',
    options: [
      { id: 'probably_available', label: 'Probably available' },
      { id: 'needs_review', label: 'Needs review' },
      { id: 'possibly_claimed', label: 'Possibly claimed' },
    ],
  },
  {
    key: 'matchScore',
    label: 'Match Score',
    options: [
      { id: '90', label: '90%+' },
      { id: '80', label: '80%+' },
      { id: '70', label: '70%+' },
    ],
  },
]

export function IssuesPage() {
  const { repositoryId = '' } = useParams<{ repositoryId: string }>()
  const coordinates = useMemo(() => parseRepositoryRouteId(repositoryId), [repositoryId])

  if (!coordinates) {
    return (
      <div className="glass-card">
        <EmptyState
          icon={CircleDot}
          title="Repository route is invalid"
          description="Open a repository from your live recommendations or analyse a public GitHub repository first."
          action={
            <Link
              to="/repositories"
              className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Go to repositories
            </Link>
          }
        />
      </div>
    )
  }

  return <RealIssuesPage owner={coordinates.owner} repository={coordinates.repository} />
}

function RealIssuesPage({ owner, repository }: { owner: string; repository: string }) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const profile = useUserStore((state) => state.profile)
  const contributionPreferences = useUserStore((state) => state.contributionPreferences)
  const availability = useUserStore((state) => state.availability)
  const skills = useSkillsStore((state) => state.skills)
  const analysis = useRepositoryAnalysisStore((state) => state.currentAnalysis)
  const analysisStatus = useRepositoryAnalysisStore((state) => state.status)
  const analysisError = useRepositoryAnalysisStore((state) => state.error)
  const loadStored = useRepositoryAnalysisStore((state) => state.loadStored)
  const recommendations = useIssueIntelligenceStore((state) => state.recommendations)
  const recommendationStatus = useIssueIntelligenceStore((state) => state.recommendationStatus)
  const recommendationError = useIssueIntelligenceStore((state) => state.error)
  const recommend = useIssueIntelligenceStore((state) => state.recommend)
  const requestedRepository = useRef('')

  const analysisMatches =
    analysis?.repository.owner.toLowerCase() === owner.toLowerCase() &&
    analysis?.repository.name.toLowerCase() === repository.toLowerCase()
  const recommendationMatches =
    recommendations?.repository.owner.toLowerCase() === owner.toLowerCase() &&
    recommendations?.repository.name.toLowerCase() === repository.toLowerCase()

  useEffect(() => {
    const key = `${owner.toLowerCase()}/${repository.toLowerCase()}`
    if (analysisMatches || requestedRepository.current === key) return
    requestedRepository.current = key
    void loadStored(owner, repository).catch(() => undefined)
  }, [analysisMatches, loadStored, owner, repository])

  const handleGenerate = async () => {
    if (!profile.githubConnected || !profile.username || skills.length === 0) return
    const base = createRecommendationRequest({
      username: profile.username,
      skills,
      contributionPreferences,
      availability,
    })
    await recommend({ ...base, owner, repository })
  }

  const toggleFilter = (key: string, optionId: string) => {
    setActiveFilters((previous) => {
      const current = previous[key] ?? []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return { ...previous, [key]: next }
    })
  }

  const filtered = useMemo(() => {
    if (!recommendationMatches || !recommendations) return []
    return recommendations.issues.filter((issue) => {
      if (
        search &&
        !issue.title.toLowerCase().includes(search.toLowerCase()) &&
        !issue.labels.some((label) => label.toLowerCase().includes(search.toLowerCase()))
      ) return false
      if (
        activeFilters.difficulty?.length &&
        !activeFilters.difficulty.some((value) => issue.difficulty.toLowerCase().includes(value))
      ) return false
      if (
        activeFilters.contributionType?.length &&
        !activeFilters.contributionType.includes(issue.contributionType.toLowerCase())
      ) return false
      if (
        activeFilters.availability?.length &&
        !activeFilters.availability.includes(issue.availabilityStatus)
      ) return false
      const thresholds = activeFilters.matchScore?.map(Number) ?? []
      if (thresholds.length > 0 && issue.matchScore < Math.max(...thresholds)) return false
      return true
    })
  }, [activeFilters, recommendationMatches, recommendations, search])

  if (!profile.githubConnected) {
    return (
      <div>
        <PageHeader
          title="Personalized Issue Recommendations"
          description="Analyse your GitHub profile before ranking repository issues."
        />
        <EmptyState
          icon={CircleDot}
          title="Developer profile required"
          description="IssuePilot uses your edited skills, interests, available time, and preferred difficulty to score issues."
          action={
            <Link to="/onboarding" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">
              Analyse GitHub Profile
            </Link>
          }
        />
      </div>
    )
  }

  if (!analysisMatches && analysisStatus === 'loading') {
    return <IssuesLoadingState />
  }

  if (!analysisMatches && analysisError) {
    return (
      <div>
        <PageHeader title="Personalized Issue Recommendations" description={`${owner}/${repository}`} />
        <EmptyState
          icon={CircleDot}
          title="Repository analysis unavailable"
          description={analysisError}
          action={
            <Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">
              Analyse Repository
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Personalized Issue Recommendations"
        description={`Real issues from ${owner}/${repository}, ranked against your contribution profile.`}
        breadcrumbs={[
          { label: 'Repositories' },
          { label: `${owner}/${repository}` },
          { label: 'Issues' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={recommendationStatus === 'loading' || !analysisMatches}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {recommendationStatus === 'loading' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : recommendationMatches ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {recommendationStatus === 'loading'
              ? 'Scoring issues'
              : recommendationMatches
                ? 'Refresh scores'
                : 'Generate issue matches'}
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
          Real GitHub issues
        </span>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
          Deterministic personal score
        </span>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
          Verify availability with maintainers
        </span>
      </div>

      {recommendationError && (
        <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {recommendationError}
        </div>
      )}

      {!recommendationMatches ? (
        <EmptyState
          icon={Sparkles}
          title="Generate personalized matches"
          description={`${analysis?.issues.length ?? 0} beginner-oriented issues are stored for this repository. Generate scores using your current skills and preferences.`}
          action={
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
            >
              Score Repository Issues
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Search issues or labels..." className="mb-4" />
            <FilterBar
              filters={filterConfig}
              activeFilters={activeFilters}
              onToggle={toggleFilter}
              onClear={() => setActiveFilters({})}
            />
          </aside>

          <section className="lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
              <span>{filtered.length} personalized issues</span>
              <span>Scoring version: {recommendations.metadata.scoringVersion}</span>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={CircleDot} title="No issues found" description="Try clearing filters or refreshing the repository analysis." />
            ) : (
              <div className="space-y-4">
                {filtered.map((issue) => (
                  <PersonalizedIssueCard
                    key={issue.githubIssueId}
                    issue={issue}
                    owner={owner}
                    repository={repository}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function IssuesLoadingState() {
  return (
    <div>
      <PageHeader title="Personalized Issue Recommendations" description="Loading stored repository analysis..." />
      <div className="glass-card flex items-center justify-center gap-3 p-12 text-slate-400">
        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
        Loading repository data
      </div>
    </div>
  )
}
