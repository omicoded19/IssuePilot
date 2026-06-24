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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b border-white/8 bg-[#0a0e1a]/80 backdrop-blur-xl px-4 h-14 flex items-center justify-between">
          <MobileNav />
          <span className="text-sm text-slate-400">Welcome, {user?.displayName ?? 'Contributor'}</span>
        </div>
        <div className="hidden lg:block">
          <Navbar variant="app" />
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
