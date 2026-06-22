import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Step {
  id: string
  label: string
  completed: boolean
}

interface ProgressTrackerProps {
  steps: Step[]
  onToggle?: (id: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function ProgressTracker({
  steps,
  onToggle,
  orientation = 'vertical',
  className,
}: ProgressTrackerProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center gap-1 overflow-x-auto pb-2', className)}>
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onToggle?.(step.id)}
              disabled={!onToggle}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors',
                step.completed
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-white/5 text-slate-400',
                onToggle && 'hover:bg-white/10 cursor-pointer'
              )}
            >
              {step.completed && <Check className="w-3 h-3" />}
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <div className={cn('w-4 h-px mx-1', step.completed ? 'bg-emerald-500/40' : 'bg-white/10')} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onToggle?.(step.id)}
              disabled={!onToggle}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0',
                step.completed
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/5 border-white/15 text-slate-500',
                onToggle && 'hover:border-cyan-500/40 cursor-pointer'
              )}
            >
              {step.completed ? <Check className="w-3 h-3" /> : <span className="text-[10px]">{i + 1}</span>}
            </button>
            {i < steps.length - 1 && (
              <div className={cn('w-px h-6 my-0.5', step.completed ? 'bg-emerald-500/30' : 'bg-white/10')} />
            )}
          </div>
          <span className={cn('text-sm pt-0.5', step.completed ? 'text-slate-300' : 'text-slate-500')}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
