import { Bell, ChevronDown, LogOut, Rocket, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GitHubSignInButton } from '@/components/auth/GitHubSignInButton'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'

interface NavbarProps {
  variant?: 'landing' | 'app'
}

const landingLinks = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '/repositories', label: 'Repositories', isRoute: true },
  { href: '/analytics', label: 'Analytics', isRoute: true },
]

export function Navbar({ variant = 'landing' }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const profile = useUserStore((state) => state.profile)
  const disconnectGitHub = useUserStore((state) => state.disconnectGitHub)
  const { status, user, logout } = useAuthStore()
  const authenticated = status === 'authenticated' && user !== null

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">IssuePilot</span>
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
              <button type="button" aria-label="Search" className="p-2 text-slate-400 hover:text-white hidden sm:block">
                <Search className="w-4 h-4" />
              </button>
              <button type="button" aria-label="Notifications" className="p-2 text-slate-400 hover:text-white relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
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
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#111626] p-2 shadow-2xl">
                    <div className="px-3 py-2 border-b border-white/8 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.displayName ?? profile.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {authenticated ? `@${user.username}` : 'Guest session'}
                      </p>
                    </div>
                    {authenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          void logout().then(disconnectGitHub)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    ) : (
                      <Link
                        to="/onboarding"
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
  )
}
