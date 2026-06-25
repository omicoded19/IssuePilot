import { Outlet } from 'react-router-dom'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen dot-grid flex">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/8 bg-[#080808]/92 px-3 backdrop-blur-xl sm:px-4 xl:hidden">
          <MobileNav />
          <span className="min-w-0 max-w-[calc(100vw-5rem)] truncate text-right text-sm text-slate-400">
            Welcome, {user?.displayName ?? 'Contributor'}
          </span>
        </div>
        <div className="hidden xl:block">
          <Navbar variant="app" />
        </div>
        <main className="relative z-0 min-w-0 flex-1 overflow-x-hidden p-3 sm:p-5 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
