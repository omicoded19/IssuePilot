import {
  BarChart3,
  Building2,
  GitBranch,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/onboarding', label: 'Settings', icon: Settings },
]
