import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { contributionPreferences as allContributionPrefs } from '@/data/skills'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'
import type { ContributionPreference, ProficiencyLevel } from '@/types/user'
import { cn } from '@/lib/cn'

const steps = ['Connect GitHub', 'Detected Skills', 'Preferences', 'Availability']

const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [newSkill, setNewSkill] = useState('')

  const { profile, connectGitHub, contributionPreferences: prefs, setContributionPreferences, availability, setAvailability, finishOnboarding } = useUserStore()
  const { skills, addSkill, removeSkill, updateProficiency, toggleWantToLearn } = useSkillsStore()

  const togglePref = (pref: ContributionPreference) => {
    const next = prefs.includes(pref) ? prefs.filter((p) => p !== pref) : [...prefs, pref]
    setContributionPreferences(next)
  }

  const handleFinish = () => {
    finishOnboarding()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border',
                i <= step ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500'
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-px mx-2', i < step ? 'bg-cyan-500/40' : 'bg-white/10')} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-white mb-1">{steps[step]}</h1>
          <p className="text-sm text-slate-400 mb-6">Step {step + 1} of {steps.length}</p>

          {/* Step 1: Connect GitHub */}
          {step === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <p className="text-slate-400 mb-6">
                Connect your GitHub account to automatically detect skills from your repositories and profile.
              </p>
              {profile.githubConnected ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-4 h-4" />
                  Connected as @{profile.username}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectGitHub}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub
                </button>
              )}
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Review and edit your detected skills. Add technologies or mark ones you want to learn.</p>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm font-medium text-white flex-1">{skill.name}</span>
                    <select
                      value={skill.proficiency}
                      onChange={(e) => updateProficiency(skill.id, e.target.value as ProficiencyLevel)}
                      className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300"
                    >
                      {proficiencyLevels.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => toggleWantToLearn(skill.id)}
                      className={cn(
                        'text-xs px-2 py-1 rounded border transition-colors',
                        skill.wantToLearn ? 'border-violet-500/30 text-violet-300 bg-violet-500/10' : 'border-white/10 text-slate-500'
                      )}
                    >
                      Want to learn
                    </button>
                    <button type="button" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add technology..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => { if (newSkill.trim()) { addSkill(newSkill.trim()); setNewSkill('') } }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 2 && (
            <div>
              <p className="text-sm text-slate-400 mb-4">Select the types of contributions you are interested in.</p>
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
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    )}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Availability */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm text-slate-400">Hours per week: {availability.hoursPerWeek}h</label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={availability.hoursPerWeek}
                  onChange={(e) => setAvailability({ hoursPerWeek: Number(e.target.value) })}
                  className="w-full mt-2 accent-cyan-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Preferred difficulty</label>
                <div className="flex gap-2">
                  {proficiencyLevels.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAvailability({ difficulty: d })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-colors',
                        availability.difficulty === d ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Preferred repository size</label>
                <div className="flex gap-2">
                  {(['Small', 'Medium', 'Large'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAvailability({ repositorySize: s })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-colors',
                        availability.repositorySize === s ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Preferred organization type</label>
                <div className="flex flex-wrap gap-2">
                  {(['Startup', 'Foundation', 'Community', 'Enterprise'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAvailability({ organizationType: t })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-colors',
                        availability.organizationType === t ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !profile.githubConnected}
                className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-30 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
              >
                Finish & Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
