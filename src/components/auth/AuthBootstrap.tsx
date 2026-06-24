import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clearUserSessionData } from '@/lib/clear-user-session'
import { ApiClientError } from '@/services/api-client'
import {
  getMyContributionProfile,
  saveMyContributionProfile,
} from '@/services/contribution-profile-api'
import { getDeveloperProfileAnalysis } from '@/services/developer-profile-api'
import { useAuthStore } from '@/store/authStore'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'

interface AuthBootstrapProps {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const status = useAuthStore((state) => state.status)
  const authUser = useAuthStore((state) => state.user)
  const setProfileFromGitHub = useUserStore((state) => state.setProfileFromGitHub)
  const setContributionPreferences = useUserStore((state) => state.setContributionPreferences)
  const setAvailability = useUserStore((state) => state.setAvailability)
  const setOnboardingComplete = useUserStore((state) => state.setOnboardingComplete)
  const contributionPreferences = useUserStore((state) => state.contributionPreferences)
  const availability = useUserStore((state) => state.availability)
  const onboardingComplete = useUserStore((state) => state.onboardingComplete)
  const skills = useSkillsStore((state) => state.skills)
  const replaceSkills = useSkillsStore((state) => state.replaceSkills)
  const setDetectedSkills = useSkillsStore((state) => state.setDetectedSkills)
  const setAnalysis = useDeveloperProfileStore((state) => state.setAnalysis)
  const setProfileLoading = useDeveloperProfileStore((state) => state.setLoading)
  const resetDeveloperProfile = useDeveloperProfileStore((state) => state.reset)
  const loadLatestRecommendations = useRecommendationStore((state) => state.loadLatest)
  const resetRecommendations = useRecommendationStore((state) => state.reset)
  const [hydratedAuthUserId, setHydratedAuthUserId] = useState<string | null>(null)
  const hydratedUserId = useRef<string | null>(null)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (status !== 'unauthenticated') return
    hydratedUserId.current = null
    clearUserSessionData()
  }, [status])

  useEffect(() => {
    if (!authUser || status !== 'authenticated') return

    setProfileFromGitHub({
      username: authUser.username,
      displayName: authUser.displayName,
      avatarUrl: authUser.avatarUrl,
      githubConnected: true,
      bio: authUser.bio ?? '',
      location: authUser.location ?? '',
      publicRepos: authUser.publicRepos,
      followers: authUser.followers,
      following: authUser.following,
      profileUrl: authUser.profileUrl,
      company: authUser.company,
    })

    if (hydratedUserId.current === authUser.id) return
    hydratedUserId.current = authUser.id

    const hydrate = async () => {
      try {
        const savedContributionProfile = await getMyContributionProfile()
        if (savedContributionProfile) {
          replaceSkills(savedContributionProfile.skills.map((skill) => ({
            id: crypto.randomUUID(),
            ...skill,
          })))
          setContributionPreferences(savedContributionProfile.contributionPreferences)
          setAvailability(savedContributionProfile.availability)
          setOnboardingComplete(savedContributionProfile.onboardingComplete)
        }

        try {
          setProfileLoading()
          const analysis = await getDeveloperProfileAnalysis(authUser.username)
          setAnalysis(analysis)
          if (!savedContributionProfile?.skills.length) {
            setDetectedSkills(
              analysis.technologies.slice(0, 16).map((technology) => ({
                name: technology.name,
                proficiency: technology.suggestedProficiency,
              })),
            )
          }
          if (!savedContributionProfile) setOnboardingComplete(true)
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 404) {
            resetDeveloperProfile()
          } else {
            throw error
          }
        }

        try {
          await loadLatestRecommendations(authUser.username)
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 404) {
            resetRecommendations()
          } else {
            console.warn('Could not restore saved recommendations.', error)
          }
        }
      } catch (error) {
        console.warn('Could not restore the saved contribution profile.', error)
      } finally {
        setHydratedAuthUserId(authUser.id)
      }
    }

    void hydrate()
  }, [
    authUser,
    loadLatestRecommendations,
    replaceSkills,
    resetRecommendations,
    resetDeveloperProfile,
    setAnalysis,
    setAvailability,
    setContributionPreferences,
    setDetectedSkills,
    setOnboardingComplete,
    setProfileLoading,
    setProfileFromGitHub,
    status,
  ])

  useEffect(() => {
    if (hydratedAuthUserId !== authUser?.id || status !== 'authenticated' || !authUser) return

    const timeout = window.setTimeout(() => {
      void saveMyContributionProfile({
        skills: skills.map(({ name, proficiency, wantToLearn }) => ({
          name,
          proficiency,
          wantToLearn,
        })),
        contributionPreferences,
        availability,
        onboardingComplete,
      }).catch((error) => {
        console.warn('Could not save contribution profile changes.', error)
      })
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [
    authUser,
    availability,
    contributionPreferences,
    onboardingComplete,
    hydratedAuthUserId,
    skills,
    status,
  ])

  return children
}
