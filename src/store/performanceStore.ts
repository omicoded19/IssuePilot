import { create } from 'zustand'
import {
  getMyPerformanceDashboard,
  runPerformanceBenchmark,
} from '@/services/performance-api'
import type { PerformanceDashboardData } from '@/types/performance'

interface PerformanceState {
  data: PerformanceDashboardData | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  benchmarkStatus: 'idle' | 'running' | 'error'
  error: string | null
  load: () => Promise<void>
  runBenchmark: (repositoryUrl: string) => Promise<void>
  clear: () => void
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  data: null,
  status: 'idle',
  benchmarkStatus: 'idle',
  error: null,
  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const data = await getMyPerformanceDashboard()
      set({ data, status: 'ready', error: null })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not load performance data.',
      })
    }
  },
  runBenchmark: async (repositoryUrl) => {
    set({ benchmarkStatus: 'running', error: null })
    try {
      await runPerformanceBenchmark(repositoryUrl)
      const data = await getMyPerformanceDashboard()
      set({ data, status: 'ready', benchmarkStatus: 'idle', error: null })
    } catch (error) {
      set({
        benchmarkStatus: 'error',
        error: error instanceof Error ? error.message : 'Could not run the benchmark.',
      })
      throw error
    }
  },
  clear: () =>
    set({
      data: null,
      status: 'idle',
      benchmarkStatus: 'idle',
      error: null,
    }),
}))
