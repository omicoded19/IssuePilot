import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  GitBranch,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SkillsManager } from '@/components/profile/SkillsManager'
import { exportAuthUserData } from '@/services/auth-api'
import { useAuthStore } from '@/store/authStore'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useUserStore } from '@/store/userStore'

export function SettingsPage() {
  const navigate = useNavigate()
  const { status, user, logout, deleteAccount } = useAuthStore()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null)
  const {
    profile,
    onboardingComplete,
    contributionPreferences,
    availability,
  } = useUserStore()
  const analysis = useDeveloperProfileStore((state) => state.analysis)
  const authenticated = status === 'authenticated' && user !== null

  const handleSignOut = async () => {
    await logout()
    navigate('/signin', { replace: true, state: { signedOut: true } })
  }

  const handleExport = async () => {
    if (!user) return
    setExporting(true)
    setPrivacyMessage(null)
    try {
      const data = await exportAuthUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `issuepilot-${user.username}-data.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setPrivacyMessage('Your IssuePilot data export was downloaded.')
    } catch (error) {
      setPrivacyMessage(error instanceof Error ? error.message : 'Could not export your data.')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return
    setDeleting(true)
    setPrivacyMessage(null)
    try {
      const result = await deleteAccount()
      navigate('/signin', {
        replace: true,
        state: {
          accountDeleted: true,
          githubAuthorizationRevoked: result.githubAuthorizationRevoked,
        },
      })
    } catch (error) {
      setPrivacyMessage(error instanceof Error ? error.message : 'Could not delete your account.')
      setDeleting(false)
    }
  }


  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your GitHub account and contribution preferences without restarting onboarding."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
              <GitBranch className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-medium text-white">GitHub account</h2>
              <p className="text-sm text-slate-500">Your authenticated IssuePilot identity.</p>
            </div>
          </div>

          {authenticated ? (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName} avatar`}
                  className="h-14 w-14 rounded-xl border border-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{user.displayName}</p>
                  <p className="truncate text-sm text-emerald-300">@{user.username}</p>
                  <p className="mt-1 text-xs text-slate-500">Secure GitHub session connected</p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={user.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-white/20 hover:text-white"
                >
                  Open GitHub <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/15"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">GitHub is not connected.</p>
              <Link
                to="/signin"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
              >
                Connect GitHub
              </Link>
            </div>
          )}
        </section>

        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-violet-300">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-medium text-white">Contribution profile</h2>
              <p className="text-sm text-slate-500">Skills, preferences, and availability used for ranking.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Profile status</span>
                <span
                  className={
                    onboardingComplete || analysis
                      ? 'text-sm text-emerald-300'
                      : 'text-sm text-amber-300'
                  }
                >
                  {onboardingComplete || analysis ? 'Configured' : 'Incomplete'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">GitHub analysis</span>
                <span className="text-sm text-white">
                  {analysis
                    ? `${analysis.analysisMetadata.repositoriesAnalysed} repositories`
                    : 'Not generated'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Availability</span>
                <span className="text-sm text-white">{availability.hoursPerWeek}h per week</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">Preferred difficulty</span>
                <span className="text-sm text-white">{availability.difficulty}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Contribution interests</p>
              <div className="flex flex-wrap gap-2">
                {contributionPreferences.map((preference) => (
                  <span
                    key={preference}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                  >
                    {preference}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to="/onboarding?edit=1"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <UserRound className="h-4 w-4" />
              {onboardingComplete || analysis ? 'Edit contribution profile' : 'Complete contribution profile'}
            </Link>
          </div>
        </section>
      </div>


      <section className="glass-card mt-6 p-5 sm:p-6">
        <SkillsManager />
      </section>


      <section className="glass-card mt-6 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-medium text-white">Data and privacy</h2>
            <p className="text-sm text-slate-500">Export your stored data or permanently remove your IssuePilot account.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <h3 className="font-medium text-white">Export account data</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Download your profile analysis, preferences, recommendations, workspaces, tracked pull requests, and benchmark history as JSON.
            </p>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={!authenticated || exporting}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-emerald-500/30 hover:text-white disabled:opacity-50"
            >
              {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download my data
            </button>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-medium">Delete account permanently</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Deletes your IssuePilot profile, sessions, recommendations, workspaces, PR tracking, and analytics source data. Shared public repository analysis is retained.
            </p>
            <label className="mt-4 block text-xs text-slate-500" htmlFor="delete-confirmation">
              Type DELETE to confirm
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
                className="min-w-0 flex-1 rounded-lg border border-rose-500/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:border-rose-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={!authenticated || deleting || deleteConfirmation !== 'DELETE'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete account
              </button>
            </div>
          </div>
        </div>

        {privacyMessage && (
          <p className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
            {privacyMessage}
          </p>
        )}
      </section>

      <section className="glass-card mt-6 p-5 sm:p-6">
        <h2 className="text-lg font-medium text-white">Current recommendation preferences</h2>
        <p className="mt-1 text-sm text-slate-500">
          These values affect repository and issue ranking. They do not change your GitHub account.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PreferenceCard label="Repository size" value={availability.repositorySize} />
          <PreferenceCard label="Organization type" value={availability.organizationType} />
          <PreferenceCard label="GitHub profile" value={`@${profile.username}`} />
        </div>
      </section>
    </div>
  )
}

interface PreferenceCardProps {
  label: string
  value: string
}

function PreferenceCard({ label, value }: PreferenceCardProps) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}
