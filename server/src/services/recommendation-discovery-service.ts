import type { RecommendationCatalogItem } from '../data/recommendation-catalog.js'
import type { GitHubRepositoryResponse } from '../types/github.js'
import type { RecommendationRequest } from '../types/recommendation.js'
import { searchPublicRepositories } from './github-service.js'

const languageAliases: Record<string, string> = {
  'c++': 'C++',
  'c#': 'C#',
  css: 'CSS',
  dart: 'Dart',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  kotlin: 'Kotlin',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  scala: 'Scala',
  swift: 'Swift',
  typescript: 'TypeScript',
}

const topicDisplayNames: Record<string, string> = {
  react: 'React',
  'react-native': 'React Native',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
  nodejs: 'Node.js',
  node: 'Node.js',
  nextjs: 'Next.js',
  'next-js': 'Next.js',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  redis: 'Redis',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  flutter: 'Flutter',
  figma: 'Figma',
  firebase: 'Firebase',
  graphql: 'GraphQL',
  tailwindcss: 'Tailwind CSS',
}

const preferenceSearchTerms: Record<string, string> = {
  Frontend: 'frontend',
  Backend: 'backend',
  'Full stack': 'fullstack',
  Documentation: 'documentation',
  Testing: 'testing',
  'Bug fixes': 'bug',
  Features: 'feature',
  'UI improvements': 'ui',
  Accessibility: 'accessibility',
  Performance: 'performance',
  'Developer tools': 'developer-tools',
  'API/SDK': 'sdk',
  'Data/Database': 'database',
  'DevOps/CI': 'devops',
  Mobile: 'mobile',
  Security: 'security',
  CLI: 'cli',
  Localization: 'localization',
  'Curriculum/Education': 'education',
  Refactoring: 'refactoring',
}

function dateMonthsAgo(months: number): string {
  const date = new Date()
  date.setUTCMonth(date.getUTCMonth() - months)
  return date.toISOString().slice(0, 10)
}

function normalized(value: string): string {
  return value.trim().toLowerCase()
}

function repositorySearchQueries(request: RecommendationRequest): string[] {
  const known = request.skills
    .filter((skill) => !skill.wantToLearn)
    .sort((left, right) => {
      const weight = { Advanced: 3, Intermediate: 2, Beginner: 1 } as const
      return weight[right.proficiency] - weight[left.proficiency]
    })
  const learning = request.skills.filter((skill) => skill.wantToLearn)
  const terms = [...known.slice(0, 3), ...learning.slice(0, 1)]
  const pushedAfter = dateMonthsAgo(9)

  const queries = terms.map((skill) => {
    const language = languageAliases[normalized(skill.name)]
    const skillQuery = language
      ? `language:${JSON.stringify(language)}`
      : `${JSON.stringify(skill.name)} in:name,description,topics`
    return `${skillQuery} archived:false fork:false pushed:>${pushedAfter} stars:>20`
  })

  const preferenceTerm = request.contributionPreferences
    .map((preference) => preferenceSearchTerms[preference])
    .find(Boolean)
  if (preferenceTerm) {
    queries.push(
      `${JSON.stringify(preferenceTerm)} in:name,description,topics archived:false fork:false pushed:>${pushedAfter} stars:>20`,
    )
  }

  if (queries.length === 0) {
    queries.push(`open-source in:description archived:false fork:false pushed:>${pushedAfter} stars:>50`)
  }

  return [...new Set(queries)].slice(0, 4)
}

function inferredTechnologies(
  repository: GitHubRepositoryResponse,
  request: RecommendationRequest,
): string[] {
  const searchText = [
    repository.name,
    repository.description ?? '',
    ...(repository.topics ?? []),
  ].join(' ').toLowerCase()

  const technologies = new Set<string>()
  if (repository.language) technologies.add(repository.language)

  for (const topic of repository.topics ?? []) {
    const display = topicDisplayNames[topic.toLowerCase()]
    if (display) technologies.add(display)
  }

  for (const skill of request.skills) {
    if (searchText.includes(skill.name.toLowerCase())) technologies.add(skill.name)
  }

  return [...technologies].slice(0, 8)
}

function inferContributionAreas(
  repository: GitHubRepositoryResponse,
  technologies: string[],
): string[] {
  const text = [
    repository.name,
    repository.description ?? '',
    ...(repository.topics ?? []),
    ...technologies,
  ].join(' ').toLowerCase()
  const areas = new Set<string>(['Bug fixes', 'Features'])

  if (/react|vue|svelte|angular|frontend|ui|css|tailwind/.test(text)) {
    areas.add('Frontend')
    areas.add('UI improvements')
  }
  if (/node|python|go|rust|java|backend|server|api/.test(text)) areas.add('Backend')
  if (areas.has('Frontend') && areas.has('Backend')) areas.add('Full stack')
  if (/docs|documentation|markdown/.test(text)) areas.add('Documentation')
  if (/test|testing|jest|vitest|cypress|playwright/.test(text)) areas.add('Testing')
  if (/accessibility|a11y/.test(text)) areas.add('Accessibility')
  if (/performance|benchmark|speed/.test(text)) areas.add('Performance')
  if (/sdk|api|client-library/.test(text)) areas.add('API/SDK')
  if (/cli|command-line/.test(text)) areas.add('CLI')
  if (/docker|kubernetes|devops|ci-cd|github-actions/.test(text)) areas.add('DevOps/CI')
  if (/mobile|android|ios|flutter|react-native/.test(text)) areas.add('Mobile')
  if (/security|authentication|authorization|oauth/.test(text)) areas.add('Security')
  if (/database|postgres|mysql|mongodb|redis|data/.test(text)) areas.add('Data/Database')
  if (/education|learning|curriculum|tutorial/.test(text)) areas.add('Curriculum/Education')
  if (/localization|internationalization|i18n|l10n/.test(text)) areas.add('Localization')
  if (/developer-tools|devtools|tooling|library|framework/.test(text)) areas.add('Developer tools')

  return [...areas]
}

function setupComplexity(sizeInKb: number): RecommendationCatalogItem['setupComplexity'] {
  if (sizeInKb < 50_000) return 'Low'
  if (sizeInKb < 300_000) return 'Medium'
  return 'High'
}

function toCatalogItem(
  repository: GitHubRepositoryResponse,
  request: RecommendationRequest,
): RecommendationCatalogItem {
  const technologies = inferredTechnologies(repository, request)
  const complexity = setupComplexity(repository.size)

  return {
    owner: repository.owner.login,
    repository: repository.name,
    organizationName: repository.owner.login,
    organizationDescription:
      repository.description ?? `Open-source repositories maintained by ${repository.owner.login}.`,
    organizationWebsite: repository.homepage || `https://github.com/${repository.owner.login}`,
    organizationType: 'Community',
    organizationColor: '#22c55e',
    technologies,
    contributionAreas: inferContributionAreas(repository, technologies),
    difficulty: complexity === 'Low' ? 'Beginner' : complexity === 'High' ? 'Advanced' : 'Intermediate',
    setupComplexity: complexity,
  }
}

export async function discoverRecommendationCatalog(
  request: RecommendationRequest,
  limit = 18,
): Promise<RecommendationCatalogItem[]> {
  const queries = repositorySearchQueries(request)
  const discovered = new Map<string, GitHubRepositoryResponse>()

  const results = await Promise.allSettled(
    queries.map((query) => searchPublicRepositories(query, 10)),
  )

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const repository of result.value) {
      const key = repository.full_name.toLowerCase()
      if (!discovered.has(key)) discovered.set(key, repository)
      if (discovered.size >= limit) break
    }
    if (discovered.size >= limit) break
  }

  return [...discovered.values()]
    .slice(0, limit)
    .map((repository) => toCatalogItem(repository, request))
}
