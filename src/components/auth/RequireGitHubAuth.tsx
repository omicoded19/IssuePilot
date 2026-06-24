import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RequireGitHubAuth() {
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen dot-grid flex items-center justify-center p-6">
        <div className="glass-card flex items-center gap-3 px-5 py-4 text-sm text-slate-300">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
          Checking your GitHub session…
        </div>
      </div>
    )
  }

  if (status !== 'authenticated' || !user) {
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
