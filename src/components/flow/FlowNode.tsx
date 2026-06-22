import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, Lock, AlertTriangle, Loader2 } from 'lucide-react'
import type { FlowNodeStatus } from '@/types/analytics'
import { cn } from '@/lib/cn'

export interface FlowNodeType {
  label: string
  status: FlowNodeStatus
  description: string
}

const statusStyles: Record<FlowNodeStatus, { border: string; bg: string; icon: typeof Check }> = {
  Completed: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: Check },
  Ready: { border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', icon: Loader2 },
  'In Progress': { border: 'border-blue-500/40', bg: 'bg-blue-500/10', icon: Loader2 },
  Locked: { border: 'border-slate-600/40', bg: 'bg-slate-800/50', icon: Lock },
  Warning: { border: 'border-amber-500/40', bg: 'bg-amber-500/10', icon: AlertTriangle },
}

const statusColors: Record<FlowNodeStatus, string> = {
  Completed: 'text-emerald-400',
  Ready: 'text-cyan-400',
  'In Progress': 'text-blue-400',
  Locked: 'text-slate-500',
  Warning: 'text-amber-400',
}

function FlowNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FlowNodeType
  const style = statusStyles[nodeData.status]
  const Icon = style.icon

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-2 !border-0" />
      <div
        className={cn(
          'px-4 py-3 rounded-xl border min-w-[160px] max-w-[200px] transition-all',
          style.border,
          style.bg,
          selected && 'ring-2 ring-cyan-500/50',
          nodeData.status === 'In Progress' && 'animate-pulse'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn('w-3.5 h-3.5', statusColors[nodeData.status], nodeData.status === 'In Progress' && 'animate-spin')} />
          <span className={cn('text-[10px] uppercase tracking-wide font-medium', statusColors[nodeData.status])}>
            {nodeData.status}
          </span>
        </div>
        <p className="text-sm font-medium text-white leading-tight">{nodeData.label}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2 !border-0" />
    </>
  )
}

export const FlowNode = memo(FlowNodeComponent)
