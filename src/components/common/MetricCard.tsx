import { cn } from '@/lib/cn'
import { PercentageBadge } from './PercentageBadge'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  className?: string
}

export function MetricCard({ label, value, trend, trendLabel, className }: MetricCardProps) {
  return (
    <div className={cn('glass-card p-4 hover:border-white/15 transition-colors', className)}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-white">{value}</p>
        {trend !== undefined && <PercentageBadge value={trend} label={trendLabel} />}
      </div>
    </div>
  )
}
