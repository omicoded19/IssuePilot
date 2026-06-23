import { create } from 'zustand'
import { ApiClientError } from '@/services/api-client'
import {
  getPullRequestTracking,
  syncPullRequestTracking,
} from '@/services/pull-request-api'
import type { PullRequestTrackingData } from '@/types/pull-request'

interface PullRequestState {
  tracking: PullRequestTrackingData | null
  workspaceId: string | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  load: (workspaceId: string) => Promise<PullRequestTrackingData | null>
  sync: (workspaceId: string, pullRequestUrl?: string) => Promise<PullRequestTrackingData>
  clear: () => void
}

function message(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  return 'Pull-request tracking could not be completed.'
}

export const usePullRequestStore = create<PullRequestState>((set) => ({
  tracking: null,
  workspaceId: null,
  status: 'idle',
  error: null,
  load: async (workspaceId) => {
    set({ status: 'loading', error: null, workspaceId })
    try {
      const tracking = await getPullRequestTracking(workspaceId)
      set({ tracking, status: 'success', workspaceId })
      return tracking
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'PULL_REQUEST_TRACKING_NOT_FOUND') {
        set({ tracking: null, status: 'idle', workspaceId, error: null })
        return null
      }
      set({ status: 'error', error: message(error), workspaceId })
      throw error
    }
  },
  sync: async (workspaceId, pullRequestUrl) => {
    set({ status: 'loading', error: null, workspaceId })
    try {
      const tracking = await syncPullRequestTracking(workspaceId, pullRequestUrl)
      set({ tracking, status: 'success', workspaceId })
      return tracking
    } catch (error) {
      set({ status: 'error', error: message(error), workspaceId })
      throw error
    }
  },
  clear: () => set({ tracking: null, workspaceId: null, status: 'idle', error: null }),
}))
