import { useAnalyticsStore } from '@/store/analyticsStore'
import { useDeveloperProfileStore } from '@/store/developerProfileStore'
import { useIssueIntelligenceStore } from '@/store/issueIntelligenceStore'
import { usePerformanceStore } from '@/store/performanceStore'
import { useProgressStore } from '@/store/progressStore'
import { usePullRequestStore } from '@/store/pullRequestStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useRepositoryAnalysisStore } from '@/store/repositoryAnalysisStore'
import { useSavedStore } from '@/store/savedStore'
import { useSkillsStore } from '@/store/skillsStore'
import { useUserStore } from '@/store/userStore'

export function clearUserSessionData(): void {
  useAnalyticsStore.getState().clear()
  usePerformanceStore.getState().clear()
  usePullRequestStore.getState().clear()
  useRepositoryAnalysisStore.getState().reset()
  useDeveloperProfileStore.getState().reset()
  useRecommendationStore.getState().reset()
  useIssueIntelligenceStore.getState().reset()
  useProgressStore.getState().reset()
  useSavedStore.getState().reset()
  useSkillsStore.getState().resetSkills()
  useUserStore.getState().reset()

  useDeveloperProfileStore.persist.clearStorage()
  useRecommendationStore.persist.clearStorage()
  useIssueIntelligenceStore.persist.clearStorage()
  useProgressStore.persist.clearStorage()
  useSavedStore.persist.clearStorage()
  useSkillsStore.persist.clearStorage()
  useUserStore.persist.clearStorage()
}
