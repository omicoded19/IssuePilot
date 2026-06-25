import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CommandBlock } from '@/components/common/CommandBlock'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressTracker } from '@/components/common/ProgressTracker'
import { PullRequestTrackerCard } from '@/components/pull-requests/PullRequestTrackerCard'
import { createRecommendationRequest } from '@/lib/create-recommendation-request'
import { ApiClientError } from '@/services/api-client'
import { useIssueIntelligenceStore } from '@/store/issueIntelligenceStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'
import type { ContributionWorkspace } from '@/types/issue-intelligence'

export function WorkspacePage() {
  const params = useParams<{
    owner?: string
    repository?: string
    issueNumber?: string
  }>()
  const issueNumber = Number(params.issueNumber)

  if (params.owner && params.repository && Number.isInteger(issueNumber) && issueNumber > 0) {
    return (
      <RealWorkspacePage
        owner={params.owner}
        repository={params.repository}
        issueNumber={issueNumber}
      />
    )
  }

  return (
    <div className="glass-card">
      <EmptyState
        icon={ShieldCheck}
        title="Contribution workspace not found"
        description="Open a live issue recommendation and choose Prepare Contribution to create a tracked workspace."
        action={
          <Link
            to="/repositories"
            className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Find a repository
          </Link>
        }
      />
    </div>
  )
}

function RealWorkspacePage({
  owner,
  repository,
  issueNumber,
}: {
  owner: string
  repository: string
  issueNumber: number
}) {
  const profile = useUserStore((state) => state.profile)
  const contributionPreferences = useUserStore((state) => state.contributionPreferences)
  const availability = useUserStore((state) => state.availability)
  const skills = useSkillsStore((state) => state.skills)
  const workspace = useIssueIntelligenceStore((state) => state.workspace)
  const status = useIssueIntelligenceStore((state) => state.workspaceStatus)
  const error = useIssueIntelligenceStore((state) => state.error)
  const loadWorkspace = useIssueIntelligenceStore((state) => state.loadWorkspace)
  const createWorkspace = useIssueIntelligenceStore((state) => state.createWorkspace)
  const requestedWorkspace = useRef('')

  const matches =
    workspace?.username.toLowerCase() === profile.username.toLowerCase() &&
    workspace?.repository.owner.toLowerCase() === owner.toLowerCase() &&
    workspace?.repository.name.toLowerCase() === repository.toLowerCase() &&
    workspace?.issue.number === issueNumber

  useEffect(() => {
    if (!profile.githubConnected || !profile.username || skills.length === 0 || matches) return
    const key = `${profile.username.toLowerCase()}/${owner.toLowerCase()}/${repository.toLowerCase()}/${issueNumber}`
    if (requestedWorkspace.current === key) return
    requestedWorkspace.current = key

    const base = createRecommendationRequest({
      username: profile.username,
      skills,
      contributionPreferences,
      availability,
    })

    void loadWorkspace(profile.username, owner, repository, issueNumber).catch((loadError: unknown) => {
      if (loadError instanceof ApiClientError && loadError.code === 'WORKSPACE_NOT_FOUND') {
        return createWorkspace({
          ...base,
          owner,
          repository,
          issueNumber,
        })
      }
      return undefined
    })
  }, [
    availability,
    contributionPreferences,
    createWorkspace,
    issueNumber,
    loadWorkspace,
    matches,
    owner,
    profile.githubConnected,
    profile.username,
    repository,
    skills,
  ])

  if (!profile.githubConnected) {
    return (
      <div>
        <PageHeader title="Contribution Workspace" description="A GitHub profile is required for personalized guidance." />
        <EmptyState
          icon={ShieldCheck}
          title="Complete onboarding first"
          description="IssuePilot needs your edited skills and preferences to build a personalized contribution plan."
          action={<Link to="/onboarding" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Analyse GitHub Profile</Link>}
        />
      </div>
    )
  }

  if (!matches && status === 'loading') {
    return (
      <div>
        <PageHeader title="Preparing Contribution Workspace" description={`${owner}/${repository} #${issueNumber}`} />
        <div className="glass-card flex items-center justify-center gap-3 p-14 text-slate-400">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
          Reading the issue discussion and building repository-specific guidance
        </div>
      </div>
    )
  }

  if (!matches || !workspace) {
    return (
      <div>
        <PageHeader title="Contribution Workspace" description={`${owner}/${repository} #${issueNumber}`} />
        <EmptyState
          icon={AlertTriangle}
          title="Workspace could not be prepared"
          description={error ?? 'Analyse the repository and generate issue recommendations before opening a workspace.'}
          action={<Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Analyse Repository</Link>}
        />
      </div>
    )
  }

  return <RealWorkspaceView key={`${workspace.id}-${workspace.metadata.updatedAt}`} workspace={workspace} />
}

function RealWorkspaceView({ workspace }: { workspace: ContributionWorkspace }) {
  const [progress, setProgress] = useState(workspace.progress)
  const [personalNotes, setPersonalNotes] = useState(workspace.personalNotes)
  const [savedMessage, setSavedMessage] = useState('')
  const saveWorkspace = useIssueIntelligenceStore((state) => state.saveWorkspace)
  const status = useIssueIntelligenceStore((state) => state.workspaceStatus)

  const toggleProgress = (id: string) => {
    setProgress((current) => current.map((step) => (
      step.id === id ? { ...step, completed: !step.completed } : step
    )))
  }

  const synchronizeProgress = useCallback((nextProgress: ContributionWorkspace['progress']) => {
    setProgress(nextProgress)
  }, [])

  const handleSave = async () => {
    const saved = await saveWorkspace({ progress, personalNotes })
    setProgress(saved.progress)
    setPersonalNotes(saved.personalNotes)
    setSavedMessage('Progress saved to PostgreSQL.')
    window.setTimeout(() => setSavedMessage(''), 2_500)
  }

  return (
    <div>
      <PageHeader
        title={workspace.issue.title}
        description={`#${workspace.issue.number} · ${workspace.repository.fullName} · ${workspace.issue.matchScore}% personal match`}
        breadcrumbs={[
          { label: 'Repositories' },
          { label: workspace.repository.fullName },
          { label: 'Contribution Workspace' },
        ]}
        actions={
          <a
            href={workspace.issue.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            Open issue <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
          Real issue and comments
        </span>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
          Deterministic guidance
        </span>
        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-300">
          PostgreSQL workspace
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <Card title="Issue Summary">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">{workspace.issueSummary}</p>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Current Behavior">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">{workspace.currentBehavior}</p>
            </Card>
            <Card title="Expected Behavior">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">{workspace.expectedBehavior}</p>
            </Card>
          </div>

          <Card title="Concepts to Understand">
            <div className="flex flex-wrap gap-2">
              {workspace.requiredConcepts.map((concept) => (
                <span key={concept} className="rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-200/80">
                  {concept}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Repository Areas to Inspect">
            <p className="mb-4 text-xs text-amber-200/60">
              These are evidence-based starting points, not guaranteed implementation files.
            </p>
            <div className="space-y-2">
              {workspace.inspectionTargets.length === 0 ? (
                <p className="text-sm text-slate-500">No reliable root-level inspection target was detected.</p>
              ) : workspace.inspectionTargets.map((target) => (
                <div key={target.path} className="rounded-lg border border-white/5 bg-white/[0.025] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-sm text-cyan-300">{target.path}</code>
                    <span className="text-[10px] uppercase tracking-wide text-slate-600">{target.confidence} confidence</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{target.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Suggested Contribution Approach">
            <ol className="space-y-3">
              {workspace.suggestedApproach.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-400">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs text-indigo-300">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Setup and Git Commands">
            <div className="space-y-3">
              {workspace.setup.installCommand && <CommandBlock label="Install dependencies" command={workspace.setup.installCommand} />}
              {workspace.setup.developmentCommand && <CommandBlock label="Start development" command={workspace.setup.developmentCommand} />}
              {workspace.setup.testCommand && <CommandBlock label="Run tests" command={workspace.setup.testCommand} />}
              {workspace.setup.lintCommand && <CommandBlock label="Run lint" command={workspace.setup.lintCommand} />}
              {workspace.gitCommands.map((command) => <CommandBlock key={command.label} label={command.label} command={command.command} />)}
            </div>
          </Card>

          <TemplateCard title="Maintainer Message" content={workspace.maintainerMessage} />
          <TemplateCard title="Pull Request Description" content={workspace.pullRequestDescription} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChecklistCard title="Testing Checklist" items={workspace.testingChecklist} />
            <ChecklistCard title="Pull Request Checklist" items={workspace.pullRequestChecklist} />
          </div>

          {workspace.issue.recentComments.length > 0 && (
            <Card title="Recent Issue Discussion">
              <div className="space-y-3">
                {workspace.issue.recentComments.map((comment) => (
                  <a
                    key={`${comment.githubUrl}-${comment.createdAt}`}
                    href={comment.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-white/5 bg-white/[0.025] p-3 hover:border-cyan-500/15"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {comment.author ?? 'Unknown contributor'} · {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-slate-400">{comment.body}</p>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </main>

        <aside className="space-y-6">
          <PullRequestTrackerCard
            workspaceId={workspace.id}
            repositoryFullName={workspace.repository.fullName}
            issueNumber={workspace.issue.number}
            onProgressSynchronized={synchronizeProgress}
          />

          <Card title="Contribution Progress">
            <ProgressTracker steps={progress} onToggle={toggleProgress} />
          </Card>

          <Card title="Personal Notes">
            <textarea
              value={personalNotes}
              onChange={(event) => setPersonalNotes(event.target.value)}
              rows={8}
              placeholder="Record files inspected, errors encountered, maintainer instructions, and your next action..."
              className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/40 focus:outline-none"
            />
          </Card>

          <Card title="Issue Match">
            <ScoreRow label="Overall" value={workspace.issue.matchScore} />
            <ScoreRow label="Skills" value={workspace.issue.scoreBreakdown.skillMatch} />
            <ScoreRow label="Preferences" value={workspace.issue.scoreBreakdown.contributionPreferenceMatch} />
            <ScoreRow label="Difficulty fit" value={workspace.issue.scoreBreakdown.difficultyFit} />
            <ScoreRow label="Availability" value={workspace.issue.scoreBreakdown.availability} />
          </Card>

          <Card title="Warnings and Uncertainty">
            <div className="space-y-2">
              {[...workspace.issue.warnings, ...workspace.metadata.uncertaintyNotes].map((warning) => (
                <div key={warning} className="flex items-start gap-2 text-xs leading-5 text-amber-200/70">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  {warning}
                </div>
              ))}
            </div>
          </Card>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={status === 'loading'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === 'loading' && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Save Progress
          </button>
          {savedMessage && <p className="text-center text-xs text-emerald-300">{savedMessage}</p>}
        </aside>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-5">
      <h2 className="mb-3 font-medium text-white">{title}</h2>
      {children}
    </section>
  )
}

function TemplateCard({ title, content }: { title: string; content: string }) {
  return (
    <section className="glass-card border border-violet-500/20 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <h2 className="font-medium text-white">{title}</h2>
      </div>
      <p className="mb-3 text-xs text-violet-300/60">Generated as a template — review and personalize it before posting.</p>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-400">{content}</pre>
    </section>
  )
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-400">
              <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-cyan-500" />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-300">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

