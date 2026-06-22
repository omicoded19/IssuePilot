import { useMemo, useState } from 'react'
import { Building2, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterBar } from '@/components/common/FilterBar'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { mockOrganizations } from '@/data/organizations'
import { EmptyState } from '@/components/common/EmptyState'
import { createRecommendationRequest } from '@/lib/create-recommendation-request'
import { mapRecommendedOrganization } from '@/lib/recommendation-mappers'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'

const filterConfig = [
  { key: 'language', label: 'Language', options: [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'go', label: 'Go' },
  ]},
  { key: 'framework', label: 'Framework', options: [
    { id: 'react', label: 'React' },
    { id: 'nextjs', label: 'Next.js' },
    { id: 'vue', label: 'Vue' },
    { id: 'node', label: 'Node.js' },
  ]},
  { key: 'difficulty', label: 'Difficulty', options: [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ]},
  { key: 'beginnerFriendliness', label: 'Beginner Friendliness', options: [
    { id: 'high', label: 'High (80%+)' },
    { id: 'medium', label: 'Medium (60-79%)' },
  ]},
  { key: 'organizationSize', label: 'Organization Size', options: [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
  ]},
  { key: 'maintainerActivity', label: 'Maintainer Activity', options: [
    { id: 'high', label: 'High (90%+)' },
    { id: 'medium', label: 'Medium (70-89%)' },
  ]},
]

export function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const profile = useUserStore((state) => state.profile)
  const contributionPreferences = useUserStore((state) => state.contributionPreferences)
  const availability = useUserStore((state) => state.availability)
  const skills = useSkillsStore((state) => state.skills)
  const recommendationData = useRecommendationStore((state) => state.data)
  const recommendationStatus = useRecommendationStore((state) => state.status)
  const recommendationError = useRecommendationStore((state) => state.error)
  const generateRecommendations = useRecommendationStore((state) => state.generate)

  const organizations = useMemo(
    () => recommendationData
      ? recommendationData.organizations.map(mapRecommendedOrganization)
      : mockOrganizations,
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

  const filtered = useMemo(() => {
    return organizations.filter((organization) => {
      if (
        search &&
        !organization.name.toLowerCase().includes(search.toLowerCase()) &&
        !organization.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }
      if (
        activeFilters.difficulty?.length &&
        !activeFilters.difficulty.includes(organization.difficulty.toLowerCase())
      ) return false
      if (
        activeFilters.organizationSize?.length &&
        !activeFilters.organizationSize.includes(organization.organizationSize.toLowerCase())
      ) return false
      if (activeFilters.beginnerFriendliness?.includes('high') && organization.beginnerFriendliness < 80) return false
      if (activeFilters.maintainerActivity?.includes('high') && organization.maintainerActivity < 90) return false
      if (activeFilters.language?.length) {
        const languages = organization.languages.map((language) => language.toLowerCase())
        if (!activeFilters.language.some((filter) => languages.some((language) => language.includes(filter)))) return false
      }
      if (activeFilters.framework?.length) {
        const frameworks = organization.frameworks.map((framework) => framework.toLowerCase().replace('.', ''))
        if (!activeFilters.framework.some((filter) => frameworks.some((framework) => framework.includes(filter)))) return false
      }
      return true
    })
  }, [organizations, search, activeFilters])

  if (!profile.githubConnected) {
    return (
      <div>
        <PageHeader
          title="Organization Recommendations"
          description="Connect and analyse your GitHub profile before generating personalized recommendations."
        />
        <EmptyState
          icon={Building2}
          title="Contribution profile required"
          description="IssuePilot needs your editable skills and preferences to score organizations transparently."
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
        title="Organization Recommendations"
        description="Organizations ranked from live GitHub repository signals and your editable contribution profile."
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

      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={recommendationData
            ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300'
            : 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300'}>
            {recommendationData ? 'Live GitHub metadata' : 'Demo preview'}
          </span>
          {recommendationData && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
              Deterministic scoring · {recommendationData.metadata.scoringVersion}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {recommendationData
            ? `${recommendationData.metadata.candidateRepositoriesChecked} curated repositories checked on ${new Date(recommendationData.metadata.generatedAt).toLocaleString()}.`
            : 'Generate recommendations to replace these design-preview cards with personalized results.'}
        </p>
        {recommendationError && <p className="mt-2 text-sm text-rose-300">{recommendationError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search organizations..." className="mb-4" />
          <FilterBar
            filters={filterConfig}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters({})}
          />
        </div>

        <div className="lg:col-span-3">
          <p className="text-sm text-slate-400 mb-4">{filtered.length} organizations matched</p>
          {filtered.length === 0 ? (
            <EmptyState icon={Building2} title="No organizations found" description="Try adjusting your filters or contribution profile." />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
