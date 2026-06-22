import { Link } from 'react-router-dom'
import { Activity, ArrowRight, GitPullRequest } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { ChartCard } from '@/components/common/ChartCard'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { RepositoryCard } from '@/components/repositories/RepositoryCard'
import { dashboardData } from '@/data/dashboard'
import { mockOrganizations } from '@/data/organizations'
import { mockRepositories } from '@/data/repositories'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'

export function DashboardPage() {
  const profile = useUserStore((s) => s.profile)
  const skills = useSkillsStore((s) => s.skills)
  const { metrics, weeklyContributions, contributionFunnel, recentActivity, currentContribution } = dashboardData

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.displayName}`}
        description={`@${profile.username} · GitHub ${profile.githubConnected ? 'connected' : 'not connected'}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend} trendLabel={m.trendLabel} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Tech stack */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Detected Technology Stack</h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <TechnologyBadge key={s.id} name={`${s.name} · ${s.proficiency}`} />
            ))}
          </div>
        </div>

        {/* Continue contribution */}
        {currentContribution && (
          <div className="glass-card p-4 lg:col-span-2 glow-cyan">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Continue Current Contribution</h3>
            <p className="font-medium text-white">{currentContribution.issueTitle}</p>
            <p className="text-sm text-slate-400 mt-1">{currentContribution.repositoryName}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{currentContribution.currentStep}</span>
                <span>{currentContribution.progress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" style={{ width: `${currentContribution.progress}%` }} />
              </div>
            </div>
            <Link
              to={`/workspace/${currentContribution.issueId}`}
              className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-3"
            >
              Open workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Weekly Contribution Activity">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyContributions}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0c1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="hours" stroke="#06b6d4" fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contribution Funnel">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contributionFunnel} layout="vertical">
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#0c1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Top Organization Matches</h3>
            <Link to="/organizations" className="text-sm text-cyan-400 hover:text-cyan-300">View all</Link>
          </div>
          <div className="space-y-4">
            {mockOrganizations.slice(0, 2).map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Recommended Repositories</h3>
            <Link to="/repositories" className="text-sm text-cyan-400 hover:text-cyan-300">View all</Link>
          </div>
          <div className="space-y-4">
            {mockRepositories.slice(0, 2).map((repo) => (
              <RepositoryCard key={repo.id} repository={repo} viewMode="list" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Recent Contribution Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <GitPullRequest className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{item.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
