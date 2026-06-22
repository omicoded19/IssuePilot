import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockUserProfile } from '@/data/user'
import type {
  AvailabilityPreferences,
  ContributionPreference,
  UserProfile,
} from '@/types/user'

interface UserState {
  profile: UserProfile
  onboardingComplete: boolean
  contributionPreferences: ContributionPreference[]
  availability: AvailabilityPreferences
  connectGitHub: () => void
  disconnectGitHub: () => void
  setContributionPreferences: (prefs: ContributionPreference[]) => void
  setAvailability: (availability: Partial<AvailabilityPreferences>) => void
  finishOnboarding: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: mockUserProfile,
      onboardingComplete: false,
      contributionPreferences: ['Frontend', 'Bug fixes', 'Features'],
      availability: {
        hoursPerWeek: 10,
        difficulty: 'Intermediate',
        repositorySize: 'Medium',
        organizationType: 'Community',
      },
      connectGitHub: () =>
        set((state) => ({
          profile: { ...state.profile, githubConnected: true },
        })),
      disconnectGitHub: () =>
        set((state) => ({
          profile: { ...state.profile, githubConnected: false },
        })),
      setContributionPreferences: (prefs) => set({ contributionPreferences: prefs }),
      setAvailability: (availability) =>
        set((state) => ({
          availability: { ...state.availability, ...availability },
        })),
      finishOnboarding: () => set({ onboardingComplete: true }),
    }),
    { name: 'issuepilot-user' }
  )
)
