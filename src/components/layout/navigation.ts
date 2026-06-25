import {
  BarChart3,
  Building2,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  BookOpenCheck,
  Settings,
  UserRound,
} from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/how-it-works', label: 'How It Works', icon: BookOpenCheck },
  { to: '/profile', label: 'Developer Profile', icon: UserRound },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/repositories', label: 'Repositories', icon: GitBranch },
  { to: '/contributions', label: 'My Contributions', icon: GitPullRequest },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
