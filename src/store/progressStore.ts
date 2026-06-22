import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultWorkspaceSteps, preparationFlowNodes } from '@/data/flow'
import type { FlowNodeData, FlowNodeStatus } from '@/types/analytics'
import type { WorkspaceStep } from '@/types/issue'

interface ProgressState {
  flowNodes: FlowNodeData[]
  workspaceSteps: typeof defaultWorkspaceSteps
  personalNotes: string
  updateNodeStatus: (nodeId: string, status: FlowNodeStatus) => void
  toggleChecklistItem: (nodeId: string, itemId: string) => void
  toggleWorkspaceStep: (stepId: WorkspaceStep) => void
  setPersonalNotes: (notes: string) => void
  saveProgress: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      flowNodes: preparationFlowNodes,
      workspaceSteps: defaultWorkspaceSteps,
      personalNotes: '',
      updateNodeStatus: (nodeId, status) =>
        set((state) => ({
          flowNodes: state.flowNodes.map((n) =>
            n.id === nodeId ? { ...n, status } : n
          ),
        })),
      toggleChecklistItem: (nodeId, itemId) =>
        set((state) => ({
          flowNodes: state.flowNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  checklist: n.checklist.map((c) =>
                    c.id === itemId ? { ...c, checked: !c.checked } : c
                  ),
                }
              : n
          ),
        })),
      toggleWorkspaceStep: (stepId) =>
        set((state) => ({
          workspaceSteps: state.workspaceSteps.map((s) =>
            s.id === stepId ? { ...s, completed: !s.completed } : s
          ),
        })),
      setPersonalNotes: (notes) => set({ personalNotes: notes }),
      saveProgress: () => {
        /* persisted automatically */
      },
    }),
    { name: 'issuepilot-progress' }
  )
)
