import {
  BarChart3,
  BookOpenCheck,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Rocket,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitHubSignInButton } from '@/components/auth/GitHubSignInButton'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'
import { useAuthStore } from '@/store/authStore'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useIssueIntelligenceStore } from '@/store/issueIntelligenceStore'
import { usePullRequestStore } from '@/store/pullRequestStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useUserStore } from '@/store/userStore'

interface NavbarProps {
  variant?: 'landing' | 'app'
}

interface SearchItem {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  keywords: string
}

interface NotificationItem {
  id: string
  title: string
  description: string
  href?: string
  externalUrl?: string
  icon: LucideIcon
  tone: 'cyan' | 'amber' | 'emerald' | 'violet'
}

const landingLinks = [
  { href: '#product', label: 'Product' },
  { href: '/how-it-works', label: 'How It Works', isRoute: true },
  { href: '/repositories', label: 'Repositories', isRoute: true },
  { href: '/analytics', label: 'Analytics', isRoute: true },
]

const pageSearchItems: SearchItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'View your contribution progress and current activity.',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: 'home overview progress activity',
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    description: 'Learn the fastest path from profile analysis to a tracked pull request.',
    href: '/how-it-works',
    icon: BookOpenCheck,
    keywords: 'guide help workflow tutorial contribution',
  },
  {
    id: 'profile',
    label: 'Developer Profile',
    description: 'Review detected skills and contribution preferences.',
    href: '/profile',
    icon: UserRound,
    keywords: 'github profile skills languages preferences onboarding',
  },
  {
    id: 'organizations',
    label: 'Organizations',
    description: 'Explore organizations matched to your profile.',
    href: '/organizations',
    icon: Building2,
    keywords: 'open source companies communities recommendations',
  },
  {
    id: 'repositories',
    label: 'Repositories',
    description: 'Browse personalized repository recommendations.',
    href: '/repositories',
    icon: GitBranch,
    keywords: 'repos projects recommendations github',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Inspect contribution and performance analytics.',
    href: '/analytics',
    icon: BarChart3,
    keywords: 'metrics statistics benchmark redis performance',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage your GitHub connection and contribution preferences.',
    href: '/settings',
    icon: Settings,
    keywords: 'account github preferences availability logout',
  },
]

const notificationToneClasses: Record<NotificationItem['tone'], string> = {
  cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
}

export function Navbar({ variant = 'landing' }: NavbarProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsSeen, setNotificationsSeen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profile = useUserStore((state) => state.profile)
  const { status, user, logout } = useAuthStore()
  const developerAnalysis = useDeveloperProfileStore((state) => state.analysis)
  const recommendationData = useRecommendationStore((state) => state.data)
  const issueRecommendations = useIssueIntelligenceStore((state) => state.recommendations)
  const workspace = useIssueIntelligenceStore((state) => state.workspace)
  const pullRequestTracking = usePullRequestStore((state) => state.tracking)
  const authenticated = status === 'authenticated' && user !== null

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        setMenuOpen(false)
        setNotificationsOpen(false)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMenuOpen(false)
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const searchItems = useMemo<SearchItem[]>(() => {
    const repositoryItems = recommendationData?.repositories.map((repository) => ({
      id: `repository-${repository.id}`,
      label: repository.fullName,
      description: `${repository.matchScore}% match · ${repository.primaryLanguage} · ${repository.suitableIssueCount} suitable issues`,
      href: `/repositories/${encodeURIComponent(repository.fullName)}`,
      icon: GitBranch,
      keywords: `${repository.organization} ${repository.description} ${repository.technologies.join(' ')}`,
    })) ?? []

    const issueItems = issueRecommendations?.issues.map((issue) => ({
      id: `issue-${issue.githubIssueId}`,
      label: `#${issue.number} ${issue.title}`,
      description: `${issueRecommendations.repository.fullName} · ${issue.matchScore}% match · ${issue.difficulty}`,
      href: `/workspace/${issueRecommendations.repository.owner}/${issueRecommendations.repository.name}/${issue.number}`,
      icon: CircleAlert,
      keywords: `${issue.contributionType} ${issue.labels.join(' ')} ${issue.requiredTechnologies.join(' ')}`,
    })) ?? []

    return [...pageSearchItems, ...repositoryItems, ...issueItems]
  }, [issueRecommendations, recommendationData])

  const filteredSearchItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return searchItems.slice(0, 8)

    return searchItems
      .filter((item) =>
        `${item.label} ${item.description} ${item.keywords}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 10)
  }, [searchItems, searchQuery])

  const notificationItems = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    if (!developerAnalysis) {
      items.push({
        id: 'profile-analysis',
        title: 'Complete your developer profile',
        description: 'Analyse your GitHub activity so recommendations can use your real skills.',
        href: '/profile',
        icon: UserRound,
        tone: 'amber',
      })
    }

    if (!recommendationData) {
      items.push({
        id: 'repository-recommendations',
        title: 'Generate repository recommendations',
        description: 'Replace demo cards with personalized repositories using live GitHub metadata.',
        href: '/repositories',
        icon: GitBranch,
        tone: 'cyan',
      })
    } else {
      items.push({
        id: 'repository-results',
        title: `${recommendationData.metadata.repositoriesReturned} repository matches are ready`,
        description: `Generated from ${recommendationData.metadata.candidateRepositoriesChecked} evaluated repositories.`,
        href: '/repositories',
        icon: CheckCircle2,
        tone: 'emerald',
      })
    }

    if (issueRecommendations) {
      items.push({
        id: 'issue-results',
        title: `${issueRecommendations.issues.length} issues ranked for you`,
        description: `Open the personalized issue list for ${issueRecommendations.repository.fullName}.`,
        href: `/repositories/${encodeURIComponent(issueRecommendations.repository.fullName)}/issues`,
        icon: CircleAlert,
        tone: 'violet',
      })
    }

    if (workspace) {
      items.push({
        id: 'active-workspace',
        title: 'Contribution workspace in progress',
        description: `${workspace.repository.fullName} · issue #${workspace.issue.number}`,
        href: `/workspace/${workspace.repository.owner}/${workspace.repository.name}/${workspace.issue.number}`,
        icon: Rocket,
        tone: 'cyan',
      })
    }

    if (pullRequestTracking?.pullRequest) {
      items.push({
        id: 'pull-request',
        title: `Pull request #${pullRequestTracking.pullRequest.number}: ${pullRequestTracking.pullRequest.status.replaceAll('_', ' ')}`,
        description: pullRequestTracking.pullRequest.title,
        externalUrl: pullRequestTracking.pullRequest.githubUrl,
        icon: GitBranch,
        tone: pullRequestTracking.pullRequest.merged ? 'emerald' : 'violet',
      })
    }

    return items
  }, [developerAnalysis, issueRecommendations, pullRequestTracking, recommendationData, workspace])

  const openSearch = () => {
    setSearchOpen(true)
    setMenuOpen(false)
    setNotificationsOpen(false)
  }

  const selectSearchItem = (href: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    navigate(href)
  }

  const selectNotification = (notification: NotificationItem) => {
    setNotificationsOpen(false)
    setNotificationsSeen(true)

    if (notification.externalUrl) {
      window.open(notification.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (notification.href) navigate(notification.href)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#080808]/92 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" aria-label="IssuePilot home">
            <IssuePilotLogo />
          </Link>

          {variant === 'landing' && (
            <nav className="hidden md:flex items-center gap-6">
              {landingLinks.map((link) =>
                link.isRoute ? (
                  <Link key={link.label} to={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                ),
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {variant === 'landing' ? (
              authenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
                >
                  <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <GitHubSignInButton className="hidden sm:inline-flex py-1.5" label="GitHub" />
                  <Link
                    to="/onboarding"
                    className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={openSearch}
                  aria-label="Search IssuePilot"
                  className="hidden items-center gap-1 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white sm:flex"
                  title="Search IssuePilot (⌘K)"
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((open) => !open)
                      setNotificationsSeen(true)
                      setMenuOpen(false)
                    }}
                    aria-label="Open notifications"
                    aria-expanded={notificationsOpen}
                    className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                  >
                    <Bell className="w-4 h-4" />
                    {!notificationsSeen && notificationItems.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
                      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">Activity</p>
                          <p className="text-xs text-slate-500">Actionable updates from your workspace</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-white"
                          aria-label="Close notifications"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="max-h-[26rem] overflow-y-auto p-2">
                        {notificationItems.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-300" />
                            <p className="mt-2 text-sm font-medium text-white">All caught up</p>
                            <p className="mt-1 text-xs text-slate-500">No current actions need your attention.</p>
                          </div>
                        ) : (
                          notificationItems.map((notification) => {
                            const Icon = notification.icon
                            return (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() => selectNotification(notification)}
                                className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/5"
                              >
                                <span className={`mt-0.5 rounded-lg border p-2 ${notificationToneClasses[notification.tone]}`}>
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-100">
                                    {notification.title}
                                  </span>
                                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                                    {notification.description}
                                  </span>
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen((open) => !open)
                      setNotificationsOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-lg border border-transparent p-1 hover:border-white/10 hover:bg-white/5"
                    aria-expanded={menuOpen}
                    aria-label="Open account menu"
                  >
                    <img
                      src={user?.avatarUrl ?? profile.avatarUrl}
                      alt={user?.displayName ?? profile.displayName}
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#111111] p-2 shadow-2xl">
                      <div className="px-3 py-2 border-b border-white/8 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.displayName ?? profile.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {authenticated ? `@${user.username}` : 'Guest session'}
                        </p>
                      </div>
                      {authenticated ? (
                        <>
                          <Link
                            to="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false)
                              void logout().then(() =>
                                navigate('/signin', {
                                  replace: true,
                                  state: { signedOut: true },
                                }),
                              )
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </>
                      ) : (
                        <Link
                          to="/signin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-cyan-300 hover:bg-white/5"
                        >
                          Connect GitHub
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-5 w-5 shrink-0 text-slate-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pages, repositories, and issues..."
                className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-500 hover:text-white"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[28rem] overflow-y-auto p-2">
              {filteredSearchItems.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Search className="mx-auto h-6 w-6 text-slate-600" />
                  <p className="mt-2 text-sm font-medium text-white">No results found</p>
                  <p className="mt-1 text-xs text-slate-500">Try a page name, repository, technology, or issue label.</p>
                </div>
              ) : (
                filteredSearchItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectSearchItem(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5"
                    >
                      <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-100">{item.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">{item.description}</span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t border-white/8 px-4 py-2 text-[11px] text-slate-600">
              Press <span className="text-slate-400">⌘K</span> anytime to open search.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
