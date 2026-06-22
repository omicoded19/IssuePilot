import type { GitHubDeveloperBundle } from './github-service.js'
import type {
  DeveloperLanguageSignal,
  DeveloperProfileDraft,
  DeveloperTechnologySignal,
  SuggestedProficiency,
} from '../types/developer-profile.js'
import type { Confidence } from '../types/repository.js'

interface PackageManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface TechnologyAccumulator {
  name: string
  category: string
  repositories: Set<string>
  evidence: Set<string>
  score: number
}

const dependencyTechnologyMap: Record<string, { name: string; category: string }> = {
  react: { name: 'React', category: 'frontend' },
  'react-dom': { name: 'React', category: 'frontend' },
  next: { name: 'Next.js', category: 'full-stack' },
  express: { name: 'Express', category: 'backend' },
  '@nestjs/core': { name: 'NestJS', category: 'backend' },
  vite: { name: 'Vite', category: 'build-tool' },
  tailwindcss: { name: 'Tailwind CSS', category: 'styling' },
  jest: { name: 'Jest', category: 'testing' },
  vitest: { name: 'Vitest', category: 'testing' },
  eslint: { name: 'ESLint', category: 'quality' },
  prisma: { name: 'Prisma', category: 'database' },
  '@prisma/client': { name: 'Prisma', category: 'database' },
  mongoose: { name: 'MongoDB', category: 'database' },
  mongodb: { name: 'MongoDB', category: 'database' },
  pg: { name: 'PostgreSQL', category: 'database' },
  redis: { name: 'Redis', category: 'cache' },
  ioredis: { name: 'Redis', category: 'cache' },
  fastapi: { name: 'FastAPI', category: 'backend' },
  django: { name: 'Django', category: 'backend' },
  flask: { name: 'Flask', category: 'backend' },
  zustand: { name: 'Zustand', category: 'state-management' },
  '@tanstack/react-query': { name: 'TanStack Query', category: 'data-fetching' },
  '@xyflow/react': { name: 'React Flow', category: 'visualization' },
  recharts: { name: 'Recharts', category: 'visualization' },
}

function parseManifest(content: string | null): PackageManifest | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as PackageManifest
  } catch {
    return null
  }
}

function addTechnology(
  technologies: Map<string, TechnologyAccumulator>,
  name: string,
  category: string,
  repository: string,
  evidence: string,
  score: number,
): void {
  const existing = technologies.get(name) ?? {
    name,
    category,
    repositories: new Set<string>(),
    evidence: new Set<string>(),
    score: 0,
  }
  existing.repositories.add(repository)
  existing.evidence.add(evidence)
  existing.score += score
  technologies.set(name, existing)
}

function suggestedProficiency(repositoryCount: number, score: number): SuggestedProficiency {
  if (repositoryCount >= 5 && score >= 18) return 'Advanced'
  if (repositoryCount >= 2 || score >= 7) return 'Intermediate'
  return 'Beginner'
}

function confidence(repositoryCount: number, evidenceCount: number): Confidence {
  if (repositoryCount >= 3 || evidenceCount >= 4) return 'high'
  if (repositoryCount >= 2 || evidenceCount >= 2) return 'medium'
  return 'low'
}

function buildLanguageSignals(bundle: GitHubDeveloperBundle): DeveloperLanguageSignal[] {
  const aggregate = new Map<
    string,
    { bytes: number; repositories: Set<string> }
  >()

  for (const item of bundle.repositories) {
    for (const [language, bytes] of Object.entries(item.languages)) {
      const current = aggregate.get(language) ?? {
        bytes: 0,
        repositories: new Set<string>(),
      }
      current.bytes += bytes
      current.repositories.add(item.repository.full_name)
      aggregate.set(language, current)
    }
  }

  const totalBytes = [...aggregate.values()].reduce((sum, item) => sum + item.bytes, 0)
  if (totalBytes === 0) return []

  return [...aggregate.entries()]
    .map(([name, value]) => ({
      name,
      bytes: value.bytes,
      percentage: Number(((value.bytes / totalBytes) * 100).toFixed(2)),
      repositoryCount: value.repositories.size,
      repositories: [...value.repositories].sort(),
    }))
    .sort((a, b) => b.bytes - a.bytes)
}

function buildTechnologySignals(bundle: GitHubDeveloperBundle): DeveloperTechnologySignal[] {
  const technologies = new Map<string, TechnologyAccumulator>()

  for (const item of bundle.repositories) {
    const repositoryName = item.repository.full_name

    for (const [language, bytes] of Object.entries(item.languages)) {
      if (bytes <= 0) continue
      addTechnology(
        technologies,
        language,
        'language',
        repositoryName,
        `${language} code detected in ${repositoryName}`,
        2,
      )
    }

    const manifest = parseManifest(item.packageManifest?.content ?? null)
    if (!manifest) continue

    addTechnology(
      technologies,
      'Node.js',
      'runtime',
      repositoryName,
      `package.json found in ${repositoryName}`,
      2,
    )

    const dependencies = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
    }

    for (const dependency of Object.keys(dependencies)) {
      const mapped = dependencyTechnologyMap[dependency.toLowerCase()]
      if (!mapped) continue
      addTechnology(
        technologies,
        mapped.name,
        mapped.category,
        repositoryName,
        `${dependency} found in ${repositoryName}/package.json`,
        3,
      )
    }
  }

  return [...technologies.values()]
    .map((technology) => ({
      name: technology.name,
      category: technology.category,
      repositoryCount: technology.repositories.size,
      repositories: [...technology.repositories].sort(),
      evidence: [...technology.evidence].slice(0, 8),
      confidence: confidence(technology.repositories.size, technology.evidence.size),
      suggestedProficiency: suggestedProficiency(
        technology.repositories.size,
        technology.score,
      ),
    }))
    .sort(
      (a, b) =>
        b.repositoryCount - a.repositoryCount || a.name.localeCompare(b.name),
    )
}

export function analyseDeveloperBundle(bundle: GitHubDeveloperBundle): DeveloperProfileDraft {
  const repositories = bundle.repositories.map((item) => ({
    githubRepositoryId: String(item.repository.id),
    name: item.repository.name,
    fullName: item.repository.full_name,
    description: item.repository.description,
    githubUrl: item.repository.html_url,
    primaryLanguage: item.repository.language,
    stars: item.repository.stargazers_count,
    forks: item.repository.forks_count,
    topics: item.repository.topics ?? [],
    pushedAt: item.repository.pushed_at,
    packageManifestFound: Boolean(item.packageManifest),
  }))

  const notes: string[] = [
    'Suggested proficiency is inferred from public repository evidence and remains editable.',
    'Forked and archived repositories are excluded from skill analysis.',
  ]
  if (bundle.totalPublicRepositories > bundle.repositories.length) {
    notes.push(
      `Analysed the ${bundle.repositories.length} strongest recent repositories out of ${bundle.totalPublicRepositories} public repositories to control GitHub API usage.`,
    )
  }

  return {
    profile: {
      githubUserId: String(bundle.user.id),
      username: bundle.user.login,
      displayName: bundle.user.name ?? bundle.user.login,
      avatarUrl: bundle.user.avatar_url,
      profileUrl: bundle.user.html_url,
      bio: bundle.user.bio,
      location: bundle.user.location,
      company: bundle.user.company,
      blog: bundle.user.blog || null,
      publicRepos: bundle.user.public_repos,
      followers: bundle.user.followers,
      following: bundle.user.following,
      githubCreatedAt: bundle.user.created_at,
      githubUpdatedAt: bundle.user.updated_at,
    },
    languages: buildLanguageSignals(bundle),
    technologies: buildTechnologySignals(bundle),
    repositories,
    analysisMetadata: {
      analysedAt: new Date().toISOString(),
      repositoriesAnalysed: repositories.length,
      totalPublicRepositories: bundle.totalPublicRepositories,
      source: 'GitHub REST API',
      isAiGenerated: false,
      notes,
    },
  }
}
