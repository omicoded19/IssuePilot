import { useMemo, useState } from 'react'
import { GitBranch, Grid3X3, List } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterBar } from '@/components/common/FilterBar'
import { RepositoryCard } from '@/components/repositories/RepositoryCard'
import { EmptyState } from '@/components/common/EmptyState'
import { mockRepositories } from '@/data/repositories'
import { useSavedStore } from '@/store/savedStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/cn'

const filterConfig = [
  { key: 'language', label: 'Language', options: [
    { id: 'typescript', label: 'TypeScript' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'php', label: 'PHP' },
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
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState<SortOption>('match')
  const [showSaved, setShowSaved] = useState(false)
  const viewMode = useUIStore((s) => s.repoViewMode)
  const setViewMode = useUIStore((s) => s.setRepoViewMode)
  const savedRepositoryIds = useSavedStore((s) => s.savedRepositoryIds)

  const toggleFilter = (key: string, optionId: string) => {
    setActiveFilters((prev) => {
      const current = prev[key] ?? []
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      return { ...prev, [key]: next }
    })
  }

  const filtered = useMemo(() => {
    let repos = mockRepositories.filter((repo) => {
      if (showSaved && !savedRepositoryIds.includes(repo.id)) return false
      if (search && !repo.fullName.toLowerCase().includes(search.toLowerCase()) && !repo.description.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (activeFilters.language?.length) {
        if (!activeFilters.language.some((f) => repo.primaryLanguage.toLowerCase().includes(f))) return false
      }
      if (activeFilters.setup?.length) {
        if (!activeFilters.setup.includes(repo.setupComplexity.toLowerCase())) return false
      }
      return true
    })

    repos = [...repos].sort((a, b) => {
      if (sort === 'stars') return b.stars - a.stars
      if (sort === 'issues') return b.suitableIssueCount - a.suitableIssueCount
      return b.matchScore - a.matchScore
    })

    return repos
  }, [search, activeFilters, sort, showSaved, savedRepositoryIds])

  return (
    <div>
      <PageHeader
        title="Repository Recommendations"
        description="Repositories matched to your skills, ranked by compatibility and contribution opportunity."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search repositories..." className="flex-1" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
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
            showSaved ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' : 'border-white/10 text-slate-400'
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
            <EmptyState icon={GitBranch} title="No repositories found" description="Try adjusting your filters or save some repositories first." />
          ) : (
            <div className={cn(
              viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-4'
            )}>
              {filtered.map((repo) => (
                <RepositoryCard key={repo.id} repository={repo} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
