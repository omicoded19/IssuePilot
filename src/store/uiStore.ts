import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'grid' | 'list'

interface UIState {
  repoViewMode: ViewMode
  sidebarCollapsed: boolean
  setRepoViewMode: (mode: ViewMode) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      repoViewMode: 'grid',
      sidebarCollapsed: false,
      setRepoViewMode: (mode) => set({ repoViewMode: mode }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'issuepilot-ui' }
  )
)
