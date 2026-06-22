import {
  AlertTriangle,
  Bookmark,
  Clock3,
  ExternalLink,
  GitPullRequestArrow,
  MessageCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { cn } from '@/lib/cn'
import { useSavedStore } from '@/store/savedStore'
import type { PersonalizedIssueRecommendation } from '@/types/issue-intelligence'

interface PersonalizedIssueCardProps {
  issue: PersonalizedIssueRecommendation
  owner: string
  repository: string
}

const availabilityStyles = {
  probably_available: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  possibly_claimed: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  needs_review: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
}

const availabilityLabels = {
  probably_available: 'Probably available',
  possibly_claimed: 'Possibly claimed',
  needs_review: 'Review discussion',
}

export function PersonalizedIssueCard({
  issue,
  owner,
  repository,
}: PersonalizedIssueCardProps) {
  const issueId = `${owner}--${repository}--${issue.number}`
  const saved = useSavedStore((state) => state.isIssueSaved(issueId))
  const toggleIssue = useSavedStore((state) => state.toggleIssue)
  const workspacePath = `/workspace/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${issue.number}`

  return (
    <article className="glass-card p-5 transition-all hover:border-cyan-500/20">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">#{issue.number}</span>
            <span
              className={cn(
                'rounded-full border px-2 py-1 text-[11px]',
                availabilityStyles[issue.availabilityStatus],
              )}
            >
              {availabilityLabels[issue.availabilityStatus]}
            </span>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-300">
              {issue.difficulty}
            </span>
          </div>
          <Link
            to={workspacePath}
            className="mt-2 block font-medium text-white transition-colors hover:text-cyan-300"
          >
            {issue.title}
          </Link>
          {issue.bodyPreview && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
              {issue.bodyPreview}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-semibold text-cyan-300">{issue.matchScore}%</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-600">personal match</p>
          </div>
          <button
            type="button"
            onClick={() => toggleIssue(issueId)}
            aria-label={saved ? 'Remove saved issue' : 'Save issue'}
            className={cn(
              'rounded-lg border p-2 transition-colors',
              saved
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 text-slate-500 hover:text-slate-200',
            )}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Metric icon={Clock3} label="Estimated time" value={issue.estimatedTime} />
        <Metric icon={GitPullRequestArrow} label="Contribution" value={issue.contributionType} />
        <Metric icon={MessageCircle} label="Discussion" value={`${issue.comments} comments`} />
        <Metric label="Assignees" value={String(issue.assignees.length)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {issue.requiredTechnologies.map((technology) => (
          <TechnologyBadge key={technology} name={technology} variant="accent" />
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.025] p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-600">Why it matches</p>
        <ul className="mt-2 space-y-1">
          {issue.reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="text-xs text-slate-400">• {reason}</li>
          ))}
        </ul>
      </div>

      {issue.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/70">{issue.warnings[0]}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.slice(0, 5).map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={issue.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-200"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            to={workspacePath}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
          >
            Prepare contribution
          </Link>
        </div>
      </div>
    </article>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-slate-600">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-300">{value}</p>
    </div>
  )
}
