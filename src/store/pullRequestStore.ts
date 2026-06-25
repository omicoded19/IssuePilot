import { create } from 'zustand'
import { ApiClientError } from '@/services/api-client'
import {
  getPullRequestTracking,
  listPullRequestTrackings,
  syncPullRequestTracking,
} from '@/services/pull-request-api'
import type { PullRequestTrackingData } from '@/types/pull-request'

interface PullRequestState {
  tracking: PullRequestTrackingData | null
  trackings: PullRequestTrackingData[]
  workspaceId: string | null
  status: 'idle' | 'loading' | 'success' | 'error'
  listStatus: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  load: (workspaceId: string) => Promise<PullRequestTrackingData | null>
  loadAll: () => Promise<PullRequestTrackingData[]>
  sync: (workspaceId: string, pullRequestUrl?: string) => Promise<PullRequestTrackingData>
  refreshAll: () => Promise<PullRequestTrackingData[]>
  clear: () => void
}

function message(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  return 'Pull-request tracking could not be completed.'
}

function replaceTracking(
  trackings: PullRequestTrackingData[],
  next: PullRequestTrackingData,
): PullRequestTrackingData[] {
  const exists = trackings.some((tracking) => tracking.workspaceId === next.workspaceId)
  const updated = exists
    ? trackings.map((tracking) =>
        tracking.workspaceId === next.workspaceId ? next : tracking,
      )
    : [next, ...trackings]

  return [...updated].sort((left, right) => {
    const active = new Set(['open', 'draft', 'in_review', 'changes_requested', 'approved'])
    const leftActive = left.pullRequest && active.has(left.pullRequest.status) ? 0 : 1
    const rightActive = right.pullRequest && active.has(right.pullRequest.status) ? 0 : 1
    return leftActive - rightActive ||
      Date.parse(right.metadata.syncedAt) - Date.parse(left.metadata.syncedAt)
  })
}

export const usePullRequestStore = create<PullRequestState>((set, get) => ({
  tracking: null,
  trackings: [],
  workspaceId: null,
  status: 'idle',
  listStatus: 'idle',
  error: null,
  load: async (workspaceId) => {
    set({ status: 'loading', error: null, workspaceId })
    try {
      const tracking = await getPullRequestTracking(workspaceId)
      set((state) => ({
        tracking,
        trackings: replaceTracking(state.trackings, tracking),
        status: 'success',
        workspaceId,
      }))
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
  loadAll: async () => {
    set({ listStatus: 'loading', error: null })
    try {
      const trackings = await listPullRequestTrackings()
      set({ trackings, listStatus: 'success' })
      return trackings
    } catch (error) {
      set({ listStatus: 'error', error: message(error) })
      throw error
    }
  },
  sync: async (workspaceId, pullRequestUrl) => {
    set({ status: 'loading', error: null, workspaceId })
    try {
      const tracking = await syncPullRequestTracking(workspaceId, pullRequestUrl)
      set((state) => ({
        tracking,
        trackings: replaceTracking(state.trackings, tracking),
        status: 'success',
        workspaceId,
      }))
      return tracking
    } catch (error) {
      set({ status: 'error', error: message(error), workspaceId })
      throw error
    }
  },
  refreshAll: async () => {
    const active = new Set(['open', 'draft', 'in_review', 'changes_requested', 'approved'])
    const existing = get().trackings.filter(
      (tracking) => tracking.pullRequest && active.has(tracking.pullRequest.status),
    )
    set({ listStatus: 'loading', error: null })
    const failures: string[] = []

    for (const tracking of existing) {
      try {
        const next = await syncPullRequestTracking(
          tracking.workspaceId,
          tracking.pullRequest?.githubUrl,
        )
        set((state) => ({
          trackings: replaceTracking(state.trackings, next),
        }))
      } catch (error) {
        failures.push(`${tracking.repository.fullName}: ${message(error)}`)
      }
    }

    set({
      listStatus: 'success',
      error: failures.length > 0
        ? `${failures.length} contribution(s) could not be refreshed. Other statuses were updated.`
        : null,
    })
    return get().trackings
  },
  clear: () =>
    set({
      tracking: null,
      trackings: [],
      workspaceId: null,
      status: 'idle',
      listStatus: 'idle',
      error: null,
    }),
}))
