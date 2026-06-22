import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, ExternalLink, GitFork, Star } from 'lucide-react'
import { MatchScoreRing } from '@/components/common/MatchScoreRing'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { CommandBlock } from '@/components/common/CommandBlock'
import { PreparationFlow } from '@/components/flow/PreparationFlow'
import { getRepositoryAnalysis } from '@/data/repositories'
import { useSavedStore } from '@/store/savedStore'
import type { FolderNode } from '@/types/repository'
import { cn } from '@/lib/cn'

const tabs = ['Overview', 'Preparation Flow', 'Architecture', 'Setup', 'Issues', 'Contribution Rules', 'Pull Request Patterns'] as const
type Tab = (typeof tabs)[number]

function FolderTree({ nodes, depth = 0 }: { nodes: FolderNode[]; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-white/10 pl-3' : ''}>
      {nodes.map((node) => (
        <li key={node.name} className="py-0.5">
          <span className={cn('text-sm font-mono', node.type === 'folder' ? 'text-cyan-400' : 'text-slate-400')}>
            {node.type === 'folder' ? '📁' : '📄'} {node.name}
          </span>
          {node.children && <FolderTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}

export function MockRepositoryAnalysisPage() {
  const { repositoryId } = useParams<{ repositoryId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { toggleRepository, isRepositorySaved } = useSavedStore()

  const analysis = getRepositoryAnalysis(repositoryId ?? 'appwrite-sdk-for-web')
  if (!analysis) {
    return <div className="text-center py-12 text-slate-400">Repository not found.</div>
  }

  const saved = isRepositorySaved(analysis.id)

  return (
    <div>
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-white">{analysis.fullName}</h1>
              <span className="text-sm text-slate-500">{analysis.organization}</span>
            </div>
            <p className="text-slate-400 mt-2">{analysis.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Star className="w-4 h-4" />{analysis.stars.toLocaleString()}</span>
              <span className="flex items-center gap-1"><GitFork className="w-4 h-4" />{analysis.forks.toLocaleString()}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" />{analysis.primaryLanguage}</span>
              <span>Updated {analysis.lastUpdated}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MatchScoreRing score={analysis.overallMatchScore} label="Match" />
            <div className="flex flex-col gap-2">
              <a
                href={analysis.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-white/10 rounded-lg text-slate-300 hover:border-white/20"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => toggleRepository(analysis.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors',
                  saved ? 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10' : 'border-white/10 text-slate-300'
                )}
              >
                <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-indigo-600/80 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-medium text-white">Technology Stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.technologyStack.map((t) => <TechnologyBadge key={t} name={t} />)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Difficulty" value={analysis.difficulty} />
              <Stat label="Setup Complexity" value={analysis.setupComplexity} />
              <Stat label="Repository Health" value={`${analysis.repositoryHealth}%`} />
              <Stat label="Maintainer Activity" value={`${analysis.maintainerActivityScore}%`} />
              <Stat label="Documentation Quality" value={`${analysis.documentationQuality}%`} />
              <Stat label="Beginner Friendliness" value={`${analysis.beginnerFriendliness}%`} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-2">Why It Matches You</h3>
              <p className="text-sm text-slate-400">{analysis.matchReason}</p>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-2">Possible Challenges</h3>
              <ul className="space-y-2">
                {analysis.possibleChallenges.map((c) => (
                  <li key={c} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">⚠</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Preparation Flow' && <PreparationFlow />}

      {activeTab === 'Architecture' && (
        <div className="space-y-6">
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Repository Summary</h3>
            <p className="text-sm text-slate-400">{analysis.architecture.summary}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-3">Important Folders</h3>
              <div className="space-y-3">
                {analysis.architecture.importantFolders.map((f) => (
                  <div key={f.name} className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-cyan-400">{f.name}</code>
                      <ConfidenceBadge level={f.confidence} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-medium text-white mb-3">Important Files</h3>
              <div className="space-y-3">
                {analysis.architecture.importantFiles.map((f) => (
                  <div key={f.path} className="p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-indigo-400">{f.path}</code>
                      <ConfidenceBadge level={f.confidence} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Data Flow</h3>
            <div className="flex flex-wrap items-center gap-2">
              {analysis.architecture.dataFlow.map((step, i) => (
                <div key={step.from} className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
                    <p className="text-xs font-medium text-white">{step.from}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                  {i < analysis.architecture.dataFlow.length - 1 && (
                    <span className="text-indigo-400">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-3">Folder Tree</h3>
            <FolderTree nodes={analysis.architecture.folderTree} />
          </div>
        </div>
      )}

      {activeTab === 'Setup' && (
        <div className="glass-card p-5 space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Node.js Version" value={analysis.setup.nodeVersion} />
            <Stat label="Package Manager" value={analysis.setup.packageManager} />
            <Stat label="Docker Required" value={analysis.setup.dockerRequired ? 'Yes' : 'No'} />
            <Stat label="Env Variables Required" value={analysis.setup.envRequired ? 'Yes' : 'No'} />
          </div>
          <CommandBlock label="Install" command={analysis.setup.installCommand} />
          <CommandBlock label="Development" command={analysis.setup.devCommand} />
          <CommandBlock label="Test" command={analysis.setup.testCommand} />
          <CommandBlock label="Lint" command={analysis.setup.lintCommand} />
          {analysis.setup.envRequired && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Required environment variables:</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.setup.envVariables.map((v) => (
                  <code key={v} className="text-xs px-2 py-1 rounded bg-white/5 text-cyan-300">{v}</code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Issues' && (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">{analysis.suitableIssueCount} suitable issues found for your profile.</p>
          <Link
            to={`/repositories/${analysis.id}/issues`}
            className="inline-flex px-6 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            View Issue Recommendations
          </Link>
        </div>
      )}

      {activeTab === 'Contribution Rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RuleCard title="README Summary" content={analysis.contributionRules.readmeSummary} />
          <RuleCard title="CONTRIBUTING.md" content={analysis.contributionRules.contributingSummary} />
          <RuleCard title="Commit Conventions" content={analysis.contributionRules.commitConventions} />
          <RuleCard title="Branch Conventions" content={analysis.contributionRules.branchConventions} />
          <RuleCard title="Testing Expectations" content={analysis.contributionRules.testingExpectations} />
          <RuleCard title="Pull Request Requirements" content={analysis.contributionRules.prRequirements} />
        </div>
      )}

      {activeTab === 'Pull Request Patterns' && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Average Review Time" value={analysis.prPatterns.averageReviewTime} />
            <Stat label="Typical PR Size" value={analysis.prPatterns.typicalPrSize} />
            <Stat label="Merge Rate" value={`${analysis.prPatterns.mergeRate}%`} />
          </div>
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">Common Feedback</h3>
            <ul className="space-y-1">
              {analysis.prPatterns.commonFeedback.map((f) => (
                <li key={f} className="text-sm text-slate-400">• {f}</li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-medium text-white mb-2">First Contribution Tips</h3>
            <ul className="space-y-1">
              {analysis.prPatterns.firstContributionTips.map((t) => (
                <li key={t} className="text-sm text-slate-400">• {t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const colors = { High: 'text-emerald-400 bg-emerald-400/10', Medium: 'text-amber-400 bg-amber-400/10', Low: 'text-slate-400 bg-slate-800' }
  return <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', colors[level])}>AI: {level}</span>
}

function RuleCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="glass-card p-5">
      <h3 className="font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{content}</p>
    </div>
  )
}
