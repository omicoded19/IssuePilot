import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SavedState {
  savedRepositoryIds: string[]
  savedIssueIds: string[]
  toggleRepository: (id: string) => void
  toggleIssue: (id: string) => void
  isRepositorySaved: (id: string) => boolean
  isIssueSaved: (id: string) => boolean
  reset: () => void
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedRepositoryIds: [],
      savedIssueIds: [],
      toggleRepository: (id) =>
        set((state) => ({
          savedRepositoryIds: state.savedRepositoryIds.includes(id)
            ? state.savedRepositoryIds.filter((r) => r !== id)
            : [...state.savedRepositoryIds, id],
        })),
      toggleIssue: (id) =>
        set((state) => ({
          savedIssueIds: state.savedIssueIds.includes(id)
            ? state.savedIssueIds.filter((i) => i !== id)
            : [...state.savedIssueIds, id],
        })),
      isRepositorySaved: (id) => get().savedRepositoryIds.includes(id),
      isIssueSaved: (id) => get().savedIssueIds.includes(id),
      reset: () => set({ savedRepositoryIds: [], savedIssueIds: [] }),
    }),
    { name: 'issuepilot-saved' }
  )
)
