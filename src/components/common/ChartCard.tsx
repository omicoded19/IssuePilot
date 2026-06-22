import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChartCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={cn('glass-card p-4', className)}>
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}
