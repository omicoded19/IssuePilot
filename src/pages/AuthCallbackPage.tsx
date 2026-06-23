import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const errorMessages: Record<string, string> = {
  access_denied: 'GitHub authorization was cancelled.',
  invalid_oauth_state: 'The sign-in request expired or could not be verified. Please try again.',
  github_auth_failed: 'GitHub sign-in could not be completed.',
  oauth_not_configured: 'GitHub sign-in is not configured on the server.',
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { bootstrap, status, user } = useAuthStore()
  const errorCode = searchParams.get('error')

  useEffect(() => {
    if (errorCode) return
    void bootstrap()
  }, [bootstrap, errorCode])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    const timer = window.setTimeout(() => navigate('/onboarding', { replace: true }), 900)
    return () => window.clearTimeout(timer)
  }, [navigate, status, user])

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 text-center">
        {errorCode ? (
          <>
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white">GitHub sign-in failed</h1>
            <p className="text-sm text-slate-400 mt-2">
              {errorMessages[errorCode] ?? 'An unexpected GitHub authorization error occurred.'}
            </p>
            <Link
              to="/onboarding"
              className="inline-flex mt-6 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
            >
              Return to onboarding
            </Link>
          </>
        ) : status === 'authenticated' && user ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white">Connected as @{user.username}</h1>
            <p className="text-sm text-slate-400 mt-2">Redirecting to your contribution profile…</p>
          </>
        ) : (
          <>
            <LoaderCircle className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white">Completing GitHub sign-in</h1>
            <p className="text-sm text-slate-400 mt-2">IssuePilot is creating your secure session.</p>
          </>
        )}
      </div>
    </div>
  )
}
