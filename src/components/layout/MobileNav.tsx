import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { navItems } from './navigation'
import { cn } from '@/lib/cn'
import { IssuePilotLogo } from '@/components/brand/IssuePilotLogo'

interface MobileNavProps {
  onNavigate?: () => void
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
    onNavigate?.()
  }, [onNavigate])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, open])

  const drawer = open && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm"
            onClick={handleClose}
            aria-label="Close navigation menu"
            tabIndex={-1}
          />

          <aside className="absolute inset-y-0 left-0 z-10 flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden border-r border-white/10 bg-[#0b0b0b] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/8 p-4">
              <NavLink to="/" onClick={handleClose} aria-label="IssuePilot home">
                <IssuePilotLogo />
              </NavLink>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'border border-cyan-500/20 bg-cyan-500/15 text-cyan-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white xl:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {drawer}
    </>
  )
}
