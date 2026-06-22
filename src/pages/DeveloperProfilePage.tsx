import { ExternalLink, GitFork, MapPin, Star, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { TechnologyBadge } from '@/components/common/TechnologyBadge'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useSkillsStore } from '@/store/skillsStore'

export function DeveloperProfilePage() {
  const analysis = useDeveloperProfileStore((state) => state.analysis)
  const skills = useSkillsStore((state) => state.skills)

  if (!analysis) {
    return (
      <div>
        <PageHeader
          title="Developer Profile"
          description="Analyse your public GitHub repositories to build a contribution profile."
        />
        <EmptyState
          icon={UserRound}
          title="No GitHub profile analysis yet"
          description="Complete onboarding to detect languages, frameworks, and repository evidence."
          action={
            <Link
              to="/onboarding"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
            >
              Analyse GitHub Profile
            </Link>
          }
        />
      </div>
    )
  }

  const { profile, languages, technologies, repositories, analysisMetadata } = analysis

  return (
    <div>
      <PageHeader
        title="Developer Profile"
        description="Real GitHub evidence with editable contribution preferences."
        actions={
          <Link
            to="/onboarding"
            className="px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:text-white hover:border-white/20"
          >
            Edit Profile
          </Link>
        }
      />

      <section className="glass-card p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <img
            src={profile.avatarUrl}
            alt={`${profile.displayName} avatar`}
            className="w-20 h-20 rounded-2xl border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-white">{profile.displayName}</h2>
              <span className="text-sm text-slate-500">@{profile.username}</span>
              <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                Real GitHub data
              </span>
            </div>
            {profile.bio && <p className="text-sm text-slate-400 mt-2">{profile.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-slate-400">
              {profile.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {profile.followers} followers
              </span>
              <span>{profile.publicRepos} public repositories</span>
            </div>
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-slate-300 hover:text-white"
          >
            Open GitHub <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <section className="glass-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Detected technologies</h3>
              <p className="text-xs text-slate-500 mt-1">
                Suggested levels are inferred from public repository evidence, not verified expertise.
              </p>
            </div>
            <span className="text-xs text-slate-500">{technologies.length} signals</span>
          </div>

          <div className="space-y-3">
            {technologies.slice(0, 14).map((technology) => {
              const editedSkill = skills.find(
                (skill) => skill.name.toLowerCase() === technology.name.toLowerCase(),
              )
              return (
                <div
                  key={technology.name}
                  className="p-4 rounded-xl border border-white/8 bg-white/[0.025]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium text-white">{technology.name}</h4>
                    <TechnologyBadge name={technology.category} />
                    <span className="ml-auto text-xs text-cyan-300">
                      {editedSkill?.proficiency ?? technology.suggestedProficiency}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span>{technology.repositoryCount} repositories</span>
                    <span>{technology.confidence} confidence</span>
                  </div>
                  {technology.evidence[0] && (
                    <p className="text-xs text-slate-400 mt-2">{technology.evidence[0]}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="glass-card p-5">
          <h3 className="text-lg font-medium text-white mb-1">Language activity</h3>
          <p className="text-xs text-slate-500 mb-5">
            Share of code bytes across analysed repositories.
          </p>
          <div className="space-y-4">
            {languages.slice(0, 8).map((language) => (
              <div key={language.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-300">{language.name}</span>
                  <span className="text-slate-500">{language.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                    style={{ width: `${Math.max(language.percentage, 1)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {language.repositoryCount} repositories
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">Repositories used as evidence</h3>
            <p className="text-xs text-slate-500 mt-1">
              {analysisMetadata.repositoriesAnalysed} of {analysisMetadata.totalPublicRepositories} public repositories analysed.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Updated {new Date(analysisMetadata.analysedAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {repositories.map((repository) => (
            <a
              key={repository.githubRepositoryId}
              href={repository.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl border border-white/8 bg-white/[0.025] hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-medium text-white truncate">{repository.fullName}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {repository.description ?? 'No repository description.'}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                {repository.primaryLanguage && <span>{repository.primaryLanguage}</span>}
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" /> {repository.stars}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" /> {repository.forks}
                </span>
                {repository.packageManifestFound && (
                  <span className="text-emerald-300">package.json analysed</span>
                )}
              </div>
            </a>
          ))}
        </div>

        {analysisMetadata.notes.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            {analysisMetadata.notes.map((note) => (
              <p key={note} className="text-xs text-amber-200/70">• {note}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
