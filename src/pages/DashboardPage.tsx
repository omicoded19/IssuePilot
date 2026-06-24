import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  GitBranch,
  GitPullRequest,
  Sparkles,
  UserRound,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/common/ChartCard'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { RepositoryCard } from '@/components/repositories/RepositoryCard'
import {
  mapRecommendedOrganization,
  mapRecommendedRepository,
} from '@/lib/recommendation-mappers'
import { useAnalyticsStore } from '@/store/analyticsStore'
import { useAuthStore } from '@/store/authStore'
import { useIssueIntelligenceStore } from '@/store/issueIntelligenceStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useSkillsStore } from '@/store/skillsStore'

const tooltipStyle = {
  contentStyle: {
    background: '#0b0b0b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  cursor: { fill: 'rgba(74, 222, 128, 0.05)' },
}

function formatActivityTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString()
}

export function DashboardPage() {
  const authUser = useAuthStore((state) => state.user)
  const skills = useSkillsStore((state) => state.skills)
  const analytics = useAnalyticsStore((state) => state.data)
  const analyticsStatus = useAnalyticsStore((state) => state.status)
  const loadAnalytics = useAnalyticsStore((state) => state.load)
  const recommendationData = useRecommendationStore((state) => state.data)
  const workspace = useIssueIntelligenceStore((state) => state.workspace)
  const requestedUser = useRef<string | null>(null)

  useEffect(() => {
    if (!authUser) return
    if (requestedUser.current === authUser.id && analytics) return

    requestedUser.current = authUser.id
    void loadAnalytics().catch(() => undefined)
  }, [analytics, authUser, loadAnalytics])

  const organizations = useMemo(
    () => recommendationData?.organizations.map(mapRecommendedOrganization) ?? [],
    [recommendationData],
  )
  const repositories = useMemo(
    () => recommendationData?.repositories.map(mapRecommendedRepository) ?? [],
    [recommendationData],
  )

  const currentContribution = useMemo(() => {
    if (!workspace) return null

    const completed = workspace.progress.filter((step) => step.completed).length
    const total = workspace.progress.length
    const nextStep = workspace.progress.find((step) => !step.completed)

    return {
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      currentStep: nextStep?.label ?? 'Contribution complete',
      route: `/workspace/${workspace.repository.owner}/${workspace.repository.name}/${workspace.issue.number}`,
    }
  }, [workspace])

  const loadingAnalytics = analyticsStatus === 'loading' && !analytics

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${authUser?.displayName ?? 'Contributor'}`}
        description={
          authUser
            ? `@${authUser.username} · Secure GitHub session connected`
            : 'Secure GitHub session connected'
        }
        actions={
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
          >
            <UserRound className="h-4 w-4" />
            Developer profile
          </Link>
        }
      />

      {loadingAnalytics ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : analytics ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {analytics.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              trendLabel={metric.trendLabel}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card mb-6">
          <EmptyState
            icon={Activity}
            title="No contribution activity yet"
            description="Analyse your GitHub profile and generate recommendations to start building real dashboard metrics."
            action={
              <Link
                to="/profile"
                className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
              >
                Analyse GitHub profile
              </Link>
            }
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">Detected Technology Stack</h2>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <TechnologyBadge
                  key={skill.id}
                  name={`${skill.name} · ${skill.proficiency}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <p className="text-sm text-slate-400">No technologies detected yet.</p>
              <Link
                to="/onboarding"
                className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
              >
                Analyse your GitHub repositories <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="glass-card p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-medium text-slate-300">Current Contribution</h2>
          {workspace && currentContribution ? (
            <>
              <p className="font-medium text-white">{workspace.issue.title}</p>
              <p className="mt-1 text-sm text-slate-400">{workspace.repository.fullName}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{currentContribution.currentStep}</span>
                  <span>{currentContribution.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                    style={{ width: `${currentContribution.progress}%` }}
                  />
                </div>
              </div>
              <Link
                to={currentContribution.route}
                className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
              >
                Open workspace <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <EmptyState
              icon={GitPullRequest}
              title="No active contribution workspace"
              description="Choose a personalized repository and issue to begin a guided contribution."
              className="py-6"
              action={
                <Link
                  to="/repositories"
                  className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
                >
                  Browse repositories
                </Link>
              }
            />
          )}
        </div>
      </div>

      {analytics && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Contribution Activity — Last 8 Weeks">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={analytics.contributionActivity}>
                <defs>
                  <linearGradient id="dashboardActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stroke="#4ade80"
                  fill="url(#dashboardActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Contribution Funnel">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={analytics.contributionFunnel} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  width={92}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Top Organization Matches</h2>
            <Link to="/organizations" className="text-xs text-cyan-400 hover:text-cyan-300">
              View all
            </Link>
          </div>
          {organizations.length > 0 ? (
            <div className="space-y-3">
              {organizations.slice(0, 2).map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </div>
          ) : (
            <div className="glass-card">
              <EmptyState
                icon={Sparkles}
                title="No organization matches yet"
                description="Generate recommendations after your profile analysis to see real matches."
                className="py-8"
                action={
                  <Link
                    to="/repositories"
                    className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
                  >
                    Generate recommendations
                  </Link>
                }
              />
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">Recommended Repositories</h2>
            <Link to="/repositories" className="text-xs text-cyan-400 hover:text-cyan-300">
              View all
            </Link>
          </div>
          {repositories.length > 0 ? (
            <div className="space-y-3">
              {repositories.slice(0, 2).map((repository) => (
                <RepositoryCard key={repository.id} repository={repository} viewMode="list" />
              ))}
            </div>
          ) : (
            <div className="glass-card">
              <EmptyState
                icon={GitBranch}
                title="No repository matches yet"
                description="Your generated live recommendations will appear here."
                className="py-8"
                action={
                  <Link
                    to="/repositories"
                    className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
                  >
                    Open recommendations
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
          <Activity className="h-4 w-4" />
          Recent Contribution Activity
        </h2>
        {analytics?.recentActivity.length ? (
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/3 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
                  <GitPullRequest className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatActivityTime(item.occurredAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            Your real IssuePilot activity will appear here.
          </p>
        )}
      </div>
    </div>
  )
}
