import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApiClientError } from '@/services/api-client'
import {
  generateRecommendations,
  getLatestRecommendations,
} from '@/services/recommendation-api'
import type {
  RecommendationData,
  RecommendationRequest,
} from '@/types/recommendation'

interface RecommendationState {
  data: RecommendationData | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  generate: (request: RecommendationRequest) => Promise<RecommendationData>
  loadLatest: (username: string) => Promise<RecommendationData>
  clearError: () => void
  reset: () => void
}

function messageFromError(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  return 'Could not generate recommendations.'
}

export const useRecommendationStore = create<RecommendationState>()(
  persist(
    (set) => ({
      data: null,
      status: 'idle',
      error: null,
      generate: async (request) => {
        set({ status: 'loading', error: null })
        try {
          const data = await generateRecommendations(request)
          set({ data, status: 'success', error: null })
          return data
        } catch (error) {
          set({ status: 'error', error: messageFromError(error) })
          throw error
        }
      },
      loadLatest: async (username) => {
        set({ status: 'loading', error: null })
        try {
          const data = await getLatestRecommendations(username)
          set({ data, status: 'success', error: null })
          return data
        } catch (error) {
          set({ status: 'error', error: messageFromError(error) })
          throw error
        }
      },
      clearError: () => set({ error: null }),
      reset: () => set({ data: null, status: 'idle', error: null }),
    }),
    {
      name: 'issuepilot-recommendations',
      partialize: (state) => ({ data: state.data }),
    },
  ),
)
