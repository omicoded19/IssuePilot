import type { UserProfile } from '@/types/user'

export const mockUserProfile: UserProfile = {
  username: 'devcontributor',
  displayName: 'Alex Chen',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  githubConnected: false,
  bio: 'Full-stack developer passionate about open source',
  location: 'San Francisco, CA',
  publicRepos: 42,
  followers: 128,
}
