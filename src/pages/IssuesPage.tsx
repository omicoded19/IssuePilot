import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterBar } from '@/components/common/FilterBar'
import { IssueCard } from '@/components/issues/IssueCard'
import { EmptyState } from '@/components/common/EmptyState'
import { getIssuesByRepository } from '@/data/issues'
import { getRepositoryById } from '@/data/repositories'
import { CircleDot } from 'lucide-react'

const filterConfig = [
  { key: 'difficulty', label: 'Difficulty', options: [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ]},
  { key: 'contributionType', label: 'Contribution Type', options: [
    { id: 'bug fix', label: 'Bug fix' },
    { id: 'feature', label: 'Feature' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'refactoring', label: 'Refactoring' },
  ]},
  { key: 'availability', label: 'Availability', options: [
    { id: 'available', label: 'Available' },
    { id: 'probably', label: 'Probably available' },
  ]},
  { key: 'matchScore', label: 'Match Score', options: [
    { id: '90', label: '90%+' },
    { id: '80', label: '80%+' },
  ]},
]

export function IssuesPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>()
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  const repo = getRepositoryById(repositoryId ?? '')
  const issues = getIssuesByRepository(repositoryId ?? 'appwrite-sdk-for-web')

  const toggleFilter = (key: string, optionId: string) => {
    setActiveFilters((prev) => {
      const current = prev[key] ?? []
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      return { ...prev, [key]: next }
    })
  }

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (search && !issue.title.toLowerCase().includes(search.toLowerCase())) return false
      if (activeFilters.difficulty?.length) {
        if (!activeFilters.difficulty.some((d) => issue.difficulty.toLowerCase().includes(d))) return false
      }
      if (activeFilters.contributionType?.length) {
        if (!activeFilters.contributionType.includes(issue.contributionType.toLowerCase())) return false
      }
      if (activeFilters.availability?.includes('available') && issue.availability !== 'Available') return false
      if (activeFilters.matchScore?.includes('90') && issue.matchScore < 90) return false
      if (activeFilters.matchScore?.includes('80') && issue.matchScore < 80) return false
      return true
    })
  }, [issues, search, activeFilters])

  return (
    <div>
      <PageHeader
        title="Issue Recommendations"
        description={repo ? `Personalized issues for ${repo.fullName}` : 'Personalized issue recommendations'}
        breadcrumbs={[
          { label: 'Repositories' },
          { label: repo?.fullName ?? 'Repository' },
          { label: 'Issues' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search issues..." className="mb-4" />
          <FilterBar
            filters={filterConfig}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters({})}
          />
        </div>

        <div className="lg:col-span-3">
          <p className="text-sm text-slate-400 mb-4">{filtered.length} issues matched to your profile</p>
          {filtered.length === 0 ? (
            <EmptyState icon={CircleDot} title="No issues found" description="Try adjusting your filters." />
          ) : (
            <div className="space-y-4">
              {filtered.map((issue) => (
                <IssueCard key={issue.id} issue={issue} repositoryName={repo?.fullName} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
