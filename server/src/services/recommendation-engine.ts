import type { GitHubIssueResponse } from '../types/github.js'
import type {
  RecommendationAvailabilityInput,
  RecommendationDraft,
  RecommendationRequest,
  RecommendationScoreBreakdown,
  RecommendationSkillInput,
  RecommendedOrganization,
  RecommendedRepository,
  RecommendationRepositorySize,
} from '../types/recommendation.js'
import type { RecommendationCatalogItem } from '../data/recommendation-catalog.js'
import type { RecommendationRepositoryBundle } from './github-service.js'

const beginnerLabels = new Set([
  'good first issue',
  'help wanted',
  'beginner',
  'starter',
  'easy',
  'first issue',
  'documentation',
])

const technologyAliases: Record<string, string> = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  reactjs: 'react',
  react: 'react',
  'node.js': 'nodejs',
  node: 'nodejs',
  nodejs: 'nodejs',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  tailwind: 'tailwindcss',
  'tailwind css': 'tailwindcss',
  tailwindcss: 'tailwindcss',
  vuejs: 'vue',
  vue: 'vue',
  sveltekit: 'svelte',
  svelte: 'svelte',
}

const proficiencyWeights = {
  Beginner: 0.55,
  Intermediate: 0.78,
  Advanced: 1,
} as const

function normalizeTechnology(value: string): string {
  const simplified = value.trim().toLowerCase().replace(/[^a-z0-9.+#]/g, '')
  return technologyAliases[simplified] ?? simplified
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function daysSince(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 86_400_000))
}

function activityScore(pushedAt: string | null): number {
  const days = daysSince(pushedAt)
  if (days <= 7) return 100
  if (days <= 30) return 92
  if (days <= 90) return 78
  if (days <= 180) return 62
  if (days <= 365) return 45
  return 22
}

function formatRecentActivity(pushedAt: string | null): string {
  const days = daysSince(pushedAt)
  if (!Number.isFinite(days)) return 'Last push not available'
  if (days === 0) return 'Pushed today'
  if (days === 1) return 'Pushed yesterday'
  if (days < 30) return `Pushed ${days} days ago`
  const months = Math.max(1, Math.round(days / 30))
  if (months < 12) return `Pushed ${months} months ago`
  return `Pushed ${Math.max(1, Math.round(months / 12))} years ago`
}

function repositorySize(sizeInKb: number): RecommendationRepositorySize {
  if (sizeInKb < 50_000) return 'Small'
  if (sizeInKb < 300_000) return 'Medium'
  return 'Large'
}

function categoricalMatch<T extends string>(preferred: T, actual: T): number {
  return preferred === actual ? 100 : 45
}

function difficultyMatch(
  preferred: RecommendationAvailabilityInput['difficulty'],
  actual: RecommendationCatalogItem['difficulty'],
): number {
  const order = ['Beginner', 'Intermediate', 'Advanced'] as const
  const distance = Math.abs(order.indexOf(preferred) - order.indexOf(actual))
  if (distance === 0) return 100
  if (distance === 1) return 65
  return 25
}

function issueLabelNames(issue: GitHubIssueResponse): string[] {
  return issue.labels
    .map((label) => (typeof label === 'string' ? label : label.name ?? ''))
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean)
}

function suitableIssues(issues: GitHubIssueResponse[]): GitHubIssueResponse[] {
  return issues.filter((issue) => {
    if (issue.pull_request) return false
    return issueLabelNames(issue).some((label) => beginnerLabels.has(label))
  })
}

function hasRootFile(rootContents: RecommendationRepositoryBundle['rootContents'], candidates: string[]): boolean {
  const names = new Set(rootContents.map((entry) => entry.name.toLowerCase()))
  return candidates.some((candidate) => names.has(candidate.toLowerCase()))
}

function documentationQuality(bundle: RecommendationRepositoryBundle): number {
  let score = 20
  if (hasRootFile(bundle.rootContents, ['README.md', 'README', 'README.rst'])) score += 40
  if (hasRootFile(bundle.rootContents, ['CONTRIBUTING.md', 'CONTRIBUTING'])) score += 25
  if (hasRootFile(bundle.rootContents, ['CODE_OF_CONDUCT.md'])) score += 10
  if (hasRootFile(bundle.rootContents, ['SECURITY.md'])) score += 5
  return clampScore(score)
}

function skillMatch(
  skills: RecommendationSkillInput[],
  technologies: string[],
): { score: number; matched: string[]; learningMatches: string[]; gaps: string[] } {
  const skillMap = new Map(
    skills.map((skill) => [normalizeTechnology(skill.name), skill]),
  )
  const matched: string[] = []
  const learningMatches: string[] = []
  const gaps: string[] = []
  let earned = 0

  for (const technology of technologies) {
    const skill = skillMap.get(normalizeTechnology(technology))
    if (!skill) {
      gaps.push(technology)
      continue
    }

    if (skill.wantToLearn) {
      learningMatches.push(technology)
      earned += 0.4
    } else {
      matched.push(technology)
      earned += proficiencyWeights[skill.proficiency]
    }
  }

  const denominator = Math.max(technologies.length, 1)
  return {
    score: clampScore((earned / denominator) * 100),
    matched,
    learningMatches,
    gaps,
  }
}

function preferenceMatch(
  requested: string[],
  candidateAreas: string[],
): { score: number; matches: string[] } {
  if (requested.length === 0) return { score: 60, matches: [] }
  const requestedSet = new Set(requested.map((item) => item.toLowerCase()))
  const matches = candidateAreas.filter((area) => requestedSet.has(area.toLowerCase()))
  return {
    score: clampScore((matches.length / requested.length) * 100),
    matches,
  }
}

export function scoreRecommendationCandidate(
  request: RecommendationRequest,
  catalog: RecommendationCatalogItem,
  bundle: RecommendationRepositoryBundle,
): RecommendedRepository {
  const skills = skillMatch(request.skills, catalog.technologies)
  const preferences = preferenceMatch(
    request.contributionPreferences,
    catalog.contributionAreas,
  )
  const size = repositorySize(bundle.repository.size)
  const beginnerIssues = suitableIssues(bundle.issues)
  const docs = documentationQuality(bundle)
  const beginnerOpportunity = clampScore(
    beginnerIssues.length * 12 + docs * 0.35 + (catalog.difficulty === 'Beginner' ? 20 : 5),
  )

  const scoreBreakdown: RecommendationScoreBreakdown = {
    technologyMatch: skills.score,
    contributionPreferenceMatch: preferences.score,
    difficultyMatch: difficultyMatch(request.availability.difficulty, catalog.difficulty),
    repositorySizeMatch: categoricalMatch(request.availability.repositorySize, size),
    organizationTypeMatch: categoricalMatch(
      request.availability.organizationType,
      catalog.organizationType,
    ),
    repositoryActivity: activityScore(bundle.repository.pushed_at),
    beginnerOpportunity,
  }

  const matchScore = clampScore(
    scoreBreakdown.technologyMatch * 0.4 +
      scoreBreakdown.contributionPreferenceMatch * 0.15 +
      scoreBreakdown.difficultyMatch * 0.1 +
      scoreBreakdown.repositorySizeMatch * 0.08 +
      scoreBreakdown.organizationTypeMatch * 0.07 +
      scoreBreakdown.repositoryActivity * 0.1 +
      scoreBreakdown.beginnerOpportunity * 0.1,
  )

  const whyMatched: string[] = []
  if (skills.matched.length > 0) {
    whyMatched.push(`Matches your ${skills.matched.slice(0, 4).join(', ')} experience.`)
  }
  if (skills.learningMatches.length > 0) {
    whyMatched.push(`Supports technologies you want to learn: ${skills.learningMatches.join(', ')}.`)
  }
  if (preferences.matches.length > 0) {
    whyMatched.push(`Offers ${preferences.matches.slice(0, 3).join(', ')} contribution work.`)
  }
  if (beginnerIssues.length > 0) {
    whyMatched.push(`${beginnerIssues.length} currently open beginner-oriented issues were detected.`)
  }
  if (scoreBreakdown.repositoryActivity >= 78) {
    whyMatched.push('The repository has recent development activity.')
  }

  const gaps = skills.gaps.slice(0, 4).map((technology) => `Limited evidence for ${technology}`)
  if (catalog.setupComplexity === 'High') gaps.push('Local setup is expected to be relatively complex')
  if (beginnerIssues.length === 0) gaps.push('No currently open beginner-labeled issue was detected')

  const primaryReason = whyMatched[0]
    ?? `The repository scored ${matchScore}% against your selected contribution profile.`

  return {
    id: `${catalog.owner}--${catalog.repository}`,
    owner: catalog.owner,
    name: catalog.repository,
    fullName: bundle.repository.full_name,
    organization: catalog.organizationName,
    organizationSlug: catalog.owner.toLowerCase(),
    description: bundle.repository.description ?? catalog.organizationDescription,
    githubUrl: bundle.repository.html_url,
    matchScore,
    scoreBreakdown,
    stars: bundle.repository.stargazers_count,
    forks: bundle.repository.forks_count,
    primaryLanguage: bundle.repository.language ?? 'Not detected',
    technologies: catalog.technologies,
    difficulty: catalog.difficulty,
    repositorySize: size,
    suitableIssueCount: beginnerIssues.length,
    openIssues: bundle.repository.open_issues_count,
    recentActivity: formatRecentActivity(bundle.repository.pushed_at),
    documentationQuality: docs,
    setupComplexity: catalog.setupComplexity,
    matchReason: primaryReason,
    whyMatched,
    gaps,
    lastUpdated: bundle.repository.updated_at,
    topics: bundle.repository.topics ?? [],
    dataSource: 'GitHub REST API + deterministic scoring',
  }
}

function organizationDifficulty(repositories: RecommendedRepository[]): RecommendedOrganization['difficulty'] {
  const order: RecommendedOrganization['difficulty'][] = ['Beginner', 'Intermediate', 'Advanced']
  const average = repositories.reduce((sum, repository) => sum + order.indexOf(repository.difficulty), 0) / Math.max(repositories.length, 1)
  return order[Math.round(average)] ?? 'Intermediate'
}

export function groupOrganizationRecommendations(
  repositories: RecommendedRepository[],
  catalog: RecommendationCatalogItem[],
): RecommendedOrganization[] {
  const byOrganization = new Map<string, RecommendedRepository[]>()
  for (const repository of repositories) {
    const current = byOrganization.get(repository.organizationSlug) ?? []
    current.push(repository)
    byOrganization.set(repository.organizationSlug, current)
  }

  return [...byOrganization.entries()]
    .map(([slug, organizationRepositories]) => {
      const item = catalog.find((candidate) => candidate.owner.toLowerCase() === slug)
      if (!item) return null
      const average = (selector: (repository: RecommendedRepository) => number) =>
        clampScore(
          organizationRepositories.reduce((sum, repository) => sum + selector(repository), 0) /
            Math.max(organizationRepositories.length, 1),
        )
      const languages = [...new Set(organizationRepositories.map((repository) => repository.primaryLanguage).filter((language) => language !== 'Not detected'))]
      const frameworks = [...new Set(organizationRepositories.flatMap((repository) => repository.technologies))]
      const top = [...organizationRepositories].sort((a, b) => b.matchScore - a.matchScore)[0]
      if (!top) return null

      return {
        id: slug,
        name: item.organizationName,
        slug,
        description: item.organizationDescription,
        website: item.organizationWebsite,
        logoInitials: item.organizationName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        logoColor: item.organizationColor,
        matchScore: average((repository) => repository.matchScore),
        technologyMatch: average((repository) => repository.scoreBreakdown.technologyMatch),
        beginnerFriendliness: average((repository) => repository.scoreBreakdown.beginnerOpportunity),
        maintainerActivity: average((repository) => repository.scoreBreakdown.repositoryActivity),
        suitableRepositories: organizationRepositories.filter((repository) => repository.matchScore >= 55).length,
        beginnerFriendlyIssues: organizationRepositories.reduce((sum, repository) => sum + repository.suitableIssueCount, 0),
        averageResponseTime: 'Not measured',
        matchReason: top.matchReason,
        languages: languages.slice(0, 4),
        frameworks: frameworks.slice(0, 5),
        difficulty: organizationDifficulty(organizationRepositories),
        organizationSize: item.organizationType === 'Enterprise' || item.organizationType === 'Foundation' ? 'Large' : item.organizationType === 'Community' ? 'Small' : 'Medium',
        repositoryIds: organizationRepositories.map((repository) => repository.id),
        dataSource: 'GitHub REST API + deterministic scoring' as const,
      }
    })
    .filter((organization): organization is RecommendedOrganization => organization !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function createRecommendationDraft(
  request: RecommendationRequest,
  repositories: RecommendedRepository[],
  catalog: RecommendationCatalogItem[],
): RecommendationDraft {
  const sortedRepositories = [...repositories]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12)
  const organizations = groupOrganizationRecommendations(sortedRepositories, catalog).slice(0, 10)

  return {
    username: request.username.toLowerCase(),
    repositories: sortedRepositories,
    organizations,
    metadata: {
      generatedAt: new Date().toISOString(),
      candidateRepositoriesChecked: catalog.length,
      repositoriesReturned: sortedRepositories.length,
      organizationsReturned: organizations.length,
      scoringVersion: 'rules-v1',
      notes: [
        'Repository metadata and issue counts come from the GitHub REST API.',
        'Match scores are deterministic weighted rules, not AI predictions.',
        'Recommendations are generated from a curated open-source candidate catalog.',
      ],
    },
  }
}
