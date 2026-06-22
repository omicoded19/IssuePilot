import { cn } from '@/lib/cn'

export interface FilterOption {
  id: string
  label: string
}

interface FilterBarProps {
  filters: { key: string; label: string; options: FilterOption[] }[]
  activeFilters: Record<string, string[]>
  onToggle: (key: string, optionId: string) => void
  onClear: () => void
  className?: string
}

export function FilterBar({ filters, activeFilters, onToggle, onClear, className }: FilterBarProps) {
  const hasActive = Object.values(activeFilters).some((v) => v.length > 0)

  return (
    <div className={cn('space-y-3', className)}>
      {filters.map((filter) => (
        <div key={filter.key}>
          <p className="text-xs text-slate-400 mb-1.5">{filter.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {filter.options.map((option) => {
              const active = activeFilters[filter.key]?.includes(option.id)
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onToggle(filter.key, option.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
