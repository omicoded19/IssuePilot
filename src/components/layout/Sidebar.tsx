import { BookOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { navItems } from './navigation'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'

interface SidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/8 bg-[#0b0b0b]/94 backdrop-blur-xl xl:flex',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={cn('p-4 border-b border-white/8', collapsed && 'px-2')}>
        <NavLink to="/" aria-label="IssuePilot home">
          <IssuePilotLogo compact={collapsed} />
        </NavLink>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-white/8 p-4">
          <div className="glass-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-white">Quick Tip</span>
            </div>
            <p className="text-xs text-slate-400">
              Start with repositories marked Beginner–Intermediate for your first contribution.
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

