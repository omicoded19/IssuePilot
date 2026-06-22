import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PercentageBadgeProps {
  value: number
  label?: string
  className?: string
}

export function PercentageBadge({ value, label, className }: PercentageBadgeProps) {
  const isPositive = value >= 0
  const isNeutral = value === 0
  const isGoodWhenDown = label?.includes('reduction') || label?.includes('Reduced') || label?.includes('Latency')

  const displayPositive = isGoodWhenDown ? !isPositive : isPositive

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
        isNeutral
          ? 'text-slate-400 bg-slate-800'
          : displayPositive
            ? 'text-emerald-400 bg-emerald-400/10'
            : 'text-red-400 bg-red-400/10',
        className
      )}
    >
      {!isNeutral && (displayPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
      {isNeutral ? '—' : `${Math.abs(value)}%`}
    </span>
  )
}
