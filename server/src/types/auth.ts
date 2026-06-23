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

export interface GitHubOAuthUser {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  email: string | null
  bio: string | null
  location: string | null
  company: string | null
  public_repos: number
  followers: number
  following: number
}

export interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

export interface StoredAuthUser extends AuthUser {
  encryptedAccessToken: string
  accessTokenIv: string
  accessTokenAuthTag: string
}

export interface AuthStatusResponse {
  configured: boolean
  authenticated: boolean
  user: AuthUser | null
}
