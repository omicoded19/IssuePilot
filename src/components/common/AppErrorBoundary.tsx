import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('IssuePilot client error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="dot-grid flex min-h-screen items-center justify-center p-6">
        <section className="glass-card w-full max-w-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="mt-5 flex justify-center">
            <IssuePilotLogo />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your stored IssuePilot data is safe. Reload the application to restore the current session.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <RotateCcw className="h-4 w-4" />
            Reload IssuePilot
          </button>
        </section>
      </main>
    )
  }
}
