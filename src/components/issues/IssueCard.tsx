import { AlertCircle, Bookmark, Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { useSavedStore } from '@/store/savedStore'
import type { Issue } from '@/types/issue'
import { cn } from '@/lib/cn'

interface IssueCardProps {
  issue: Issue
  repositoryName?: string
  className?: string
}

const availabilityColors: Record<string, string> = {
  Available: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Probably available': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Likely taken': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Assigned: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export function IssueCard({ issue, repositoryName, className }: IssueCardProps) {
  const { toggleIssue, isIssueSaved } = useSavedStore()
  const saved = isIssueSaved(issue.id)

  return (
    <div className={cn('glass-card p-5 hover:border-violet-500/20 transition-all', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">#{issue.number}</span>
            {repositoryName && <span className="text-xs text-slate-500">{repositoryName}</span>}
            <span className={cn('text-xs px-2 py-0.5 rounded border', availabilityColors[issue.availability])}>
              {issue.availability}
            </span>
          </div>
          <Link to={`/workspace/${issue.id}`} className="font-medium text-white hover:text-cyan-300 transition-colors mt-1 block">
            {issue.title}
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-cyan-400">{issue.matchScore}%</p>
            <p className="text-[10px] text-slate-500">match</p>
          </div>
          <button
            type="button"
            onClick={() => toggleIssue(issue.id)}
            aria-label={saved ? 'Unsave issue' : 'Save issue'}
            className={cn('p-1.5 rounded-lg border transition-colors', saved ? 'border-cyan-500/30 text-cyan-400' : 'border-white/10 text-slate-400')}
          >
            <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {issue.labels.map((label) => (
          <span key={label} className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        <Info icon={Clock} label="Time" value={issue.estimatedTime} />
        <Info label="Difficulty" value={issue.difficulty} />
        <Info label="Type" value={issue.contributionType} />
        <Info label="Files" value={issue.likelyFiles} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {issue.technologies.map((t) => (
          <TechnologyBadge key={t} name={t} variant="accent" />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        {issue.hasAssignee && (
          <span className="flex items-center gap-1 text-amber-400"><User className="w-3 h-3" /> Assigned</span>
        )}
        {issue.hasLinkedPR && (
          <span className="flex items-center gap-1 text-amber-400"><AlertCircle className="w-3 h-3" /> Linked PR</span>
        )}
        {!issue.hasAssignee && !issue.hasLinkedPR && (
          <span className="text-emerald-400">No assignee · No linked PR</span>
        )}
        <span>{issue.maintainerActivity}</span>
      </div>

      <p className="text-xs text-slate-500 mt-3 line-clamp-2">{issue.matchReason}</p>

      <Link
        to={`/workspace/${issue.id}`}
        className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        Open workspace →
      </Link>
    </div>
  )
}

function Info({ icon: Icon, label, value }: { icon?: typeof Clock; label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="text-slate-300 font-medium mt-0.5">{value}</p>
    </div>
  )
}
