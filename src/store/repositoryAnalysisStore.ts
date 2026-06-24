import { create } from 'zustand'
import {
  analyzeRepository,
  getRepositoryAnalysis,
} from '@/services/repository-api'
import { ApiClientError } from '@/services/api-client'
import type { RealRepositoryAnalysis } from '@/types/repository-analysis'

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

interface RepositoryAnalysisState {
  currentAnalysis: RealRepositoryAnalysis | null
  status: AnalysisStatus
  error: string | null
  errorCode: string | null
  analyze: (repositoryUrl: string) => Promise<RealRepositoryAnalysis>
  loadStored: (owner: string, repository: string) => Promise<RealRepositoryAnalysis>
  clearError: () => void
  reset: () => void
}

function errorDetails(error: unknown): { message: string; code: string } {
  if (error instanceof ApiClientError) {
    return { message: error.message, code: error.code }
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' }
  }
  return { message: 'An unexpected error occurred.', code: 'UNKNOWN_ERROR' }
}

export const useRepositoryAnalysisStore = create<RepositoryAnalysisState>()(
  (set) => ({
    currentAnalysis: null,
    status: 'idle',
    error: null,
    errorCode: null,
    analyze: async (repositoryUrl) => {
      set({ status: 'loading', error: null, errorCode: null })
      try {
        const analysis = await analyzeRepository(repositoryUrl)
        set({ currentAnalysis: analysis, status: 'success' })
        return analysis
      } catch (error) {
        const details = errorDetails(error)
        set({ status: 'error', error: details.message, errorCode: details.code })
        throw error
      }
    },
    loadStored: async (owner, repository) => {
      set({ status: 'loading', error: null, errorCode: null })
      try {
        const analysis = await getRepositoryAnalysis(owner, repository)
        set({ currentAnalysis: analysis, status: 'success' })
        return analysis
      } catch (error) {
        const details = errorDetails(error)
        set({ status: 'error', error: details.message, errorCode: details.code })
        throw error
      }
    },
    clearError: () => set({ error: null, errorCode: null }),
    reset: () =>
      set({
        currentAnalysis: null,
        status: 'idle',
        error: null,
        errorCode: null,
      }),
  }),
)
