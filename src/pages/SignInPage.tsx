import { ArrowLeft, GitBranch, LockKeyhole } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { GitHubSignInButton } from '@/components/auth/GitHubSignInButton'
import { useAuthStore } from '@/store/authStore'

interface SignInLocationState {
  from?: string
  signedOut?: boolean
}

export function SignInPage() {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const state = location.state as SignInLocationState | null

  if (status === 'authenticated' && user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-7 sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to IssuePilot
        </Link>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <GitBranch className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-white">
            {state?.signedOut ? 'You have signed out' : 'Sign in to IssuePilot'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your dashboard, profile analysis, recommendations, workspaces, and analytics are
            available only after GitHub authentication.
          </p>
        </div>

        <GitHubSignInButton className="mt-7 w-full bg-indigo-600 hover:bg-indigo-500" />

        {state?.from && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Sign in to continue to the requested IssuePilot page.
          </p>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-xs leading-5 text-slate-500">
            IssuePilot uses a secure server-side session. Signing out removes account-specific
            data from this browser before returning you here.
          </p>
        </div>
      </div>
    </div>
  )
}
