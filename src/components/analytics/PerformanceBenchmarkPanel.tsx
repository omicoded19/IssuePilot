import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  Gauge,
  GitBranch,
  LoaderCircle,
  Play,
} from 'lucide-react'
import { usePerformanceStore } from '@/store/performanceStore'

function formatDuration(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${Math.round(value)}ms`
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

export function PerformanceBenchmarkPanel() {
  const [repositoryUrl, setRepositoryUrl] = useState(
    'https://github.com/appwrite/sdk-for-web',
  )
  const data = usePerformanceStore((state) => state.data)
  const status = usePerformanceStore((state) => state.status)
  const benchmarkStatus = usePerformanceStore((state) => state.benchmarkStatus)
  const error = usePerformanceStore((state) => state.error)
  const load = usePerformanceStore((state) => state.load)
  const runBenchmark = usePerformanceStore((state) => state.runBenchmark)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [load, status])

  const running = benchmarkStatus === 'running'
  const cacheConnected = data?.cache.status === 'connected'
  const latest = data?.latest ?? null

  return (
    <section className="glass-card p-5 mb-6 overflow-hidden relative">
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-semibold text-white">Redis Performance Benchmark</h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Compare a cold GitHub-backed repository analysis with an immediate Redis cache hit using the same repository and backend environment.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
              cacheConnected
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
            }`}
          >
            {cacheConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {data?.cache.configured
              ? `Redis ${data.cache.status}`
              : 'Redis not configured'}
          </div>
        </div>

        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            if (!repositoryUrl.trim() || running) return
            void runBenchmark(repositoryUrl.trim()).catch(() => undefined)
          }}
        >
          <label className="flex-1 relative">
            <span className="sr-only">GitHub repository URL</span>
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-white/10 bg-black/20 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </label>
          <button
            type="submit"
            disabled={!cacheConnected || running || !repositoryUrl.trim()}
            className="h-11 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {running ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {running ? 'Running cold and warm requests…' : 'Run Benchmark'}
          </button>
        </form>

        {!cacheConnected && (
          <div className="mt-3 text-xs text-amber-200/70">
            Add <code className="text-amber-200">REDIS_URL=redis://localhost:6379</code> to <code className="text-amber-200">server/.env</code>, start Redis, and restart IssuePilot.
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-200">
            {error}
          </div>
        )}

        {latest && (
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Cold analysis</p>
              <p className="text-xl font-semibold text-white mt-1">{formatDuration(latest.coldDurationMs)}</p>
              <p className="text-[11px] text-slate-600 mt-1">{latest.coldGitHubRequests} GitHub requests</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <p className="text-xs text-slate-500">Warm cache hit</p>
              <p className="text-xl font-semibold text-white mt-1">{formatDuration(latest.warmDurationMs)}</p>
              <p className="text-[11px] text-slate-600 mt-1">{latest.warmGitHubRequests} GitHub requests</p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
              <p className="text-xs text-emerald-200/70">Latency reduction</p>
              <p className="text-xl font-semibold text-emerald-300 mt-1">{formatPercent(latest.latencyReductionPercent)}</p>
              <p className="text-[11px] text-emerald-200/50 mt-1">Cold versus Redis hit</p>
            </div>
            <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] p-4">
              <p className="text-xs text-cyan-200/70">API request reduction</p>
              <p className="text-xl font-semibold text-cyan-300 mt-1">{formatPercent(latest.githubRequestReductionPercent)}</p>
              <p className="text-[11px] text-cyan-200/50 mt-1">GitHub REST requests avoided</p>
            </div>
          </div>
        )}

        {data && data.history.length > 0 && (
          <div className="mt-5 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <DatabaseZap className="w-4 h-4 text-violet-300" />
              <h3 className="text-sm font-medium text-slate-300">Recent measured runs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="text-slate-600">
                  <tr>
                    <th className="pb-2 font-medium">Repository</th>
                    <th className="pb-2 font-medium">Cold</th>
                    <th className="pb-2 font-medium">Warm</th>
                    <th className="pb-2 font-medium">Latency change</th>
                    <th className="pb-2 font-medium">GitHub calls</th>
                    <th className="pb-2 font-medium">Measured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {data.history.slice(0, 5).map((result) => (
                    <tr key={result.id}>
                      <td className="py-2.5 font-medium text-white">{result.fullName}</td>
                      <td className="py-2.5">{formatDuration(result.coldDurationMs)}</td>
                      <td className="py-2.5">{formatDuration(result.warmDurationMs)}</td>
                      <td className="py-2.5 text-emerald-300">{formatPercent(result.latencyReductionPercent)}</td>
                      <td className="py-2.5">{result.coldGitHubRequests} → {result.warmGitHubRequests}</td>
                      <td className="py-2.5 text-slate-500">{new Date(result.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && (
          <details className="mt-4 text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300">Benchmark methodology and limitations</summary>
            <div className="mt-2 space-y-1">
              {data.methodology.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  )
}
