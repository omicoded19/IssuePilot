import { cn } from '@/lib/cn'

interface TechnologyBadgeProps {
  name: string
  variant?: 'default' | 'outline' | 'accent'
  className?: string
}

export function TechnologyBadge({ name, variant = 'default', className }: TechnologyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variant === 'default' && 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20',
        variant === 'outline' && 'border border-white/10 text-slate-300',
        variant === 'accent' && 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20',
        className
      )}
    >
      {name}
    </span>
  )
}
