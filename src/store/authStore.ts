import { create } from 'zustand'
import {
  getAuthStatus,
  getGitHubLoginUrl,
  logoutAuthUser,
} from '@/services/auth-api'
import type { AuthUser } from '@/types/auth'

export type AuthStateStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStateStatus
  configured: boolean
  user: AuthUser | null
  error: string | null
  bootstrap: () => Promise<void>
  loginWithGitHub: () => void
  logout: () => Promise<void>
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
      set({ status: 'unauthenticated', user: null, error: null })
    }
  },
  clearError: () => set({ error: null }),
}))
