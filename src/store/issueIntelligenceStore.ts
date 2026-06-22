import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApiClientError } from '@/services/api-client'
import {
  createContributionWorkspace,
  getContributionWorkspace,
  recommendRepositoryIssues,
  updateContributionWorkspace,
} from '@/services/issue-intelligence-api'
import type {
  ContributionWorkspace,
  ContributionWorkspaceRequest,
  ContributionWorkspaceUpdate,
  IssueRecommendationData,
  IssueRecommendationRequest,
} from '@/types/issue-intelligence'

interface IssueIntelligenceState {
  recommendations: IssueRecommendationData | null
  workspace: ContributionWorkspace | null
  recommendationStatus: 'idle' | 'loading' | 'success' | 'error'
  workspaceStatus: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  recommend: (request: IssueRecommendationRequest) => Promise<IssueRecommendationData>
  createWorkspace: (request: ContributionWorkspaceRequest) => Promise<ContributionWorkspace>
  loadWorkspace: (
    username: string,
    owner: string,
    repository: string,
    issueNumber: number,
  ) => Promise<ContributionWorkspace>
  saveWorkspace: (update: ContributionWorkspaceUpdate) => Promise<ContributionWorkspace>
  clearError: () => void
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  if (error instanceof Error) return error.message
  return 'The issue guidance request could not be completed.'
}

export const useIssueIntelligenceStore = create<IssueIntelligenceState>()(
  persist(
    (set, get) => ({
      recommendations: null,
      workspace: null,
      recommendationStatus: 'idle',
      workspaceStatus: 'idle',
      error: null,
      recommend: async (request) => {
        set({ recommendationStatus: 'loading', error: null })
        try {
          const recommendations = await recommendRepositoryIssues(request)
          set({ recommendations, recommendationStatus: 'success' })
          return recommendations
        } catch (error) {
          set({ recommendationStatus: 'error', error: errorMessage(error) })
          throw error
        }
      },
      createWorkspace: async (request) => {
        set({ workspaceStatus: 'loading', error: null })
        try {
          const workspace = await createContributionWorkspace(request)
          set({ workspace, workspaceStatus: 'success' })
          return workspace
        } catch (error) {
          set({ workspaceStatus: 'error', error: errorMessage(error) })
          throw error
        }
      },
      loadWorkspace: async (username, owner, repository, issueNumber) => {
        set({ workspaceStatus: 'loading', error: null })
        try {
          const workspace = await getContributionWorkspace(
            username,
            owner,
            repository,
            issueNumber,
          )
          set({ workspace, workspaceStatus: 'success' })
          return workspace
        } catch (error) {
          set({ workspaceStatus: 'error', error: errorMessage(error) })
          throw error
        }
      },
      saveWorkspace: async (update) => {
        const workspaceId = get().workspace?.id
        if (!workspaceId) throw new Error('No contribution workspace is open.')
        set({ workspaceStatus: 'loading', error: null })
        try {
          const workspace = await updateContributionWorkspace(workspaceId, update)
          set({ workspace, workspaceStatus: 'success' })
          return workspace
        } catch (error) {
          set({ workspaceStatus: 'error', error: errorMessage(error) })
          throw error
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'issuepilot-issue-intelligence',
      partialize: (state) => ({
        recommendations: state.recommendations,
        workspace: state.workspace,
      }),
    },
  ),
)
