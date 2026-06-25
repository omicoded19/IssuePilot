import { useEffect, useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RequireGitHubAuth() {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const error = useAuthStore((state) => state.error)
  const [takingLonger, setTakingLonger] = useState(false)

  useEffect(() => {
    if (status !== 'idle' && status !== 'loading') return

    const timeout = window.setTimeout(() => setTakingLonger(true), 4_000)
    return () => window.clearTimeout(timeout)
  }, [status])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center p-6">
        <div className="glass-card w-full max-w-md px-6 py-5 text-center">
          <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-emerald-300" />
          <p className="mt-3 text-sm font-medium text-slate-200">
            {takingLonger
              ? 'Waking the secure API and checking your GitHub session…'
              : 'Checking your GitHub session…'}
          </p>
          {takingLonger && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              The first request can take longer when the hosted backend has been idle. You do not
              need to sign in again while this check is running.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (status !== 'authenticated' || !user) {
    if (error) {
      return (
        <div className="min-h-screen dot-grid flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-md p-6 text-center">
            <p className="text-sm text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => {
                setTakingLonger(false)
                void bootstrap()
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry session check
            </button>
          </div>
        </div>
      )
    }

    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
