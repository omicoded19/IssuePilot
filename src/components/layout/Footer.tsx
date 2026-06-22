import { Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#0a0e1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">IssuePilot</span>
            </Link>
            <p className="text-sm text-slate-400">
              AI-powered open-source contribution navigator for developers who want to contribute with confidence.
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
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
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
          © 2025 IssuePilot. Open-source contribution navigator prototype.
        </div>
      </div>
    </footer>
  )
}
