import { useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { CommandBlock } from '@/components/common/CommandBlock'
import { ProgressTracker } from '@/components/common/ProgressTracker'
import { getIssueById, getWorkspaceData } from '@/data/issues'
import { getRepositoryById } from '@/data/repositories'
import { useProgressStore } from '@/store/progressStore'

export function WorkspacePage() {
  const { issueId } = useParams<{ issueId: string }>()
  const issue = getIssueById(issueId ?? 'issue-validation-account')
  const workspace = getWorkspaceData(issueId ?? 'issue-validation-account')
  const repo = issue ? getRepositoryById(issue.repositoryId) : null

  const { workspaceSteps, toggleWorkspaceStep, personalNotes, setPersonalNotes, saveProgress } = useProgressStore()

  if (!issue || !workspace) {
    return <div className="text-center py-12 text-slate-400">Workspace not found.</div>
  }

  return (
    <div>
      <PageHeader
        title={issue.title}
        description={`#${issue.number} · ${repo?.fullName ?? 'Repository'} · ${issue.matchScore}% match`}
        breadcrumbs={[
          { label: 'Repositories' },
          { label: repo?.fullName ?? '' },
          { label: 'Workspace' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Issue summary */}
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Issue Summary</h3>
            <p className="text-sm text-slate-400">{issue.body ?? issue.matchReason}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-2">Current Behavior</h3>
              <p className="text-sm text-slate-400">{workspace.currentBehavior}</p>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-2">Expected Behavior</h3>
              <p className="text-sm text-slate-400">{workspace.expectedBehavior}</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Required Concepts</h3>
            <ul className="space-y-1">
              {workspace.requiredConcepts.map((c) => (
                <li key={c} className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />{c}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Likely Relevant Files</h3>
            <div className="space-y-2">
              {workspace.likelyRelevantFiles.map((f) => (
                <div key={f.path} className="p-3 rounded-lg bg-white/3 border border-white/5">
                  <code className="text-sm text-cyan-400">{f.path}</code>
                  <p className="text-xs text-slate-500 mt-1">{f.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Suggested Approach</h3>
            <ol className="space-y-2">
              {workspace.suggestedApproach.map((step, i) => (
                <li key={step} className="text-sm text-slate-400 flex gap-2">
                  <span className="text-cyan-400 font-medium shrink-0">{i + 1}.</span>{step}
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Possible Risks</h3>
            <ul className="space-y-1">
              {workspace.possibleRisks.map((r) => (
                <li key={r} className="text-sm text-amber-400/80">⚠ {r}</li>
              ))}
            </ul>
          </div>

          {/* AI suggestions */}
          <AISuggestion title="Maintainer Message" content={workspace.maintainerMessagePreview} />
          <AISuggestion title="Pull Request Description" content={workspace.prDescriptionPreview} />

          {/* Git commands */}
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-4">Git Commands</h3>
            <div className="space-y-3">
              {workspace.gitCommands.map((cmd) => (
                <CommandBlock key={cmd.label} label={cmd.label} command={cmd.command} />
              ))}
            </div>
          </div>

          {/* Checklists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChecklistCard title="Testing Checklist" items={workspace.testingChecklist} />
            <ChecklistCard title="Pull Request Checklist" items={workspace.prChecklist} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-4">Preparation Progress</h3>
            <ProgressTracker
              steps={workspaceSteps}
              onToggle={(id) => toggleWorkspaceStep(id as typeof workspaceSteps[0]['id'])}
            />
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Maintainer Instructions</h3>
            <p className="text-sm text-slate-400">{workspace.maintainerInstructions}</p>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Personal Notes</h3>
            <textarea
              value={personalNotes || workspace.personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              rows={4}
              placeholder="Add your notes here..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Files Inspected</h3>
            <ul className="space-y-1">
              {workspace.filesInspected.map((f) => (
                <li key={f} className="text-xs font-mono text-slate-400">{f}</li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Commands Executed</h3>
            <ul className="space-y-1">
              {workspace.commandsExecuted.map((c) => (
                <li key={c} className="text-xs font-mono text-emerald-400/80">{c}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={saveProgress}
            className="w-full py-2.5 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
          >
            Save Progress
          </button>
        </div>
      </div>
    </div>
  )
}

function AISuggestion({ title, content }: { title: string; content: string }) {
  return (
    <div className="glass-card p-5 border border-violet-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <p className="text-xs text-violet-300/70 mb-2 italic">
        Suggested by IssuePilot — verify against the repository before editing.
      </p>
      <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans">{content}</pre>
    </div>
  )
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass-card p-5">
      <h3 className="font-medium text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <label className="flex items-start gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5 text-cyan-500" />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
