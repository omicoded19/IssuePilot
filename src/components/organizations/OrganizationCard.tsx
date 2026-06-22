import { ArrowRight, GitBranch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MatchScoreRing } from '@/components/common/MatchScoreRing'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import type { Organization } from '@/types/organization'
import { cn } from '@/lib/cn'

interface OrganizationCardProps {
  organization: Organization
  className?: string
}

export function OrganizationCard({ organization, className }: OrganizationCardProps) {
  return (
    <div className={cn('glass-card p-5 hover:border-cyan-500/20 transition-all hover:glow-cyan group', className)}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${organization.logoColor}20`, color: organization.logoColor }}
        >
          {organization.logoInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {organization.name}
            </h3>
            <MatchScoreRing score={organization.matchScore} size={56} />
          </div>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{organization.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <Stat label="Tech Match" value={`${organization.technologyMatch}%`} />
        <Stat label="Beginner Friendly" value={`${organization.beginnerFriendliness}%`} />
        <Stat label="Maintainer Activity" value={`${organization.maintainerActivity}%`} />
        <Stat label="Avg Response" value={organization.averageResponseTime} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {organization.languages.slice(0, 3).map((lang) => (
          <TechnologyBadge key={lang} name={lang} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {organization.suitableRepositories} repos
          </span>
          <span>{organization.beginnerFriendlyIssues} beginner issues</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 line-clamp-2">{organization.matchReason}</p>

      <Link
        to={`/repositories?organization=${encodeURIComponent(organization.slug)}`}
        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-3 transition-colors"
      >
        View repositories <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-300">{value}</p>
    </div>
  )
}
