import { useEffect, useRef } from 'react'
import {
  Activity,
  AlertCircle,
  AreaChart as AreaChartIcon,
  GitPullRequest,
  LogIn,
  RefreshCw,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { ChartCard } from '@/components/common/ChartCard'
import { PerformanceBenchmarkPanel } from '@/components/analytics/PerformanceBenchmarkPanel'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { useAuthStore } from '@/store/authStore'
import { useAnalyticsStore } from '@/store/analyticsStore'

const COLORS = ['#4ade80', '#22c55e', '#a3a3a3', '#f59e0b', '#86efac', '#525252']

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

export function AnalyticsPage() {
  const authStatus = useAuthStore((state) => state.status)
  const configured = useAuthStore((state) => state.configured)
  const loginWithGitHub = useAuthStore((state) => state.loginWithGitHub)
  const analytics = useAnalyticsStore((state) => state.data)
  const analyticsStatus = useAnalyticsStore((state) => state.status)
  const error = useAnalyticsStore((state) => state.error)
  const loadAnalytics = useAnalyticsStore((state) => state.load)
  const requestedUser = useRef<string | null>(null)
  const authUser = useAuthStore((state) => state.user)
  const loading = analyticsStatus === 'loading'

  useEffect(() => {
    if (authStatus !== 'authenticated' || !authUser) return
    if (requestedUser.current === authUser.id && analytics) return
    requestedUser.current = authUser.id
    void loadAnalytics().catch(() => undefined)
  }, [analytics, authStatus, authUser, loadAnalytics])

  if (authStatus !== 'authenticated') {
    return (
      <div>
        <PageHeader
          title="Contribution Analytics"
          description="Real activity metrics generated from your IssuePilot records."
        />
        <EmptyState
          icon={LogIn}
          title="Sign in to view your analytics"
          description="Analytics are private to your connected GitHub account and contribution history."
          action={
            <button
              type="button"
              onClick={loginWithGitHub}
              disabled={!configured}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm"
            >
              {configured ? 'Continue with GitHub' : 'GitHub sign-in not configured'}
            </button>
          }
        />
      </div>
    )
  }

  if (loading && !analytics) {
    return (
      <div>
        <PageHeader
          title="Contribution Analytics"
          description="Loading real activity from PostgreSQL."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} className="h-72" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div>
        <PageHeader
          title="Contribution Analytics"
          description="Real activity metrics generated from your IssuePilot records."
        />
        <EmptyState
          icon={AlertCircle}
          title="Analytics could not be loaded"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void loadAnalytics().catch(() => undefined)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >
              Try Again
            </button>
          }
        />
      </div>
    )
  }

  if (!analytics) return null

  const hasActivity = analytics.recentActivity.length > 0

  return (
    <div>
      <PageHeader
        title="Contribution Analytics"
        description={`Real activity for @${analytics.username}, computed from your PostgreSQL records.`}
        actions={
          <button
            type="button"
            onClick={() => void loadAnalytics().catch(() => undefined)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
          Real PostgreSQL data
        </span>
        <span className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
          30-day trend comparison
        </span>
        <span className="text-[11px] text-slate-500">
          Updated {new Date(analytics.metadata.generatedAt).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
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

      <PerformanceBenchmarkPanel />

      {!hasActivity && (
        <div className="glass-card mb-6">
          <EmptyState
            icon={Activity}
            title="No contribution activity yet"
            description="Analyse your profile, generate recommendations, and start a contribution workspace to populate these charts."
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Repository Matches Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.repositoryMatchesOverTime}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="matches" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contribution Activity — Last 8 Weeks">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.contributionActivity}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="contributions" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pull Request Status">
          {analytics.pullRequestStatus.length === 0 ? (
            <div className="h-[250px] flex flex-col items-center justify-center text-center">
              <GitPullRequest className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">No pull requests tracked yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.pullRequestStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.pullRequestStatus.map((point, index) => (
                    <Cell key={point.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Contribution Funnel">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.contributionFunnel} layout="vertical">
              <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Technology Evidence">
          {analytics.technologyDistribution.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-slate-500">
              Analyse your GitHub profile to populate technology evidence.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.technologyDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                >
                  {analytics.technologyDistribution.map((point, index) => (
                    <Cell key={point.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estimated Research Time Saved">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics.timeSaved}>
              <defs>
                <linearGradient id="timeSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="hours" stroke="#10b981" fill="url(#timeSaved)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-2">
            Estimate only: {analytics.metadata.timeSavedFormula}.
          </p>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Repository Match Score Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.matchScoreDistribution}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workspace Progress">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.workspaceProgress} layout="vertical">
              <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={110} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#a3a3a3" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AreaChartIcon className="w-4 h-4 text-cyan-300" />
          <h3 className="text-sm font-medium text-slate-300">Recent Activity</h3>
        </div>
        {analytics.recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No stored activity yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {analytics.recentActivity.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
                <time className="text-[11px] text-slate-600 shrink-0">
                  {formatActivityTime(item.occurredAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5">
        <h3 className="text-sm font-medium text-amber-200 mb-2">How these figures are calculated</h3>
        <div className="space-y-1">
          {analytics.metadata.notes.map((note) => (
            <p key={note} className="text-xs text-amber-100/60">• {note}</p>
          ))}
        </div>
      </section>
    </div>
  )
}
