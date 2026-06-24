import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { contributionPreferences as allContributionPrefs } from '@/data/skills'
import { analyzeDeveloperProfile } from '@/services/developer-profile-api'
import { ApiClientError } from '@/services/api-client'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'
import type { ContributionPreference, ProficiencyLevel } from '@/types/user'
import { cn } from '@/lib/cn'
import { GitHubSignInButton } from '@/components/auth/GitHubSignInButton'
import { useAuthStore } from '@/store/authStore'

const steps = ['Analyse GitHub', 'Detected Skills', 'Preferences', 'Availability']
const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

export function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [newSkill, setNewSkill] = useState('')
  const [manualUsername, setManualUsername] = useState('')
  const authUser = useAuthStore((state) => state.user)
  const username = manualUsername || authUser?.username || ''
  const authStatus = useAuthStore((state) => state.status)
  const oauthConfigured = useAuthStore((state) => state.configured)

  const {
    profile,
    setProfileFromGitHub,
    contributionPreferences: prefs,
    setContributionPreferences,
    availability,
    setAvailability,
    finishOnboarding,
    onboardingComplete,
  } = useUserStore()
  const {
    skills,
    addSkill,
    removeSkill,
    updateProficiency,
    toggleWantToLearn,
    setDetectedSkills,
  } = useSkillsStore()
  const editing = searchParams.get('edit') === '1'

  const {
    analysis,
    status,
    error,
    setLoading,
    setAnalysis,
    setError,
    clearError,
  } = useDeveloperProfileStore()

  useEffect(() => {
    if (onboardingComplete && !editing) {
      navigate('/dashboard', { replace: true })
    }
  }, [editing, navigate, onboardingComplete])

  const togglePref = (pref: ContributionPreference) => {
    const next = prefs.includes(pref)
      ? prefs.filter((item) => item !== pref)
      : [...prefs, pref]
    setContributionPreferences(next)
  }

  const handleAnalyzeGitHub = async () => {
    const normalized = username.trim().replace(/^@/, '')
    if (!normalized) {
      setError('Enter your GitHub username.')
      return
    }

    setLoading()
    try {
      const result = await analyzeDeveloperProfile(normalized)
      setAnalysis(result)
      setProfileFromGitHub({
        username: result.profile.username,
        displayName: result.profile.displayName,
        avatarUrl: result.profile.avatarUrl,
        githubConnected: true,
        bio: result.profile.bio ?? '',
        location: result.profile.location ?? '',
        publicRepos: result.profile.publicRepos,
        followers: result.profile.followers,
        following: result.profile.following,
        profileUrl: result.profile.profileUrl,
        company: result.profile.company,
      })
      setDetectedSkills(
        result.technologies.slice(0, 16).map((technology) => ({
          name: technology.name,
          proficiency: technology.suggestedProficiency,
        })),
      )
      setStep(1)
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : 'Could not analyse this GitHub profile.',
      )
    }
  }

  const handleFinish = () => {
    finishOnboarding()
    navigate(editing ? '/settings' : '/profile', { replace: true })
  }

  const handleBack = () => {
    if (step > 0) {
      setStep((current) => current - 1)
      return
    }

    if (editing || onboardingComplete) {
      navigate('/settings')
      return
    }

    navigate(authStatus === 'authenticated' ? '/dashboard' : '/')
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border',
                  index <= step
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-500',
                )}
              >
                {index < step ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-2',
                    index < step ? 'bg-cyan-500/40' : 'bg-white/10',
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">{steps[step]}</h1>
          <p className="text-sm text-slate-400 mb-6">
            Step {step + 1} of {steps.length}
          </p>

          {step === 0 && (
            <div className="py-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <GitHubMark className="w-8 h-8 text-white" />
              </div>
              <div className="text-center max-w-lg mx-auto">
                <p className="text-slate-400 mb-2">
                  Connect GitHub for a real account session, then IssuePilot will inspect up to 12 strong recent repositories and detect languages and frameworks using repository evidence.
                </p>
                <p className="text-xs text-amber-300/80 mb-6">
                  Suggested proficiency is only an estimate and remains editable.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                {authStatus === 'authenticated' && authUser ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <img src={authUser.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{authUser.displayName}</p>
                      <p className="text-xs text-emerald-300 truncate">Connected as @{authUser.username}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <GitHubSignInButton className="w-full bg-white/5" />
                    {!oauthConfigured && (
                      <p className="text-xs text-amber-300/80 text-center">
                        GitHub OAuth is not configured yet. Manual public-profile analysis still works below.
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-white/10" />
                      <span className="text-[11px] uppercase tracking-wider text-slate-600">or use a username</span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                  </>
                )}
                <label htmlFor="github-username" className="text-sm text-slate-300 block mb-2">
                  GitHub username
                </label>
                <div className="flex gap-2">
                  <input
                    id="github-username"
                    value={username}
                    onChange={(event) => {
                      setManualUsername(event.target.value)
                      clearError()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void handleAnalyzeGitHub()
                    }}
                    placeholder="omicoded19"
                    className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAnalyzeGitHub()}
                    disabled={status === 'loading'}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
                  >
                    {status === 'loading' ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitHubMark className="w-4 h-4" />
                    )}
                    {status === 'loading' ? 'Analysing' : 'Analyse'}
                  </button>
                </div>
                {error && <p className="text-sm text-rose-300 mt-2">{error}</p>}
              </div>

              {analysis && profile.githubConnected && (
                <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto">
                  <img
                    src={analysis.profile.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {analysis.profile.displayName}
                    </p>
                    <p className="text-xs text-emerald-300">
                      @{analysis.profile.username} · {analysis.analysisMetadata.repositoriesAnalysed} repositories analysed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-400">
                  Review the detected technologies. Change levels, remove weak signals, or add skills GitHub cannot infer.
                </p>
                {analysis && (
                  <span className="shrink-0 text-xs text-cyan-300 border border-cyan-500/20 bg-cyan-500/10 rounded-full px-2 py-1">
                    Real GitHub data
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[390px] overflow-y-auto pr-1">
                {skills.map((skill) => {
                  const detected = analysis?.technologies.find(
                    (item) => item.name.toLowerCase() === skill.name.toLowerCase(),
                  )
                  return (
                    <div key={skill.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white flex-1">{skill.name}</span>
                        {detected && (
                          <span className="text-[10px] uppercase tracking-wide text-emerald-300">
                            {detected.confidence} confidence
                          </span>
                        )}
                        <select
                          value={skill.proficiency}
                          onChange={(event) =>
                            updateProficiency(skill.id, event.target.value as ProficiencyLevel)
                          }
                          className="text-xs bg-[#111111] border border-white/10 rounded px-2 py-1 text-slate-300"
                        >
                          {proficiencyLevels.map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => toggleWantToLearn(skill.id)}
                          className={cn(
                            'px-2 py-1 rounded text-[11px] border',
                            skill.wantToLearn
                              ? 'border-violet-500/30 text-violet-300 bg-violet-500/10'
                              : 'border-white/10 text-slate-500',
                          )}
                        >
                          Want to learn
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          aria-label={`Remove ${skill.name}`}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {detected?.evidence[0] && (
                        <p className="text-xs text-slate-500 mt-2">{detected.evidence[0]}</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(event) => setNewSkill(event.target.value)}
                  placeholder="Add technology..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSkill.trim()) return
                    addSkill(newSkill.trim())
                    setNewSkill('')
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Select the types of open-source contributions you want to work on.
              </p>
              <div className="flex flex-wrap gap-2">
                {allContributionPrefs.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePref(pref)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-colors',
                      prefs.includes(pref)
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20',
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-slate-400">
                  Hours per week: {availability.hoursPerWeek}h
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={availability.hoursPerWeek}
                  onChange={(event) => setAvailability({ hoursPerWeek: Number(event.target.value) })}
                  className="w-full mt-2 accent-cyan-500"
                />
              </div>

              <ChoiceGroup
                label="Preferred difficulty"
                values={proficiencyLevels}
                selected={availability.difficulty}
                onSelect={(difficulty) => setAvailability({ difficulty })}
              />
              <ChoiceGroup
                label="Preferred repository size"
                values={['Small', 'Medium', 'Large'] as const}
                selected={availability.repositorySize}
                onSelect={(repositorySize) => setAvailability({ repositorySize })}
              />
              <ChoiceGroup
                label="Preferred organization type"
                values={['Startup', 'Foundation', 'Community', 'Enterprise'] as const}
                selected={availability.organizationType}
                onSelect={(organizationType) => setAvailability({ organizationType })}
              />
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={step === 0 && !profile.githubConnected}
                className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-30"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg"
              >
                Save Contribution Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ChoiceGroupProps<T extends string> {
  label: string
  values: readonly T[]
  selected: T
  onSelect: (value: T) => void
}

function ChoiceGroup<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: ChoiceGroupProps<T>) {
  return (
    <div>
      <label className="text-sm text-slate-400 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm border transition-colors',
              selected === value
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-slate-400',
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}


interface GitHubMarkProps {
  className?: string
}

function GitHubMark({ className }: GitHubMarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
