import { create } from 'zustand'
import { getMyAnalytics } from '@/services/analytics-api'
import type { AnalyticsData } from '@/types/analytics'

interface AnalyticsState {
  data: AnalyticsData | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  load: () => Promise<void>
  clear: () => void
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  status: 'idle',
  error: null,
  load: async () => {
    set({ status: 'loading', error: null })
    try {
      const data = await getMyAnalytics()
      set({ data, status: 'ready', error: null })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not load analytics.',
      })
      throw error
    }
  },
  clear: () => set({ data: null, status: 'idle', error: null }),
}))
