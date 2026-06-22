import type { GitHubRepositoryBundle, RetrievedFile } from './github-service.js'
import type {
  AnalysisDraft,
  AnalysisScore,
  ContributionReadiness,
  DetectedTechnology,
  IssueAvailability,
  LanguageBreakdown,
  RepositoryDocument,
  RepositoryDocuments,
  RepositoryMetadata,
  RepositoryScores,
  RepositorySetup,
  SuitableIssue,
} from '../types/repository.js'

interface PackageManifest {
  engines?: { node?: string }
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const preferredIssueLabels = [
  'good first issue',
  'help wanted',
  'beginner',
  'starter',
  'easy',
  'first issue',
  'documentation',
  'bug',
]

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function basename(path: string): string {
  return path.split('/').pop()?.toLowerCase() ?? path.toLowerCase()
}

function findFile(
  files: Map<string, RetrievedFile>,
  predicate: (path: string, name: string) => boolean,
): RetrievedFile | null {
  for (const file of files.values()) {
    if (predicate(file.path.toLowerCase(), basename(file.path))) return file
  }
  return null
}

function previewContent(content: string | null): string | null {
  if (!content) return null
  const normalized = content.replace(/\r/g, '').trim()
  return normalized.length > 1_200 ? `${normalized.slice(0, 1_200)}…` : normalized
}

function toDocument(path: string, file: RetrievedFile | null): RepositoryDocument {
  return {
    path: file?.path ?? path,
    exists: Boolean(file),
    contentPreview: previewContent(file?.content ?? null),
    size: file?.size ?? null,
  }
}

function buildDocuments(files: Map<string, RetrievedFile>): RepositoryDocuments {
  const readme = findFile(files, (_path, name) => name.startsWith('readme'))
  const contributing = findFile(
    files,
    (_path, name) => name === 'contributing' || name === 'contributing.md',
  )
  const codeOfConduct = findFile(files, (_path, name) => name === 'code_of_conduct.md')
  const security = findFile(files, (_path, name) => name === 'security.md')
  const pullRequestTemplate = findFile(files, (_path, name) =>
    name.startsWith('pull_request_template'),
  )
  const packageManifest = findFile(files, (_path, name) => name === 'package.json')

  return {
    readme: toDocument('README.md', readme),
    contributing: toDocument('CONTRIBUTING.md', contributing),
    codeOfConduct: toDocument('CODE_OF_CONDUCT.md', codeOfConduct),
    security: toDocument('SECURITY.md', security),
    pullRequestTemplate: toDocument('.github/PULL_REQUEST_TEMPLATE.md', pullRequestTemplate),
    packageManifest: toDocument('package.json', packageManifest),
  }
}

function parsePackageManifest(files: Map<string, RetrievedFile>): PackageManifest | null {
  const file = findFile(files, (_path, name) => name === 'package.json')
  if (!file?.content) return null

  try {
    const parsed = JSON.parse(file.content) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as PackageManifest
  } catch {
    return null
  }
}

function addTechnology(
  technologies: Map<string, DetectedTechnology>,
  technology: DetectedTechnology,
): void {
  const existing = technologies.get(technology.name)
  const rank = { low: 1, medium: 2, high: 3 }
  if (!existing || rank[technology.confidence] > rank[existing.confidence]) {
    technologies.set(technology.name, technology)
  }
}

const dependencyTechnologyMap: Record<string, { name: string; category: string }> = {
  react: { name: 'React', category: 'frontend' },
  express: { name: 'Express', category: 'backend' },
  next: { name: 'Next.js', category: 'full-stack' },
  vite: { name: 'Vite', category: 'build-tool' },
  tailwindcss: { name: 'Tailwind CSS', category: 'styling' },
  jest: { name: 'Jest', category: 'testing' },
  vitest: { name: 'Vitest', category: 'testing' },
  eslint: { name: 'ESLint', category: 'quality' },
  prisma: { name: 'Prisma', category: 'database' },
  '@prisma/client': { name: 'Prisma', category: 'database' },
  mongoose: { name: 'MongoDB', category: 'database' },
  mongodb: { name: 'MongoDB', category: 'database' },
  redis: { name: 'Redis', category: 'cache' },
  ioredis: { name: 'Redis', category: 'cache' },
  django: { name: 'Django', category: 'backend' },
  flask: { name: 'Flask', category: 'backend' },
  fastapi: { name: 'FastAPI', category: 'backend' },
  '@nestjs/core': { name: 'NestJS', category: 'backend' },
}

function detectTechnologies(
  bundle: GitHubRepositoryBundle,
  manifest: PackageManifest | null,
): DetectedTechnology[] {
  const technologies = new Map<string, DetectedTechnology>()

  for (const language of Object.keys(bundle.languages)) {
    addTechnology(technologies, {
      name: language,
      category: 'language',
      evidence: `${language} code reported by GitHub language analysis`,
      confidence: 'high',
    })
  }

  if (manifest) {
    addTechnology(technologies, {
      name: 'Node.js',
      category: 'runtime',
      evidence: 'package.json exists in the repository root',
      confidence: 'high',
    })

    const dependencies = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
    }

    for (const dependency of Object.keys(dependencies)) {
      const mapped = dependencyTechnologyMap[dependency.toLowerCase()]
      if (!mapped) continue
      addTechnology(technologies, {
        ...mapped,
        evidence: `${dependency} found in package.json`,
        confidence: 'high',
      })
    }
  }

  const rootNames = new Set(bundle.rootContents.map((entry) => entry.name.toLowerCase()))
  const fileEvidence: Array<[boolean, DetectedTechnology]> = [
    [rootNames.has('dockerfile') || rootNames.has('docker-compose.yml') || rootNames.has('compose.yml'), {
      name: 'Docker', category: 'devops', evidence: 'Docker configuration found at repository root', confidence: 'high',
    }],
    [rootNames.has('tsconfig.json'), {
      name: 'TypeScript', category: 'language', evidence: 'tsconfig.json found at repository root', confidence: 'high',
    }],
    [rootNames.has('vite.config.ts') || rootNames.has('vite.config.js'), {
      name: 'Vite', category: 'build-tool', evidence: 'Vite configuration found at repository root', confidence: 'high',
    }],
    [rootNames.has('next.config.js') || rootNames.has('next.config.mjs'), {
      name: 'Next.js', category: 'full-stack', evidence: 'Next.js configuration found at repository root', confidence: 'high',
    }],
    [rootNames.has('requirements.txt') || rootNames.has('pyproject.toml'), {
      name: 'Python', category: 'language', evidence: 'Python dependency manifest found', confidence: 'high',
    }],
    [rootNames.has('go.mod'), {
      name: 'Go', category: 'language', evidence: 'go.mod found at repository root', confidence: 'high',
    }],
    [rootNames.has('cargo.toml'), {
      name: 'Rust', category: 'language', evidence: 'Cargo.toml found at repository root', confidence: 'high',
    }],
  ]

  for (const [condition, technology] of fileEvidence) {
    if (condition) addTechnology(technologies, technology)
  }

  return [...technologies.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function detectPackageManager(rootNames: Set<string>): RepositorySetup['packageManager'] {
  if (rootNames.has('pnpm-lock.yaml')) return 'pnpm'
  if (rootNames.has('yarn.lock')) return 'yarn'
  if (rootNames.has('bun.lockb') || rootNames.has('bun.lock')) return 'bun'
  if (rootNames.has('package-lock.json')) return 'npm'
  return null
}

function commandForScript(
  packageManager: RepositorySetup['packageManager'],
  scripts: Record<string, string>,
  scriptNames: string[],
): string | null {
  const script = scriptNames.find((name) => typeof scripts[name] === 'string')
  if (!script || !packageManager) return null
  if (packageManager === 'npm') return `npm run ${script}`
  return `${packageManager} ${script}`
}

function buildSetup(
  bundle: GitHubRepositoryBundle,
  manifest: PackageManifest | null,
): RepositorySetup {
  const rootNames = new Set(bundle.rootContents.map((entry) => entry.name.toLowerCase()))
  const packageManager = detectPackageManager(rootNames)
  const scripts = manifest?.scripts ?? {}
  const environmentFileNames = bundle.rootContents
    .filter((entry) => entry.type === 'file' && entry.name.toLowerCase().startsWith('.env'))
    .map((entry) => entry.name)

  const confidenceNotes: string[] = []
  if (!packageManager && manifest) {
    confidenceNotes.push('package.json exists, but no supported lock file identifies the package manager.')
  }
  if (!manifest) {
    confidenceNotes.push('No readable package.json was found, so JavaScript setup commands were not inferred.')
  }

  return {
    packageManager,
    nodeVersion: manifest?.engines?.node ?? null,
    installCommand: packageManager ? `${packageManager} install` : null,
    developmentCommand: commandForScript(packageManager, scripts, ['dev', 'serve', 'develop']),
    buildCommand: commandForScript(packageManager, scripts, ['build']),
    testCommand: commandForScript(packageManager, scripts, ['test', 'test:unit']),
    lintCommand: commandForScript(packageManager, scripts, ['lint']),
    formatCommand: commandForScript(packageManager, scripts, ['format', 'format:check']),
    typecheckCommand: commandForScript(packageManager, scripts, ['typecheck', 'type-check', 'check:types']),
    requiresDocker:
      rootNames.has('dockerfile') ||
      rootNames.has('docker-compose.yml') ||
      rootNames.has('compose.yml'),
    hasEnvironmentExample: environmentFileNames.some((name) =>
      ['.env.example', '.env.sample', '.env.template'].includes(name.toLowerCase()),
    ),
    environmentFileNames,
    confidenceNotes,
  }
}

function buildContributionReadiness(
  bundle: GitHubRepositoryBundle,
  documents: RepositoryDocuments,
  manifest: PackageManifest | null,
  setup: RepositorySetup,
): ContributionReadiness {
  const rootNames = new Set(bundle.rootContents.map((entry) => entry.name.toLowerCase()))
  const rootDirectories = new Set(
    bundle.rootContents.filter((entry) => entry.type === 'dir').map((entry) => entry.name.toLowerCase()),
  )
  const scripts = manifest?.scripts ?? {}

  return {
    hasReadme: documents.readme.exists,
    hasContributingGuide: documents.contributing.exists,
    hasCodeOfConduct: documents.codeOfConduct.exists,
    hasSecurityPolicy: documents.security.exists,
    hasIssueTemplates: bundle.hasIssueTemplates,
    hasPullRequestTemplate: documents.pullRequestTemplate.exists,
    hasPackageManifest: documents.packageManifest.exists,
    hasTests:
      rootDirectories.has('test') ||
      rootDirectories.has('tests') ||
      rootDirectories.has('__tests__') ||
      Object.keys(scripts).some((script) => script.startsWith('test')),
    hasLintConfiguration:
      Object.keys(scripts).includes('lint') ||
      [...rootNames].some((name) => name.includes('eslint')),
    hasTypeChecking:
      rootNames.has('tsconfig.json') ||
      Object.keys(scripts).some((script) => script.includes('typecheck') || script.includes('type-check')),
    hasDockerSetup: setup.requiresDocker,
    hasEnvironmentExample: setup.hasEnvironmentExample,
  }
}

function score(
  base: number,
  reasons: string[],
  penalties: string[],
): AnalysisScore {
  return { value: clampScore(base), reasons, penalties }
}

function activityScore(bundle: GitHubRepositoryBundle): AnalysisScore {
  const pushedAt = bundle.repository.pushed_at
  if (!pushedAt) return score(20, [], ['GitHub did not provide a last-pushed timestamp.'])
  if (bundle.repository.archived) return score(0, [], ['Repository is archived.'])

  const ageDays = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86_400_000)
  if (ageDays <= 14) return score(100, ['Code was pushed within the last 14 days.'], [])
  if (ageDays <= 60) return score(85, ['Code was pushed within the last 60 days.'], [])
  if (ageDays <= 180) return score(65, ['Code was pushed within the last six months.'], [])
  if (ageDays <= 365) return score(45, ['Code was pushed within the last year.'], [])
  return score(25, [], ['No code push was detected in the last year.'])
}

function buildScores(
  bundle: GitHubRepositoryBundle,
  readiness: ContributionReadiness,
  setup: RepositorySetup,
  issues: SuitableIssue[],
): RepositoryScores {
  const docReasons: string[] = []
  const docPenalties: string[] = []
  let documentation = 20
  if (readiness.hasReadme) { documentation += 30; docReasons.push('README is present.') } else docPenalties.push('README was not detected.')
  if (readiness.hasContributingGuide) { documentation += 25; docReasons.push('Contribution guide is present.') } else docPenalties.push('Contribution guide was not detected.')
  if (readiness.hasCodeOfConduct) { documentation += 10; docReasons.push('Code of conduct is present.') }
  if (readiness.hasSecurityPolicy) { documentation += 5; docReasons.push('Security policy is present.') }
  if (readiness.hasPullRequestTemplate) { documentation += 10; docReasons.push('Pull-request template is present.') }

  const beginnerReasons: string[] = []
  const beginnerPenalties: string[] = []
  let beginner = 20
  const labelledIssues = issues.filter((issue) =>
    issue.labels.some((label) => preferredIssueLabels.includes(label.toLowerCase())),
  ).length
  if (labelledIssues > 0) { beginner += 35; beginnerReasons.push(`${labelledIssues} beginner-oriented open issue(s) were found.`) } else beginnerPenalties.push('No beginner-oriented issue labels were found.')
  if (readiness.hasContributingGuide) { beginner += 20; beginnerReasons.push('A contribution guide helps first-time contributors.') }
  if (readiness.hasTests) { beginner += 10; beginnerReasons.push('Tests provide feedback while making changes.') }
  if (readiness.hasIssueTemplates) { beginner += 10; beginnerReasons.push('Issue templates make project expectations clearer.') }
  if (bundle.repository.archived) { beginner -= 50; beginnerPenalties.push('Repository is archived.') }

  const setupReasons: string[] = []
  const setupPenalties: string[] = []
  let setupScore = 40
  if (setup.installCommand) { setupScore += 20; setupReasons.push('Install command was detected.') } else setupPenalties.push('Install command could not be detected.')
  if (setup.developmentCommand) { setupScore += 15; setupReasons.push('Development command was detected.') } else setupPenalties.push('Development command could not be detected.')
  if (setup.testCommand) { setupScore += 15; setupReasons.push('Test command was detected.') }
  if (setup.requiresDocker) { setupScore -= 10; setupPenalties.push('Docker setup may add onboarding work.') }
  if (setup.environmentFileNames.length > 0 && !setup.hasEnvironmentExample) { setupScore -= 10; setupPenalties.push('Environment files exist without a detected example file.') }

  const readinessReasons: string[] = []
  const readinessPenalties: string[] = []
  const readinessSignals: Array<[boolean, string]> = [
    [readiness.hasContributingGuide, 'Contribution guide is present.'],
    [readiness.hasTests, 'Automated tests were detected.'],
    [readiness.hasLintConfiguration, 'Linting configuration was detected.'],
    [readiness.hasPullRequestTemplate, 'Pull-request template is present.'],
    [readiness.hasIssueTemplates, 'Issue templates are present.'],
  ]
  let readinessScore = 20
  for (const [present, reason] of readinessSignals) {
    if (present) { readinessScore += 16; readinessReasons.push(reason) }
    else readinessPenalties.push(reason.replace(' is present.', ' was not detected.').replace(' were detected.', ' were not detected.'))
  }

  return {
    documentationQuality: score(documentation, docReasons, docPenalties),
    beginnerFriendliness: score(beginner, beginnerReasons, beginnerPenalties),
    repositoryActivity: activityScore(bundle),
    setupSimplicity: score(setupScore, setupReasons, setupPenalties),
    contributionReadiness: score(readinessScore, readinessReasons, readinessPenalties),
  }
}

function languageBreakdown(languages: Record<string, number>): LanguageBreakdown[] {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
  if (total === 0) return []

  return Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Number(((bytes / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.bytes - a.bytes)
}

function issueLabels(labels: Array<string | { name?: string | null }>): string[] {
  return labels
    .map((label) => (typeof label === 'string' ? label : label.name ?? ''))
    .filter(Boolean)
}

function availability(
  assignees: string[],
  comments: number,
): { status: IssueAvailability; explanation: string } {
  if (assignees.length > 0) {
    return {
      status: 'possibly_claimed',
      explanation: `Assigned to ${assignees.join(', ')}; confirm with maintainers before starting.`,
    }
  }

  if (comments > 0) {
    return {
      status: 'needs_review',
      explanation: 'No assignee is listed, but recent discussion may contain contribution claims. Review comments first.',
    }
  }

  return {
    status: 'probably_available',
    explanation: 'Open with no assignee. Still comment and confirm before starting work.',
  }
}

function buildIssues(bundle: GitHubRepositoryBundle): SuitableIssue[] {
  const issues = bundle.issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => {
      const labels = issueLabels(issue.labels)
      const assignees = issue.assignees.map((assignee) => assignee.login)
      const availabilityResult = availability(assignees, issue.comments)
      const labelScore = labels.reduce(
        (total, label) => total + (preferredIssueLabels.includes(label.toLowerCase()) ? 1 : 0),
        0,
      )

      return {
        issue: {
          githubIssueId: String(issue.id),
          number: issue.number,
          title: issue.title,
          bodyPreview: issue.body ? `${issue.body.slice(0, 500)}${issue.body.length > 500 ? '…' : ''}` : null,
          githubUrl: issue.html_url,
          labels,
          state: issue.state,
          author: issue.user?.login ?? null,
          assignees,
          comments: issue.comments,
          githubCreatedAt: issue.created_at,
          githubUpdatedAt: issue.updated_at,
          availabilityStatus: availabilityResult.status,
          availabilityExplanation: availabilityResult.explanation,
        } satisfies SuitableIssue,
        labelScore,
      }
    })

  return issues
    .sort((a, b) => b.labelScore - a.labelScore || Date.parse(b.issue.githubUpdatedAt) - Date.parse(a.issue.githubUpdatedAt))
    .slice(0, 20)
    .map(({ issue }) => issue)
}

function metadata(bundle: GitHubRepositoryBundle): RepositoryMetadata {
  const repository = bundle.repository
  return {
    githubRepositoryId: String(repository.id),
    owner: repository.owner.login,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    githubUrl: repository.html_url,
    defaultBranch: repository.default_branch,
    primaryLanguage: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    watchers: repository.subscribers_count ?? repository.watchers_count,
    openIssuesCount: repository.open_issues_count,
    license: repository.license?.spdx_id ?? repository.license?.name ?? null,
    topics: repository.topics ?? [],
    repositorySize: repository.size,
    isArchived: repository.archived,
    isFork: repository.fork,
    githubCreatedAt: repository.created_at,
    githubUpdatedAt: repository.updated_at,
    githubPushedAt: repository.pushed_at,
  }
}

export function analyseRepositoryBundle(bundle: GitHubRepositoryBundle): AnalysisDraft {
  const manifest = parsePackageManifest(bundle.files)
  const documents = buildDocuments(bundle.files)
  const setup = buildSetup(bundle, manifest)
  const contributionReadiness = buildContributionReadiness(bundle, documents, manifest, setup)
  const issues = buildIssues(bundle)

  return {
    repository: metadata(bundle),
    languages: languageBreakdown(bundle.languages),
    technologies: detectTechnologies(bundle, manifest),
    rootStructure: bundle.rootContents.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type,
      githubUrl: entry.html_url ?? bundle.repository.html_url,
      downloadUrl: entry.download_url,
    })),
    documents,
    setup,
    contributionReadiness,
    scores: buildScores(bundle, contributionReadiness, setup, issues),
    issues,
    analysisMetadata: {
      analysedAt: new Date().toISOString(),
      source: 'GitHub REST API',
      isAiGenerated: false,
    },
  }
}
