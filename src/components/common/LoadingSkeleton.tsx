import { cn } from '@/lib/cn'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-white/5 rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-4 animate-pulse space-y-3', className)}>
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="h-8 bg-white/5 rounded w-1/2" />
      <div className="h-3 bg-white/5 rounded w-full" />
      <div className="h-3 bg-white/5 rounded w-2/3" />
    </div>
  )
}
