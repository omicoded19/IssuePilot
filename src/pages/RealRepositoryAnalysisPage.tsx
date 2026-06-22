import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Folder,
  GitFork,
  Info,
  Star,
  Users,
} from 'lucide-react'
import { CommandBlock } from '@/components/common/CommandBlock'
import { MatchScoreRing } from '@/components/common/MatchScoreRing'
import { PreparationFlow } from '@/components/flow/PreparationFlow'
import { useSavedStore } from '@/store/savedStore'
import type {
  AnalysisScore,
  DetectionConfidence,
  RealRepositoryAnalysis,
  RepositoryDocument,
} from '@/types/repository-analysis'
import { cn } from '@/lib/cn'
import { createRepositoryRouteId } from '@/services/repository-api'

const tabs = [
  'Overview',
  'Preparation Flow',
  'Structure',
  'Setup',
  'Issues',
  'Contribution Files',
] as const

type Tab = (typeof tabs)[number]

interface RealRepositoryAnalysisPageProps {
  analysis: RealRepositoryAnalysis
}

function formatDate(value: string | null): string {
  if (!value) return 'Not detected'
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function readinessScore(analysis: RealRepositoryAnalysis): number {
  const values = Object.values(analysis.scores).map((entry) => entry.value)
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function RealRepositoryAnalysisPage({
  analysis,
}: RealRepositoryAnalysisPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const { toggleRepository, isRepositorySaved } = useSavedStore()
  const repository = analysis.repository
  const savedId = repository.fullName.toLowerCase()
  const saved = isRepositorySaved(savedId)
  const overallReadiness = useMemo(() => readinessScore(analysis), [analysis])

  return (
    <div>
      <div className="glass-card mb-6 p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-all text-2xl font-semibold text-white">
                {repository.fullName}
              </h1>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                Real GitHub data
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-300">
                Deterministic analysis
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-slate-400">
              {repository.description ?? 'No repository description was provided.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {repository.stars.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                {repository.forks.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {repository.watchers.toLocaleString()} watchers
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                {repository.primaryLanguage ?? 'Not detected'}
              </span>
              <span>Last push {formatDate(repository.githubPushedAt)}</span>
            </div>
            {repository.topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {repository.topics.slice(0, 10).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <MatchScoreRing score={overallReadiness} label="Readiness" />
            <div className="flex flex-col gap-2">
              <a
                href={repository.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/20"
              >
                GitHub <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => toggleRepository(savedId)}
                className={cn(
                  'inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  saved
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                    : 'border-white/10 text-slate-300',
                )}
              >
                <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-colors',
              activeTab === tab
                ? 'bg-indigo-600/80 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <Overview analysis={analysis} />}
      {activeTab === 'Preparation Flow' && (
        <PreparationFlow repositoryAnalysis={analysis} />
      )}
      {activeTab === 'Structure' && <Structure analysis={analysis} />}
      {activeTab === 'Setup' && <Setup analysis={analysis} />}
      {activeTab === 'Issues' && <Issues analysis={analysis} />}
      {activeTab === 'Contribution Files' && (
        <ContributionFiles analysis={analysis} />
      )}
    </div>
  )
}

function Overview({ analysis }: RealRepositoryAnalysisPageProps) {
  const scoreEntries: Array<[string, AnalysisScore]> = [
    ['Documentation Quality', analysis.scores.documentationQuality],
    ['Beginner Friendliness', analysis.scores.beginnerFriendliness],
    ['Repository Activity', analysis.scores.repositoryActivity],
    ['Setup Simplicity', analysis.scores.setupSimplicity],
    ['Contribution Readiness', analysis.scores.contributionReadiness],
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {scoreEntries.map(([label, value]) => (
          <ScoreCard key={label} label={label} score={value} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="font-medium text-white">Detected Technologies</h2>
          <p className="mt-1 text-xs text-slate-500">
            Every item below includes the evidence used by IssuePilot.
          </p>
          {analysis.technologies.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No technology was detected.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {analysis.technologies.map((technology) => (
                <div
                  key={`${technology.name}-${technology.evidence}`}
                  className="rounded-lg border border-white/5 bg-white/3 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {technology.name}
                      </p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        {technology.category}
                      </p>
                    </div>
                    <ConfidenceBadge confidence={technology.confidence} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {technology.evidence}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="font-medium text-white">Language Breakdown</h2>
          <p className="mt-1 text-xs text-slate-500">
            GitHub code-byte percentages, not developer proficiency.
          </p>
          {analysis.languages.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No language data was returned.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {analysis.languages.slice(0, 8).map((language) => (
                <div key={language.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{language.name}</span>
                    <span className="text-slate-500">{language.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                      style={{ width: `${Math.max(language.percentage, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-medium text-white">Repository Facts</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Default branch" value={analysis.repository.defaultBranch} />
          <Fact label="License" value={analysis.repository.license ?? 'Not detected'} />
          <Fact label="Open issues" value={analysis.repository.openIssuesCount.toLocaleString()} />
          <Fact label="Repository size" value={`${analysis.repository.repositorySize.toLocaleString()} KB`} />
          <Fact label="Archived" value={analysis.repository.isArchived ? 'Yes' : 'No'} />
          <Fact label="Fork" value={analysis.repository.isFork ? 'Yes' : 'No'} />
        </div>
      </div>
    </div>
  )
}

function ScoreCard({
  label,
  score,
}: {
  label: string
  score: AnalysisScore
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{label}</p>
        <span className="text-lg font-semibold text-white">{score.value}%</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
          style={{ width: `${score.value}%` }}
        />
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-slate-500">
        {score.reasons[0] ?? score.penalties[0] ?? 'No scoring evidence available.'}
      </p>
    </div>
  )
}

function Structure({ analysis }: RealRepositoryAnalysisPageProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-card p-5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
          <div>
            <h2 className="font-medium text-white">Root-level repository map</h2>
            <p className="mt-1 text-xs text-slate-500">
              This phase inspects the repository root only. Deep architecture and relevant-file analysis will be added later.
            </p>
          </div>
        </div>
        <div className="mt-5 divide-y divide-white/5">
          {analysis.rootStructure.map((entry) => (
            <a
              key={entry.path}
              href={entry.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-white/[0.02]"
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-300">
                {entry.type === 'dir' ? (
                  <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
                ) : (
                  <FileCode2 className="h-4 w-4 shrink-0 text-indigo-400" />
                )}
                <span className="truncate font-mono text-xs">{entry.path}</span>
              </span>
              <span className="text-[11px] uppercase tracking-wide text-slate-600">
                {entry.type}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <ReadinessList analysis={analysis} />
        <div className="glass-card p-5">
          <h2 className="font-medium text-white">Analysis metadata</h2>
          <div className="mt-4 space-y-3">
            <Fact label="Source" value={analysis.analysisMetadata.source} />
            <Fact label="AI generated" value="No" />
            <Fact label="Stored in PostgreSQL" value={analysis.analysisMetadata.persisted ? 'Yes' : 'No'} />
            <Fact label="Analysed" value={formatDate(analysis.analysisMetadata.analysedAt)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadinessList({ analysis }: RealRepositoryAnalysisPageProps) {
  const entries = [
    ['README', analysis.contributionReadiness.hasReadme],
    ['Contribution guide', analysis.contributionReadiness.hasContributingGuide],
    ['Code of conduct', analysis.contributionReadiness.hasCodeOfConduct],
    ['Security policy', analysis.contributionReadiness.hasSecurityPolicy],
    ['Issue templates', analysis.contributionReadiness.hasIssueTemplates],
    ['Pull-request template', analysis.contributionReadiness.hasPullRequestTemplate],
    ['Tests', analysis.contributionReadiness.hasTests],
    ['Linting', analysis.contributionReadiness.hasLintConfiguration],
    ['Type checking', analysis.contributionReadiness.hasTypeChecking],
  ]

  return (
    <div className="glass-card p-5">
      <h2 className="font-medium text-white">Contribution readiness signals</h2>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map(([label, detected]) => (
          <div
            key={String(label)}
            className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-sm"
          >
            {detected ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span className={detected ? 'text-slate-300' : 'text-slate-500'}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Setup({ analysis }: RealRepositoryAnalysisPageProps) {
  const setup = analysis.setup
  const commands = [
    ['Install', setup.installCommand],
    ['Development', setup.developmentCommand],
    ['Build', setup.buildCommand],
    ['Test', setup.testCommand],
    ['Lint', setup.lintCommand],
    ['Format', setup.formatCommand],
    ['Type check', setup.typecheckCommand],
  ] as const

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="glass-card p-5">
        <h2 className="font-medium text-white">Detected requirements</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Fact label="Package manager" value={setup.packageManager ?? 'Not detected'} />
          <Fact label="Node.js version" value={setup.nodeVersion ?? 'Not detected'} />
          <Fact label="Docker" value={setup.requiresDocker ? 'Detected' : 'Not detected'} />
          <Fact
            label="Environment example"
            value={setup.hasEnvironmentExample ? 'Detected' : 'Not detected'}
          />
        </div>
        {setup.environmentFileNames.length > 0 && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Environment files
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {setup.environmentFileNames.map((name) => (
                <code
                  key={name}
                  className="rounded bg-white/5 px-2 py-1 text-xs text-cyan-300"
                >
                  {name}
                </code>
              ))}
            </div>
          </div>
        )}
        {setup.confidenceNotes.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-400/15 bg-amber-400/5 p-3">
            {setup.confidenceNotes.map((note) => (
              <p key={note} className="text-xs text-amber-200/80">
                {note}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card space-y-4 p-5">
        <h2 className="font-medium text-white">Detected commands</h2>
        {commands.map(([label, command]) =>
          command ? (
            <CommandBlock key={label} label={label} command={command} />
          ) : (
            <div
              key={label}
              className="rounded-lg border border-dashed border-white/10 px-3 py-2"
            >
              <p className="text-xs text-slate-500">{label}: Not detected</p>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function Issues({ analysis }: RealRepositoryAnalysisPageProps) {
  if (analysis.issues.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <h2 className="font-medium text-white">No suitable open issues detected</h2>
        <p className="mt-2 text-sm text-slate-400">
          Check the repository directly; labels may not follow common beginner conventions.
        </p>
      </div>
    )
  }

  const routeId = createRepositoryRouteId(analysis.repository.owner, analysis.repository.name)

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-cyan-100/80">
          Availability is conservative. Generate personalized scores and read the full discussion before starting.
        </p>
        <Link
          to={`/repositories/${routeId}/issues`}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Personalize these issues
        </Link>
      </div>
      {analysis.issues.map((issue) => (
        <article key={issue.githubIssueId} className="glass-card p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">#{issue.number}</span>
                <AvailabilityBadge status={issue.availabilityStatus} />
              </div>
              <h2 className="mt-2 font-medium text-white">{issue.title}</h2>
              {issue.bodyPreview && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-400">
                  {issue.bodyPreview}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                {issue.availabilityExplanation}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 text-xs text-slate-500 lg:items-end">
              <span>{issue.comments} comments</span>
              <span>{issue.assignees.length} assignees</span>
              <a
                href={issue.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-cyan-300 hover:border-cyan-400/30"
              >
                Open issue <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function ContributionFiles({ analysis }: RealRepositoryAnalysisPageProps) {
  const entries: Array<[string, RepositoryDocument]> = [
    ['README', analysis.documents.readme],
    ['Contribution guide', analysis.documents.contributing],
    ['Code of conduct', analysis.documents.codeOfConduct],
    ['Security policy', analysis.documents.security],
    ['Pull-request template', analysis.documents.pullRequestTemplate],
    ['Package manifest', analysis.documents.packageManifest],
  ]

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {entries.map(([label, document]) => (
        <div key={label} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <div>
              <h2 className="font-medium text-white">{label}</h2>
              <p className="mt-1 font-mono text-xs text-slate-500">{document.path}</p>
            </div>
            {document.exists ? (
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                Detected
              </span>
            ) : (
              <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                Not detected
              </span>
            )}
          </div>
          <div className="p-4">
            {document.contentPreview ? (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-400">
                {document.contentPreview}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">
                {document.exists
                  ? 'The file exists, but its preview was unavailable or too large.'
                  : 'This file was not found in the analysed repository locations.'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AvailabilityBadge({
  status,
}: {
  status: RealRepositoryAnalysis['issues'][number]['availabilityStatus']
}) {
  const styles = {
    probably_available: 'bg-emerald-400/10 text-emerald-300',
    possibly_claimed: 'bg-rose-400/10 text-rose-300',
    needs_review: 'bg-amber-400/10 text-amber-300',
  }
  const labels = {
    probably_available: 'Probably available',
    possibly_claimed: 'Possibly claimed',
    needs_review: 'Review comments',
  }
  return (
    <span className={cn('rounded-full px-2 py-1 text-[11px]', styles[status])}>
      {labels[status]}
    </span>
  )
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: DetectionConfidence
}) {
  const styles = {
    high: 'bg-emerald-400/10 text-emerald-300',
    medium: 'bg-amber-400/10 text-amber-300',
    low: 'bg-slate-700/60 text-slate-300',
  }
  return (
    <span className={cn('rounded-full px-2 py-1 text-[10px] uppercase', styles[confidence])}>
      {confidence} confidence
    </span>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}
