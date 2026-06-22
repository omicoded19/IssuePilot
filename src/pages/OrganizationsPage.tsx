import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { FilterBar } from '@/components/common/FilterBar'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { mockOrganizations } from '@/data/organizations'
import { EmptyState } from '@/components/common/EmptyState'
import { Building2 } from 'lucide-react'

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

  const toggleFilter = (key: string, optionId: string) => {
    setActiveFilters((prev) => {
      const current = prev[key] ?? []
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      return { ...prev, [key]: next }
    })
  }

  const filtered = useMemo(() => {
    return mockOrganizations.filter((org) => {
      if (search && !org.name.toLowerCase().includes(search.toLowerCase()) && !org.description.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (activeFilters.difficulty?.length) {
        if (!activeFilters.difficulty.includes(org.difficulty.toLowerCase())) return false
      }
      if (activeFilters.organizationSize?.length) {
        if (!activeFilters.organizationSize.includes(org.organizationSize.toLowerCase())) return false
      }
      if (activeFilters.beginnerFriendliness?.includes('high') && org.beginnerFriendliness < 80) return false
      if (activeFilters.maintainerActivity?.includes('high') && org.maintainerActivity < 90) return false
      if (activeFilters.language?.length) {
        const langs = org.languages.map((l) => l.toLowerCase())
        if (!activeFilters.language.some((f) => langs.some((l) => l.includes(f)))) return false
      }
      return true
    })
  }, [search, activeFilters])

  return (
    <div>
      <PageHeader
        title="Organization Recommendations"
        description="Open-source organizations matched to your skills and contribution preferences."
      />

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
            <EmptyState icon={Building2} title="No organizations found" description="Try adjusting your filters or search query." />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
