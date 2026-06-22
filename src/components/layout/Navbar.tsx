import { Bell, Rocket, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  const profile = useUserStore((s) => s.profile)

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
              )
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {variant === 'landing' ? (
            <>
              <Link
                to="/onboarding"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </Link>
              <Link
                to="/onboarding"
                className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-lg hover:from-cyan-500 hover:to-indigo-500 transition-all"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <button type="button" aria-label="Search" className="p-2 text-slate-400 hover:text-white hidden sm:block">
                <Search className="w-4 h-4" />
              </button>
              <button type="button" aria-label="Notifications" className="p-2 text-slate-400 hover:text-white relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              </button>
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full border border-white/10"
              />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
