import { X } from 'lucide-react'
import type { FlowNodeData } from '@/types/analytics'
import { cn } from '@/lib/cn'

interface FlowDetailsPanelProps {
  node: FlowNodeData | null
  onClose: () => void
  onToggleChecklist: (itemId: string) => void
  onContinue: () => void
}

const statusColors: Record<string, string> = {
  Completed: 'text-emerald-400 bg-emerald-400/10',
  Ready: 'text-cyan-400 bg-cyan-400/10',
  'In Progress': 'text-blue-400 bg-blue-400/10',
  Locked: 'text-slate-500 bg-slate-800',
  Warning: 'text-amber-400 bg-amber-400/10',
}

export function FlowDetailsPanel({ node, onClose, onToggleChecklist, onContinue }: FlowDetailsPanelProps) {
  if (!node) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-[#0b0b0b] border-l border-white/10 z-10 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">{node.label}</h3>
        <button type="button" onClick={onClose} aria-label="Close panel" className="p-1 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <span className={cn('inline-block text-xs px-2 py-1 rounded font-medium', statusColors[node.status])}>
          {node.status}
        </span>

        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-1">Description</h4>
          <p className="text-sm text-slate-300">{node.description}</p>
        </div>

        {node.requiredActions.length > 0 && (
          <div>
            <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Required Actions</h4>
            <ul className="space-y-1">
              {node.requiredActions.map((action) => (
                <li key={action} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.importantInfo.length > 0 && (
          <div>
            <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Important Information</h4>
            <ul className="space-y-1">
              {node.importantInfo.map((info) => (
                <li key={info} className="text-sm text-slate-400">{info}</li>
              ))}
            </ul>
          </div>
        )}

        {node.checklist.length > 0 && (
          <div>
            <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Checklist</h4>
            <ul className="space-y-2">
              {node.checklist.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggleChecklist(item.id)}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                    />
                    <span className={item.checked ? 'text-slate-400 line-through' : 'text-slate-300'}>
                      {item.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {node.status !== 'Locked' && node.status !== 'Completed' && (
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={onContinue}
            className="w-full py-2.5 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
