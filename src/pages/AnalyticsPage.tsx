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
import { analyticsData } from '@/data/analytics'

const COLORS = ['#06b6d4', '#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#64748b']

const tooltipStyle = {
  contentStyle: { background: '#0c1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
}

export function AnalyticsPage() {
  const {
    metrics,
    repositoryMatchesOverTime,
    contributionActivity,
    pullRequestStatus,
    contributionFunnel,
    technologyDistribution,
    timeSaved,
    matchScoreDistribution,
  } = analyticsData

  return (
    <div>
      <PageHeader
        title="Contribution Analytics"
        description="Track your open-source contribution journey and IssuePilot performance metrics."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Repository Matches Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={repositoryMatchesOverTime}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="matches" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contribution Activity">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contributionActivity}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="contributions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pull Request Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pullRequestStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pullRequestStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contribution Funnel">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contributionFunnel} layout="vertical">
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={80} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Technology Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={technologyDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
              >
                {technologyDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Time Saved (hours)">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSaved}>
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
        </ChartCard>
      </div>

      <ChartCard title="Match Score Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={matchScoreDistribution}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
