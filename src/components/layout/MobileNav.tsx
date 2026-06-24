import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from './navigation'
import { cn } from '@/lib/cn'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'

interface MobileNavProps {
  onNavigate?: () => void
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="lg:hidden p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0b0b0b] border-r border-white/10 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <NavLink to="/" onClick={handleClose} aria-label="IssuePilot home">
                <IssuePilotLogo />
              </NavLink>
              <button type="button" onClick={handleClose} aria-label="Close menu" className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-1 flex-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
