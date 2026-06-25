import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { usePullRequestStore } from '@/store/pullRequestStore'
import type {
  PullRequestChecksStatus,
  PullRequestStatus,
  PullRequestTrackingData,
} from '@/types/pull-request'

const activeStatuses = new Set<PullRequestStatus>([
  'open',
  'draft',
  'in_review',
  'changes_requested',
  'approved',
])

const statusClasses: Record<PullRequestStatus, string> = {
  open: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  draft: 'border-white/10 bg-white/5 text-slate-300',
  in_review: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  changes_requested: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
  approved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  merged: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  closed: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
}

const checksClasses: Record<PullRequestChecksStatus, string> = {
  passed: 'text-emerald-300',
  failed: 'text-rose-300',
  pending: 'text-amber-200',
  not_found: 'text-slate-500',
}

function formatStatus(status: string): string {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleString()
}

export function ContributionsPage() {
  const trackings = usePullRequestStore((state) => state.trackings)
  const listStatus = usePullRequestStore((state) => state.listStatus)
  const error = usePullRequestStore((state) => state.error)
  const loadAll = usePullRequestStore((state) => state.loadAll)
  const refreshAll = usePullRequestStore((state) => state.refreshAll)
  const requested = useRef(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'merged' | 'closed'>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    void loadAll().catch(() => undefined)
  }, [loadAll])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return trackings.filter((tracking) => {
      const status = tracking.pullRequest?.status
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && status && activeStatuses.has(status)) ||
        (filter === 'merged' && status === 'merged') ||
        (filter === 'closed' && status === 'closed')
      const matchesQuery =
        !normalized ||
        tracking.repository.fullName.toLowerCase().includes(normalized) ||
        tracking.pullRequest?.title.toLowerCase().includes(normalized) ||
        String(tracking.pullRequest?.number ?? '').includes(normalized)
      return Boolean(matchesFilter && matchesQuery)
    })
  }, [filter, query, trackings])

  const summary = useMemo(() => ({
    total: trackings.length,
    active: trackings.filter((item) => item.pullRequest && activeStatuses.has(item.pullRequest.status)).length,
    merged: trackings.filter((item) => item.pullRequest?.status === 'merged').length,
    changesRequested: trackings.filter((item) => item.pullRequest?.status === 'changes_requested').length,
  }), [trackings])

  return (
    <div>
      <PageHeader
        title="My Contributions"
        description="Track every pull request and return directly to its IssuePilot workspace without reopening the repository and issue flow."
        actions={
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={listStatus === 'loading' || trackings.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50"
          >
            {listStatus === 'loading' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh all
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Tracked PRs" value={summary.total} />
        <SummaryCard label="Active" value={summary.active} />
        <SummaryCard label="Changes requested" value={summary.changesRequested} />
        <SummaryCard label="Merged" value={summary.merged} />
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repository, PR title, or number"
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/30 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'merged', 'closed'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                filter === value
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {formatStatus(value)}
            </button>
          ))}
        </div>
      </div>

      {listStatus === 'loading' && trackings.length === 0 ? (
        <div className="glass-card flex items-center justify-center gap-3 p-14 text-slate-400">
          <LoaderCircle className="h-5 w-5 animate-spin text-emerald-300" />
          Loading tracked pull requests
        </div>
      ) : error && trackings.length === 0 ? (
        <div className="glass-card flex items-start gap-3 border-rose-500/15 p-5 text-sm text-rose-200/80">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={GitPullRequest}
            title={trackings.length === 0 ? 'No pull requests tracked yet' : 'No matching pull requests'}
            description={
              trackings.length === 0
                ? 'Open a contribution workspace and detect or paste your pull-request URL once. It will then stay available here.'
                : 'Change the search text or status filter.'
            }
            action={
              trackings.length === 0 ? (
                <Link
                  to="/repositories"
                  className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
                >
                  Find a repository
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((tracking) => (
            <ContributionCard key={tracking.workspaceId} tracking={tracking} />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ContributionCard({ tracking }: { tracking: PullRequestTrackingData }) {
  const pullRequest = tracking.pullRequest
  if (!pullRequest) return null

  const completed = tracking.workspaceProgress.filter((step) => step.completed).length
  const total = tracking.workspaceProgress.length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
  const workspaceUrl = `/workspace/${encodeURIComponent(tracking.repository.owner)}/${encodeURIComponent(tracking.repository.name)}/${tracking.issueNumber}`

  return (
    <article className="glass-card p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClasses[pullRequest.status]}`}>
              {formatStatus(pullRequest.status)}
            </span>
            <span className={`text-xs ${checksClasses[tracking.automationEvidence.testsStatus]}`}>
              Checks: {formatStatus(tracking.automationEvidence.testsStatus)}
            </span>
            <span className="text-xs text-slate-600">Synced {formatTime(tracking.metadata.syncedAt)}</span>
          </div>
          <h2 className="truncate text-lg font-semibold text-white">
            {tracking.repository.fullName} #{pullRequest.number}
          </h2>
          <p className="mt-1 text-sm text-slate-300">{pullRequest.title}</p>
          <p className="mt-2 text-xs text-slate-500">
            Linked issue #{tracking.issueNumber} · {pullRequest.headBranch} → {pullRequest.baseBranch}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Evidence label="Fork" complete={tracking.automationEvidence.repositoryForked} />
            <Evidence label="Branch" complete={tracking.automationEvidence.branchCreated} />
            <Evidence label="Changes" complete={tracking.automationEvidence.changeImplemented} />
            <Evidence label="Checks" complete={tracking.automationEvidence.testsStatus === 'passed'} />
            <Evidence label="Review" complete={tracking.workspaceProgress.some((step) => step.id === 'review-received' && step.completed)} />
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Contribution progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to={workspaceUrl}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Open workspace
            </Link>
            <a
              href={pullRequest.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
            >
              GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

function Evidence({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-black/20 px-2.5 py-2 text-xs">
      {complete ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <span className="h-3.5 w-3.5 rounded-full border border-white/15" />
      )}
      <span className={complete ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  )
}
