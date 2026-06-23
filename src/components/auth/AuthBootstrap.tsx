import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'

interface AuthBootstrapProps {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const authUser = useAuthStore((state) => state.user)
  const setProfileFromGitHub = useUserStore((state) => state.setProfileFromGitHub)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!authUser) return

    setProfileFromGitHub({
      username: authUser.username,
      displayName: authUser.displayName,
      avatarUrl: authUser.avatarUrl,
      githubConnected: true,
      bio: authUser.bio ?? '',
      location: authUser.location ?? '',
      publicRepos: authUser.publicRepos,
      followers: authUser.followers,
      following: authUser.following,
      profileUrl: authUser.profileUrl,
      company: authUser.company,
    })
  }, [authUser, setProfileFromGitHub])

  return children
}
