import { create } from 'zustand'
import {
  deleteAuthAccount,
  getAuthStatus,
  getGitHubLoginUrl,
  logoutAuthUser,
} from '@/services/auth-api'
import type { AuthUser } from '@/types/auth'
import { clearUserSessionData } from '@/lib/clear-user-session'

export type AuthStateStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStateStatus
  configured: boolean
  user: AuthUser | null
  error: string | null
  bootstrap: () => Promise<void>
  loginWithGitHub: () => void
  logout: () => Promise<void>
  deleteAccount: () => Promise<{ githubAuthorizationRevoked: boolean }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  configured: false,
  user: null,
  error: null,
  bootstrap: async () => {
    set({ status: 'loading', error: null })
    try {
      const result = await getAuthStatus()
      set({
        configured: result.configured,
        status: result.authenticated ? 'authenticated' : 'unauthenticated',
        user: result.user,
      })
    } catch (error) {
      set({
        status: 'unauthenticated',
        configured: false,
        user: null,
        error: error instanceof Error ? error.message : 'Could not check GitHub sign-in.',
      })
    }
  },
  loginWithGitHub: () => {
    window.location.assign(getGitHubLoginUrl())
  },
  logout: async () => {
    try {
      await logoutAuthUser()
    } finally {
      clearUserSessionData()
      set({ status: 'unauthenticated', user: null, error: null })
    }
  },
  deleteAccount: async () => {
    const result = await deleteAuthAccount()
    clearUserSessionData()
    set({ status: 'unauthenticated', user: null, error: null })
    return { githubAuthorizationRevoked: result.githubAuthorizationRevoked }
  },
  clearError: () => set({ error: null }),
}))
