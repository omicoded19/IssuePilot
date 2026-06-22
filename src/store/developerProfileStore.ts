import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeveloperProfileAnalysisData } from '@/types/developer-profile'

interface DeveloperProfileState {
  analysis: DeveloperProfileAnalysisData | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  setLoading: () => void
  setAnalysis: (analysis: DeveloperProfileAnalysisData) => void
  setError: (message: string) => void
  clearError: () => void
  reset: () => void
}

export const useDeveloperProfileStore = create<DeveloperProfileState>()(
  persist(
    (set) => ({
      analysis: null,
      status: 'idle',
      error: null,
      setLoading: () => set({ status: 'loading', error: null }),
      setAnalysis: (analysis) => set({ analysis, status: 'success', error: null }),
      setError: (message) => set({ status: 'error', error: message }),
      clearError: () => set({ error: null }),
      reset: () => set({ analysis: null, status: 'idle', error: null }),
    }),
    {
      name: 'issuepilot-developer-profile',
      partialize: (state) => ({ analysis: state.analysis }),
    },
  ),
)
