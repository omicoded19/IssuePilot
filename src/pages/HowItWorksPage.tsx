import {
  ArrowRight,
  BookOpenCheck,
  GitBranch,
  UserRound,
  ListChecks,
  Search,
  Settings2,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthStore } from '@/store/authStore'

const steps = [
  {
    icon: UserRound,
    number: '01',
    title: 'Sign in once with GitHub',
    description: 'IssuePilot creates a secure session and uses your public repository evidence. Returning users automatically receive their latest stored profile analysis.',
    action: 'Connect GitHub',
    href: '/signin',
  },
  {
    icon: Settings2,
    number: '02',
    title: 'Review and extend your skills',
    description: 'Keep detected technologies, change proficiency levels, and manually add tools you know or mark as learning targets. These values directly affect matching.',
    action: 'Manage skills',
    href: '/settings',
  },
  {
    icon: Search,
    number: '03',
    title: 'Choose discovery or manual analysis',
    description: 'Generate personalized recommendations, or paste any public GitHub repository URL when you already know what you want to inspect.',
    action: 'Find repositories',
    href: '/repositories',
  },
  {
    icon: ListChecks,
    number: '04',
    title: 'Shortlist a suitable issue',
    description: 'Compare setup complexity, documentation, activity, skill gaps, availability signals, and beginner-oriented issue labels before committing time.',
    action: 'View recommendations',
    href: '/repositories',
  },
  {
    icon: Workflow,
    number: '05',
    title: 'Use the contribution workspace',
    description: 'Follow the preparation flow, keep personal notes, complete setup checkpoints, and track the pull request after you open it on GitHub.',
    action: 'Open dashboard',
    href: '/dashboard',
  },
]

const efficientTips = [
  'Mark unfamiliar skills as “Learning target”. They can influence discovery, but receive less score weight than skills you already know.',
  'Start with low-setup repositories and issues that are unassigned and recently updated.',
  'Read CONTRIBUTING.md and run the project before asking to claim an issue.',
  'Use manual repository analysis when you already have a repository URL, even if it was not returned by live discovery.',
  'Refresh profile analysis only after meaningful GitHub activity—not on every login.',
]

export function HowItWorksPage() {
  const authenticated = useAuthStore((state) => state.status === 'authenticated')

  return (
    <div className="min-h-screen dot-grid">
      <Navbar variant="landing" />

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-14 pt-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              <BookOpenCheck className="h-3.5 w-3.5" /> Practical product guide
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              From GitHub profile to a contribution you can finish.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
              IssuePilot does not submit code for you. It reduces repository research, explains why a project fits, and gives you a structured workspace for doing the contribution yourself.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {steps.map(({ icon: Icon, number, title, description, action, href }) => (
              <article key={number} className="glass-card grid gap-4 p-5 sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.18em] text-emerald-400">STEP {number}</p>
                  <h2 className="mt-1 text-lg font-medium text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
                <Link to={href} className="inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200">
                  {action} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-medium text-white">Fastest useful workflow</h2>
            </div>
            <ol className="mt-5 space-y-3 text-sm text-slate-400">
              <li><span className="mr-2 text-emerald-300">1.</span>Sign in and let IssuePilot restore your latest profile analysis.</li>
              <li><span className="mr-2 text-emerald-300">2.</span>Add any missing skills in Settings.</li>
              <li><span className="mr-2 text-emerald-300">3.</span>Generate recommendations or paste a repository URL.</li>
              <li><span className="mr-2 text-emerald-300">4.</span>Choose one realistic issue and open its workspace.</li>
              <li><span className="mr-2 text-emerald-300">5.</span>Track your pull request after creating it on GitHub.</li>
            </ol>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-medium text-white">Use IssuePilot efficiently</h2>
            <ul className="mt-5 space-y-3">
              {efficientTips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm leading-6 text-slate-400">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 pt-8 text-center sm:px-6">
          <div className="glass-card p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Ready to use the real workflow?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
              Begin with your contribution profile, then decide between personalized discovery and manual repository analysis.
            </p>
            <Link
              to={authenticated ? '/dashboard' : '/signin'}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              {authenticated ? 'Open Dashboard' : 'Sign in with GitHub'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
