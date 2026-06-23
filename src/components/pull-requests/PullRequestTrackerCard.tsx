import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GitPullRequest,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePullRequestStore } from '@/store/pullRequestStore'
import type { WorkspaceProgressStep } from '@/types/issue-intelligence'
import type {
  PullRequestCandidate,
  PullRequestStatus,
  PullRequestTrackingData,
} from '@/types/pull-request'

interface PullRequestTrackerCardProps {
  workspaceId: string
  repositoryFullName: string
  issueNumber: number
  onProgressSynchronized: (progress: WorkspaceProgressStep[]) => void
}

const statusStyles: Record<PullRequestStatus, string> = {
  open: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  draft: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
  in_review: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  changes_requested: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  approved: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  merged: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  closed: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
}

function statusLabel(status: PullRequestStatus): string {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function PullRequestTrackerCard({
  workspaceId,
  repositoryFullName,
  issueNumber,
  onProgressSynchronized,
}: PullRequestTrackerCardProps) {
  const authStatus = useAuthStore((state) => state.status)
  const loginWithGitHub = useAuthStore((state) => state.loginWithGitHub)
  const tracking = usePullRequestStore((state) => state.tracking)
  const trackedWorkspaceId = usePullRequestStore((state) => state.workspaceId)
  const status = usePullRequestStore((state) => state.status)
  const error = usePullRequestStore((state) => state.error)
  const load = usePullRequestStore((state) => state.load)
  const sync = usePullRequestStore((state) => state.sync)
  const [pullRequestUrl, setPullRequestUrl] = useState('')
  const loadedWorkspace = useRef('')

  const activeTracking = trackedWorkspaceId === workspaceId ? tracking : null

  useEffect(() => {
    if (authStatus !== 'authenticated' || loadedWorkspace.current === workspaceId) return
    loadedWorkspace.current = workspaceId
    void load(workspaceId).catch(() => undefined)
  }, [authStatus, load, onProgressSynchronized, workspaceId])

  const handleSync = async (url?: string) => {
    const result = await sync(workspaceId, url ?? pullRequestUrl)
    onProgressSynchronized(result.workspaceProgress)
    if (result.pullRequest) setPullRequestUrl(result.pullRequest.githubUrl)
  }

  if (authStatus !== 'authenticated') {
    return (
      <section className="glass-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <GitPullRequest className="h-4 w-4 text-violet-400" />
          <h2 className="font-medium text-white">Pull Request Tracking</h2>
        </div>
        <p className="mb-4 text-xs leading-5 text-slate-500">
          Sign in with GitHub to detect pull requests authored by your account and synchronize review status.
        </p>
        <button
          type="button"
          onClick={loginWithGitHub}
          className="w-full rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/15"
        >
          Continue with GitHub
        </button>
      </section>
    )
  }

  return (
    <section className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-4 w-4 text-violet-400" />
          <h2 className="font-medium text-white">Pull Request Tracking</h2>
        </div>
        {activeTracking?.pullRequest && (
          <button
            type="button"
            onClick={() => void handleSync(activeTracking.pullRequest?.githubUrl)}
            disabled={status === 'loading'}
            aria-label="Refresh pull-request status"
            className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {activeTracking?.pullRequest ? (
        <TrackedPullRequestView tracking={activeTracking} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs leading-5 text-slate-500">
            IssuePilot can automatically find a PR authored by your connected account that references {repositoryFullName}#{issueNumber}. You can also paste its URL.
          </p>
          <div className="space-y-2">
            <label htmlFor="pull-request-url" className="text-xs text-slate-400">
              GitHub pull-request URL
            </label>
            <input
              id="pull-request-url"
              value={pullRequestUrl}
              onChange={(event) => setPullRequestUrl(event.target.value)}
              placeholder={`https://github.com/${repositoryFullName}/pull/123`}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-violet-500/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={status === 'loading'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === 'loading' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <GitPullRequest className="h-4 w-4" />
            )}
            {pullRequestUrl.trim() ? 'Track This Pull Request' : 'Detect My Pull Request'}
          </button>

          {activeTracking && !activeTracking.pullRequest && (
            <CandidateList candidates={activeTracking.candidates} onSelect={(candidate) => void handleSync(candidate.githubUrl)} />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/15 bg-rose-500/5 p-3 text-xs leading-5 text-rose-200/80">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {activeTracking?.metadata.note && (
            <p className="text-xs leading-5 text-amber-200/60">{activeTracking.metadata.note}</p>
          )}
        </div>
      )}
    </section>
  )
}

function TrackedPullRequestView({ tracking }: { tracking: PullRequestTrackingData }) {
  const pullRequest = tracking.pullRequest
  if (!pullRequest) return null

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyles[pullRequest.status]}`}>
            {statusLabel(pullRequest.status)}
          </span>
          <span className="text-[10px] text-slate-600">#{pullRequest.number}</span>
        </div>
        <a
          href={pullRequest.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-2 text-sm font-medium leading-5 text-white hover:text-violet-300"
        >
          <span>{pullRequest.title}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
        </a>
        <p className="mt-2 break-all text-[11px] text-slate-600">
          {pullRequest.headBranch} → {pullRequest.baseBranch}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <Metric label="Files" value={pullRequest.changedFiles} />
        <Metric label="Commits" value={pullRequest.commits} />
        <Metric label="Additions" value={`+${pullRequest.additions}`} positive />
        <Metric label="Deletions" value={`-${pullRequest.deletions}`} negative />
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.025] p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">Review decision</span>
          <span className="capitalize text-slate-300">{pullRequest.reviewDecision.replaceAll('_', ' ')}</span>
        </div>
        {pullRequest.requestedReviewers.length > 0 && (
          <p className="text-[11px] text-slate-600">
            Requested: {pullRequest.requestedReviewers.join(', ')}
          </p>
        )}
      </div>

      {pullRequest.timeline.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium text-slate-400">GitHub timeline</h3>
          <div className="space-y-2">
            {pullRequest.timeline.slice(-6).map((event, index) => (
              <div key={`${event.type}-${event.occurredAt}-${index}`} className="flex items-start gap-2 text-[11px] leading-4 text-slate-500">
                {event.type === 'merged' || event.type === 'approved' ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : event.type === 'changes_requested' ? (
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                )}
                <span>
                  {event.label}
                  {event.actor ? ` by ${event.actor}` : ''}
                  <span className="block text-slate-700">{new Date(event.occurredAt).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] leading-4 text-slate-700">
        Last synced {new Date(tracking.metadata.syncedAt).toLocaleString()}. GitHub does not push updates to this local version, so refresh after reviews or merges.
      </p>
    </div>
  )
}

function CandidateList({
  candidates,
  onSelect,
}: {
  candidates: PullRequestCandidate[]
  onSelect: (candidate: PullRequestCandidate) => void
}) {
  if (candidates.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400">Possible pull requests</p>
      {candidates.slice(0, 5).map((candidate) => (
        <button
          key={candidate.githubPullRequestId}
          type="button"
          onClick={() => onSelect(candidate)}
          className="w-full rounded-lg border border-white/5 bg-white/[0.025] p-3 text-left hover:border-violet-500/20"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-xs leading-5 text-slate-300">#{candidate.number} {candidate.title}</span>
            {candidate.referencesIssue && (
              <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-1 text-[9px] text-violet-300">
                References issue
              </span>
            )}
          </div>
          <p className="mt-1 text-[10px] text-slate-600">{candidate.headBranch} → {candidate.baseBranch}</p>
        </button>
      ))}
    </div>
  )
}

function Metric({
  label,
  value,
  positive,
  negative,
}: {
  label: string
  value: number | string
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2">
      <div className={`text-sm font-medium ${positive ? 'text-emerald-300' : negative ? 'text-rose-300' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-600">{label}</div>
    </div>
  )
}
