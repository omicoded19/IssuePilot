import type { Organization } from '@/types/organization'
import type { Repository } from '@/types/repository'
import type {
  RecommendedOrganizationData,
  RecommendedRepositoryData,
} from '@/types/recommendation'

export function mapRecommendedOrganization(
  organization: RecommendedOrganizationData,
): Organization {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    description: organization.description,
    logoInitials: organization.logoInitials,
    logoColor: organization.logoColor,
    matchScore: organization.matchScore,
    technologyMatch: organization.technologyMatch,
    beginnerFriendliness: organization.beginnerFriendliness,
    maintainerActivity: organization.maintainerActivity,
    suitableRepositories: organization.suitableRepositories,
    beginnerFriendlyIssues: organization.beginnerFriendlyIssues,
    averageResponseTime: organization.averageResponseTime,
    matchReason: organization.matchReason,
    languages: organization.languages,
    frameworks: organization.frameworks,
    difficulty: organization.difficulty,
    organizationSize: organization.organizationSize,
    website: organization.website,
    repositoryIds: organization.repositoryIds,
    recommendationSource: 'real',
  }
}

export function mapRecommendedRepository(
  repository: RecommendedRepositoryData,
): Repository {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.fullName,
    organization: repository.organization,
    organizationId: repository.organizationSlug,
    description: repository.description,
    matchScore: repository.matchScore,
    stars: repository.stars,
    forks: repository.forks,
    primaryLanguage: repository.primaryLanguage,
    technologies: repository.technologies,
    difficulty: repository.difficulty,
    suitableIssueCount: repository.suitableIssueCount,
    recentActivity: repository.recentActivity,
    documentationQuality: repository.documentationQuality,
    setupComplexity: repository.setupComplexity,
    matchReason: repository.matchReason,
    lastUpdated: repository.lastUpdated,
    githubUrl: repository.githubUrl,
    openIssues: repository.openIssues,
    contributors: 0,
    recommendationSource: 'real',
    scoreBreakdown: repository.scoreBreakdown,
    matchReasons: repository.whyMatched,
    gaps: repository.gaps,
  }
}
