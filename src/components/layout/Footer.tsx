import { Link } from 'react-router-dom'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="mb-4 inline-flex" aria-label="IssuePilot home">
              <IssuePilotLogo />
            </Link>
            <p className="text-sm text-slate-400">
              Repository intelligence and contribution workflow for developers who want to contribute with confidence.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/repositories" className="hover:text-white transition-colors">Repositories</Link></li>
              <li><Link to="/organizations" className="hover:text-white transition-colors">Organizations</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/onboarding" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Connect</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/8 text-center text-xs text-slate-500">
          © 2026 IssuePilot. Open-source contribution workflow.
        </div>
      </div>
    </footer>
  )
}
