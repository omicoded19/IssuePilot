export interface AuthUser {
  id: string
  githubUserId: string
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  email: string | null
  bio: string | null
  location: string | null
  company: string | null
  publicRepos: number
  followers: number
  following: number
  lastLoginAt: string
}

export interface AuthStatus {
  configured: boolean
  authenticated: boolean
  user: AuthUser | null
}
