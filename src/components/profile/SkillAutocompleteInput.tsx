import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getSkillSuggestions } from '@/data/skill-catalog'
import { cn } from '@/lib/cn'

interface SkillAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  excludedNames?: string[]
  placeholder?: string
  className?: string
  inputClassName?: string
  id?: string
}

export function SkillAutocompleteInput({
  value,
  onChange,
  onSelect,
  excludedNames = [],
  placeholder = 'Add a skill, framework, or tool',
  className,
  inputClassName,
  id,
}: SkillAutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const suggestions = useMemo(
    () => getSkillSuggestions(value, excludedNames),
    [excludedNames, value],
  )

  const choose = (skill: string) => {
    onChange(skill)
    onSelect?.(skill)
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
      <input
        id={id}
        value={value}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActiveIndex(0)
        }}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((current) => (current + 1) % suggestions.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            choose(suggestions[activeIndex] ?? suggestions[0]!)
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none',
          inputClassName,
        )}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] p-1.5 shadow-2xl shadow-black/60">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                index === activeIndex
                  ? 'bg-emerald-500/12 text-emerald-200'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <span>{suggestion}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-600">skill</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
