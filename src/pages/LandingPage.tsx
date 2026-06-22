import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BarChart3, GitBranch, Sparkles, Target, Workflow } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { IssueCard } from '@/components/issues/IssueCard'
import { MetricCard } from '@/components/common/MetricCard'
import { mockOrganizations } from '@/data/organizations'
import { mockIssues } from '@/data/issues'
import { resolveRepositoryId } from '@/data/repositories'
import { createRepositoryRouteId } from '@/services/repository-api'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { analyticsData } from '@/data/analytics'

const flowSteps = [
  'GitHub Profile',
  'Skills Detected',
  'Organization Match',
  'Repository Analysis',
  'Issue Selected',
  'Contribution Started',
  'Pull Request Merged',
]

export function LandingPage() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const { analyze, status, error, clearError } = useRepositoryAnalysisStore()

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = repoUrl.trim()

    if (!value) {
      const id = resolveRepositoryId('appwrite/sdk-for-web')
      navigate(`/repositories/${id}`)
      return
    }

    try {
      const analysis = await analyze(value)
      const routeId = createRepositoryRouteId(
        analysis.repository.owner,
        analysis.repository.name,
      )
      navigate(`/repositories/${routeId}`)
    } catch {
      // The store exposes the safe backend error below the form.
    }
  }

  return (
    <div className="min-h-screen dot-grid">
      <Navbar variant="landing" />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs mb-6">
            <Sparkles className="w-3 h-3" />
            Repository intelligence for open-source contributors
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Find the Right Open-Source Repository.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Contribute With Confidence.
            </span>
          </h1>
          <p className="text-lg text-slate-400 mt-6 max-w-2xl mx-auto">
            IssuePilot analyses your skills, recommends suitable organizations and repositories, and guides you through the complete contribution process.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              to="/onboarding"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all glow-cyan"
            >
              Analyse My GitHub
            </Link>
            <Link
              to="/repositories"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium border border-white/15 text-white rounded-lg hover:border-white/30 transition-colors"
            >
              Explore Repositories
            </Link>
          </div>

          <form onSubmit={handleAnalyzeUrl} className="mt-6 max-w-lg mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value)
                  clearError()
                }}
                placeholder="https://github.com/appwrite/appwrite"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                {status === 'loading' ? 'Analysing…' : 'Analyse Repository URL'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-left text-sm text-rose-300">{error}</p>
            )}
          </form>
        </motion.div>

        {/* Product preview flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mt-16 glass-card p-6 sm:p-8 glow-indigo overflow-x-auto"
        >
          <div className="flex items-center gap-2 min-w-max">
            {flowSteps.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center min-w-[120px]">
                  <p className="text-xs text-slate-500 mb-1">Step {i + 1}</p>
                  <p className="text-sm font-medium text-white">{step}</p>
                </div>
                {i < flowSteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-indigo-400 mx-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">How IssuePilot Works</h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
          From GitHub profile to merged pull request — a guided journey for every contributor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: 'Analyse Your Skills', desc: 'Connect GitHub and detect your technology stack, or manually curate your skills and preferences.' },
            { icon: GitBranch, title: 'Discover Repositories', desc: 'Get matched with organizations and repositories that fit your skills, goals, and availability.' },
            { icon: Workflow, title: 'Guided Contribution', desc: 'Follow an interactive preparation flow from setup to pull request with personalized issue recommendations.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 hover:border-cyan-500/20 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured orgs */}
      <section id="product" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Featured Organizations</h2>
          <Link to="/organizations" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockOrganizations.slice(0, 4).map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      </section>

      {/* Repo analysis preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-8">Repository Analysis Preview</h2>
        <div className="glass-card p-6 glow-blue">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <p className="text-sm text-cyan-400 font-medium">appwrite/sdk-for-web</p>
              <h3 className="text-xl font-semibold text-white mt-1">92% Match Score</h3>
              <p className="text-sm text-slate-400 mt-2">
                TypeScript SDK with low setup complexity, excellent documentation, and 8 beginner-friendly issues matching your skills.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <MetricCard label="Health" value="94%" />
                <MetricCard label="Docs Quality" value="91%" />
                <MetricCard label="Beginner Friendly" value="89%" />
                <MetricCard label="Setup" value="Low" />
              </div>
            </div>
            <Link
              to="/repositories/appwrite-sdk-for-web"
              className="self-start px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              View Full Analysis
            </Link>
          </div>
        </div>
      </section>

      {/* Issue recommendations preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-8">Personalized Issue Recommendations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockIssues.slice(0, 2).map((issue) => (
            <IssueCard key={issue.id} issue={issue} repositoryName="appwrite/sdk-for-web" />
          ))}
        </div>
      </section>

      {/* Analytics preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-6 h-6 text-violet-400" />
          <h2 className="text-3xl font-bold text-white">Contribution Analytics</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {analyticsData.metrics.slice(0, 4).map((m) => (
            <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend} />
          ))}
        </div>
        <Link to="/analytics" className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-6">
          View full analytics <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass-card p-8 sm:p-12 text-center glow-cyan">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Contribute?</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-6">
            Connect your GitHub profile and let IssuePilot guide you to your first meaningful open-source contribution.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex px-8 py-3 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
