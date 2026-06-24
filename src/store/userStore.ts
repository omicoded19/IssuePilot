import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AvailabilityPreferences,
  ContributionPreference,
  UserProfile,
} from '@/types/user'

const emptyProfile: UserProfile = {
  username: '',
  displayName: '',
  avatarUrl: '',
  githubConnected: false,
  bio: '',
  location: '',
  publicRepos: 0,
  followers: 0,
  following: 0,
  profileUrl: '',
  company: null,
}

const defaultContributionPreferences: ContributionPreference[] = [
  'Frontend',
  'Bug fixes',
  'Features',
]

const defaultAvailability: AvailabilityPreferences = {
  hoursPerWeek: 10,
  difficulty: 'Intermediate',
  repositorySize: 'Medium',
  organizationType: 'Community',
}

interface UserState {
  profile: UserProfile
  onboardingComplete: boolean
  contributionPreferences: ContributionPreference[]
  availability: AvailabilityPreferences
  connectGitHub: () => void
  setProfileFromGitHub: (profile: UserProfile) => void
  disconnectGitHub: () => void
  setContributionPreferences: (prefs: ContributionPreference[]) => void
  setAvailability: (availability: Partial<AvailabilityPreferences>) => void
  finishOnboarding: () => void
  reset: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: emptyProfile,
      onboardingComplete: false,
      contributionPreferences: defaultContributionPreferences,
      availability: defaultAvailability,
      connectGitHub: () =>
        set((state) => ({
          profile: { ...state.profile, githubConnected: true },
        })),
      setProfileFromGitHub: (profile) => set({ profile }),
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
      reset: () =>
        set({
          profile: emptyProfile,
          onboardingComplete: false,
          contributionPreferences: defaultContributionPreferences,
          availability: defaultAvailability,
        }),
    }),
    { name: 'issuepilot-user' },
  ),
)
