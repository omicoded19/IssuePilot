import {
  BarChart3,
  Building2,
  GitBranch,
  LayoutDashboard,
  Settings,
  UserRound,
} from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Developer Profile', icon: UserRound },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
