import type { GitHubIssueCommentResponse, GitHubIssueResponse } from '../types/github.js'
import type {
  ContributionWorkspace,
  GitHubIssueComment,
  IssueContributionType,
  IssueDifficulty,
  IssueRecommendationData,
  IssueRecommendationRequest,
  IssueScoreBreakdown,
  PersonalizedIssueRecommendation,
  WorkspaceInspectionTarget,
  WorkspaceProgressStep,
} from '../types/issue-intelligence.js'
import type {
  DetectedTechnology,
  RepositoryAnalysisData,
  RootEntry,
  SuitableIssue,
} from '../types/repository.js'

const proficiencyWeight = {
  Beginner: 0.55,
  Intermediate: 0.8,
  Advanced: 1,
} as const

const technologyAliases: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  reactjs: 'react',
  react: 'react',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  'next.js': 'nextjs',
  nextjs: 'nextjs',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  tailwind: 'tailwindcss',
  'tailwind css': 'tailwindcss',
  tailwindcss: 'tailwindcss',
}

const keywordTechnologies: Array<{ pattern: RegExp; technology: string }> = [
  { pattern: /\breact\b/i, technology: 'React' },
  { pattern: /\btypescript\b|\btype error\b|\.tsx?\b/i, technology: 'TypeScript' },
  { pattern: /\bjavascript\b|\.jsx?\b/i, technology: 'JavaScript' },
  { pattern: /\bnode(?:\.js)?\b/i, technology: 'Node.js' },
  { pattern: /\bexpress\b/i, technology: 'Express' },
  { pattern: /\bnext(?:\.js)?\b/i, technology: 'Next.js' },
  { pattern: /\bjest\b/i, technology: 'Jest' },
  { pattern: /\bvitest\b/i, technology: 'Vitest' },
  { pattern: /\bdocker\b/i, technology: 'Docker' },
  { pattern: /\bpostgres(?:ql)?\b/i, technology: 'PostgreSQL' },
  { pattern: /\bmongo(?:db)?\b/i, technology: 'MongoDB' },
  { pattern: /\bpython\b/i, technology: 'Python' },
  { pattern: /\bgo(?:lang)?\b/i, technology: 'Go' },
  { pattern: /\brust\b/i, technology: 'Rust' },
]

const claimPatterns = [
  /\bi(?:'| a)?m working on (?:this|it)\b/i,
  /\bi would like to work on (?:this|it)\b/i,
  /\bcan you assign (?:this|it) to me\b/i,
  /\bi(?:'| a)?ll take (?:this|it)\b/i,
  /\bopened (?:a )?pr\b/i,
  /\bworking on #?\d+\b/i,
]

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalize(value: string): string {
  const simplified = value.trim().toLowerCase().replace(/[^a-z0-9.+#]/g, '')
  return technologyAliases[simplified] ?? simplified
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function labelText(issue: Pick<SuitableIssue, 'labels'>): string {
  return issue.labels.join(' ').toLowerCase()
}

function issueText(issue: Pick<SuitableIssue, 'title' | 'bodyPreview' | 'labels'>): string {
  return `${issue.title}\n${issue.bodyPreview ?? ''}\n${issue.labels.join(' ')}`
}

export function inferContributionType(
  issue: Pick<SuitableIssue, 'title' | 'bodyPreview' | 'labels'>,
): IssueContributionType {
  const labels = labelText(issue)
  const text = issueText(issue).toLowerCase()

  // Explicit GitHub labels are stronger evidence than incidental words in the body.
  if (/\bbug\b|defect|regression/.test(labels)) return 'Bug fix'
  if (/documentation|\bdocs?\b/.test(labels)) return 'Documentation'
  if (/\btest(?:s|ing)?\b|coverage/.test(labels)) return 'Testing'
  if (/enhancement|feature/.test(labels)) return 'Feature'
  if (/refactor|cleanup/.test(labels)) return 'Refactoring'

  if (/\bdocs?\b|documentation|readme|typo/.test(text)) return 'Documentation'
  if (/\bbug\b|\bfix\b|error|broken|incorrect|crash|regression/.test(text)) return 'Bug fix'
  if (/\btest(?:s|ing)?\b|coverage|spec\b/.test(text)) return 'Testing'
  if (/\brefactor\b|cleanup|technical debt/.test(text)) return 'Refactoring'
  if (/\bui\b|ux|style|css|layout|accessibility|a11y/.test(text)) return 'UI improvement'
  if (/\btooling\b|build|lint|ci\b|workflow|developer experience/.test(text)) return 'Developer tooling'
  if (/\bfeature\b|enhancement|add support|implement/.test(text)) return 'Feature'
  return 'Other'
}

export function inferDifficulty(
  issue: Pick<SuitableIssue, 'title' | 'bodyPreview' | 'labels' | 'comments'>,
): IssueDifficulty {
  const labels = labelText(issue)
  const text = issueText(issue).toLowerCase()
  let score = 1

  if (/good first issue|beginner|starter|easy|first issue/.test(labels)) score -= 1
  if (/documentation|typo|copy change/.test(text)) score -= 1
  if (/refactor|architecture|performance|security|breaking|migration/.test(text)) score += 2
  if (/feature|enhancement|integration/.test(text)) score += 1
  if ((issue.bodyPreview?.length ?? 0) > 650) score += 1
  if (issue.comments >= 12) score += 1
  if (issue.comments >= 30) score += 1

  if (score <= 0) return 'Beginner'
  if (score === 1) return 'Beginner–Intermediate'
  if (score <= 3) return 'Intermediate'
  return 'Advanced'
}

function estimatedTime(
  difficulty: IssueDifficulty,
  type: IssueContributionType,
): string {
  if (type === 'Documentation' && difficulty !== 'Advanced') return '1–3 hours'
  if (difficulty === 'Beginner') return '2–4 hours'
  if (difficulty === 'Beginner–Intermediate') return '3–6 hours'
  if (difficulty === 'Intermediate') return '6–10 hours'
  return '10–16+ hours'
}

function detectRequiredTechnologies(
  issue: Pick<SuitableIssue, 'title' | 'bodyPreview' | 'labels'>,
  repositoryTechnologies: DetectedTechnology[],
): string[] {
  const text = issueText(issue)
  const detected = keywordTechnologies
    .filter(({ pattern }) => pattern.test(text))
    .map(({ technology }) => technology)

  const repositoryDefaults = repositoryTechnologies
    .filter((technology) => technology.confidence !== 'low')
    .slice(0, 4)
    .map((technology) => technology.name)

  return unique([...detected, ...repositoryDefaults]).slice(0, 6)
}

function skillScore(
  request: IssueRecommendationRequest,
  technologies: string[],
): { score: number; matched: string[]; learning: string[]; gaps: string[] } {
  const skills = new Map(request.skills.map((skill) => [normalize(skill.name), skill]))
  let earned = 0
  const matched: string[] = []
  const learning: string[] = []
  const gaps: string[] = []

  for (const technology of technologies) {
    const skill = skills.get(normalize(technology))
    if (!skill) {
      gaps.push(technology)
      continue
    }
    if (skill.wantToLearn) {
      learning.push(technology)
      earned += 0.45
    } else {
      matched.push(technology)
      earned += proficiencyWeight[skill.proficiency]
    }
  }

  return {
    score: technologies.length === 0 ? 60 : clampScore((earned / technologies.length) * 100),
    matched,
    learning,
    gaps,
  }
}

function preferenceScore(
  preferences: string[],
  type: IssueContributionType,
): number {
  if (preferences.length === 0) return 60
  const normalizedPreferences = preferences.map((value) => value.toLowerCase())
  const aliases: Record<IssueContributionType, string[]> = {
    'Bug fix': ['bug fixes', 'bug fix', 'backend', 'frontend', 'full stack'],
    Feature: ['features', 'feature', 'backend', 'frontend', 'full stack'],
    Documentation: ['documentation'],
    Testing: ['testing'],
    Refactoring: ['developer tools', 'backend', 'frontend', 'full stack'],
    'UI improvement': ['ui improvements', 'frontend'],
    'Developer tooling': ['developer tools', 'backend'],
    Other: [],
  }
  return aliases[type].some((alias) => normalizedPreferences.includes(alias)) ? 100 : 42
}

function difficultyScore(
  preferred: IssueRecommendationRequest['availability']['difficulty'],
  actual: IssueDifficulty,
): number {
  const values = ['Beginner', 'Beginner–Intermediate', 'Intermediate', 'Advanced'] as const
  const preferredIndex = preferred === 'Beginner' ? 0 : preferred === 'Intermediate' ? 2 : 3
  const distance = Math.abs(preferredIndex - values.indexOf(actual))
  if (distance === 0) return 100
  if (distance === 1) return 78
  if (distance === 2) return 48
  return 22
}

function availabilityScore(status: SuitableIssue['availabilityStatus']): number {
  if (status === 'probably_available') return 100
  if (status === 'needs_review') return 62
  return 24
}

function repositoryReadinessScore(analysis: RepositoryAnalysisData): number {
  return clampScore(
    analysis.scores.documentationQuality.value * 0.3 +
      analysis.scores.setupSimplicity.value * 0.3 +
      analysis.scores.contributionReadiness.value * 0.4,
  )
}

export function scoreStoredIssue(
  request: IssueRecommendationRequest,
  analysis: RepositoryAnalysisData,
  issue: SuitableIssue,
): PersonalizedIssueRecommendation {
  const contributionType = inferContributionType(issue)
  const difficulty = inferDifficulty(issue)
  const requiredTechnologies = detectRequiredTechnologies(issue, analysis.technologies)
  const skills = skillScore(request, requiredTechnologies)
  const scoreBreakdown: IssueScoreBreakdown = {
    skillMatch: skills.score,
    contributionPreferenceMatch: preferenceScore(request.contributionPreferences, contributionType),
    difficultyFit: difficultyScore(request.availability.difficulty, difficulty),
    availability: availabilityScore(issue.availabilityStatus),
    repositoryReadiness: repositoryReadinessScore(analysis),
  }
  const matchScore = clampScore(
    scoreBreakdown.skillMatch * 0.4 +
      scoreBreakdown.contributionPreferenceMatch * 0.2 +
      scoreBreakdown.difficultyFit * 0.15 +
      scoreBreakdown.availability * 0.15 +
      scoreBreakdown.repositoryReadiness * 0.1,
  )

  const reasons: string[] = []
  if (skills.matched.length > 0) reasons.push(`Matches your ${skills.matched.slice(0, 4).join(', ')} experience.`)
  if (skills.learning.length > 0) reasons.push(`Supports technologies you want to learn: ${skills.learning.join(', ')}.`)
  if (scoreBreakdown.contributionPreferenceMatch === 100) reasons.push(`Matches your ${contributionType.toLowerCase()} contribution preference.`)
  if (scoreBreakdown.difficultyFit >= 78) reasons.push(`The inferred ${difficulty.toLowerCase()} difficulty fits your selected level.`)
  if (issue.availabilityStatus === 'probably_available') reasons.push('No assignee was detected in the stored GitHub issue data.')
  if (reasons.length === 0) reasons.push('This issue was ranked using your skills, preferences, availability, and repository readiness.')

  const warnings: string[] = []
  if (issue.availabilityStatus !== 'probably_available') warnings.push(issue.availabilityExplanation)
  if (skills.gaps.length > 0) warnings.push(`Limited profile evidence for: ${skills.gaps.slice(0, 3).join(', ')}.`)
  if (issue.comments >= 12) warnings.push('The discussion is relatively active; read all comments before starting.')
  if (!analysis.contributionReadiness.hasContributingGuide) warnings.push('No CONTRIBUTING guide was detected in the analysed locations.')

  return {
    ...issue,
    matchScore,
    scoreBreakdown,
    difficulty,
    estimatedTime: estimatedTime(difficulty, contributionType),
    contributionType,
    requiredTechnologies,
    matchedSkills: skills.matched,
    learningSkills: skills.learning,
    reasons,
    warnings,
  }
}

export function createIssueRecommendationData(
  request: IssueRecommendationRequest,
  analysis: RepositoryAnalysisData,
): IssueRecommendationData {
  const issues = analysis.issues
    .map((issue) => scoreStoredIssue(request, analysis, issue))
    .sort((left, right) => right.matchScore - left.matchScore)

  return {
    username: request.username.toLowerCase(),
    repository: {
      owner: analysis.repository.owner,
      name: analysis.repository.name,
      fullName: analysis.repository.fullName,
      githubUrl: analysis.repository.githubUrl,
      defaultBranch: analysis.repository.defaultBranch,
    },
    issues,
    metadata: {
      generatedAt: new Date().toISOString(),
      issuesChecked: analysis.issues.length,
      issuesReturned: issues.length,
      scoringVersion: 'issue-rules-v1',
      source: 'Stored GitHub data + deterministic scoring',
      isAiGenerated: false,
    },
  }
}

function issueLabels(issue: GitHubIssueResponse): string[] {
  return issue.labels
    .map((label) => (typeof label === 'string' ? label : label.name ?? ''))
    .filter(Boolean)
}

function commentsToPublic(comments: GitHubIssueCommentResponse[]): GitHubIssueComment[] {
  return [...comments]
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
    .slice(-10)
    .map((comment) => ({
    author: comment.user?.login ?? null,
    body: comment.body ?? '',
    githubUrl: comment.html_url,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }))
}

function refineAvailability(
  recommendation: PersonalizedIssueRecommendation,
  comments: GitHubIssueCommentResponse[],
): PersonalizedIssueRecommendation {
  const claimingComment = [...comments]
    .reverse()
    .find((comment) => claimPatterns.some((pattern) => pattern.test(comment.body ?? '')))

  if (!claimingComment || recommendation.assignees.length > 0) return recommendation

  return {
    ...recommendation,
    availabilityStatus: 'needs_review',
    availabilityExplanation: `A recent comment by ${claimingComment.user?.login ?? 'a contributor'} may indicate that someone is working on this issue.`,
    scoreBreakdown: {
      ...recommendation.scoreBreakdown,
      availability: 45,
    },
    matchScore: clampScore(recommendation.matchScore - 8),
    warnings: unique([
      `A comment by ${claimingComment.user?.login ?? 'a contributor'} may claim the issue; verify before starting.`,
      ...recommendation.warnings,
    ]),
  }
}

function extractSection(body: string | null, headings: RegExp[]): string | null {
  if (!body) return null
  const lines = body.split(/\r?\n/)
  let collecting = false
  const collected: string[] = []

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)$/)
    if (heading) {
      if (collecting) break
      collecting = headings.some((pattern) => pattern.test(heading[1] ?? ''))
      continue
    }
    if (collecting) collected.push(line)
  }

  const value = collected.join('\n').trim()
  return value ? value.slice(0, 1_200) : null
}

function summarizeBody(body: string | null, fallback: string): string {
  if (!body) return fallback
  return body
    .replace(/<!--[^]*?-->/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1_200) || fallback
}

function rootEntryByNames(root: RootEntry[], names: string[]): RootEntry | null {
  const wanted = names.map((name) => name.toLowerCase())
  return root.find((entry) => wanted.includes(entry.name.toLowerCase())) ?? null
}

function createInspectionTargets(
  analysis: RepositoryAnalysisData,
  recommendation: PersonalizedIssueRecommendation,
): WorkspaceInspectionTarget[] {
  const targets: WorkspaceInspectionTarget[] = []
  const add = (entry: RootEntry | null, reason: string, confidence: WorkspaceInspectionTarget['confidence']) => {
    if (!entry || targets.some((target) => target.path === entry.path)) return
    targets.push({ path: entry.path, reason, confidence, exactFile: entry.type === 'file' })
  }

  if (analysis.documents.contributing.exists) {
    targets.push({
      path: analysis.documents.contributing.path,
      reason: 'Read the repository-specific contribution rules before editing code.',
      confidence: 'high',
      exactFile: true,
    })
  }
  if (analysis.documents.packageManifest.exists) {
    targets.push({
      path: analysis.documents.packageManifest.path,
      reason: 'Inspect scripts, dependencies, and project commands.',
      confidence: 'high',
      exactFile: true,
    })
  }

  const text = `${recommendation.title} ${recommendation.bodyPreview ?? ''} ${recommendation.labels.join(' ')}`.toLowerCase()
  if (/docs?|documentation|readme|typo/.test(text)) {
    add(rootEntryByNames(analysis.rootStructure, ['docs', 'documentation']), 'The issue appears documentation-related.', 'medium')
    if (analysis.documents.readme.exists) {
      targets.push({ path: analysis.documents.readme.path, reason: 'The issue may affect public documentation or examples.', confidence: 'medium', exactFile: true })
    }
  }
  if (/test|coverage|spec/.test(text)) {
    add(rootEntryByNames(analysis.rootStructure, ['test', 'tests', '__tests__', 'spec']), 'The issue mentions tests or coverage.', 'medium')
  }
  if (/ui|component|react|css|style|frontend/.test(text)) {
    add(rootEntryByNames(analysis.rootStructure, ['src', 'app', 'components', 'packages']), 'Likely application source area based on issue keywords.', 'low')
  }
  if (/api|server|backend|endpoint|database/.test(text)) {
    add(rootEntryByNames(analysis.rootStructure, ['src', 'server', 'api', 'packages']), 'Likely backend or API source area based on issue keywords.', 'low')
  }
  add(rootEntryByNames(analysis.rootStructure, ['src', 'packages', 'app']), 'Primary source directory detected at the repository root.', 'low')

  return targets.slice(0, 6)
}

function concepts(
  recommendation: PersonalizedIssueRecommendation,
): string[] {
  const result = [...recommendation.requiredTechnologies]
  const text = `${recommendation.title} ${recommendation.bodyPreview ?? ''}`.toLowerCase()
  if (/async|promise|await/.test(text)) result.push('Asynchronous control flow')
  if (/error|exception|validation/.test(text)) result.push('Error handling and validation')
  if (/api|http|request|response/.test(text)) result.push('HTTP and API behavior')
  if (/test|coverage|spec/.test(text)) result.push('Regression testing')
  if (/accessibility|a11y/.test(text)) result.push('Web accessibility')
  if (/performance|slow|latency/.test(text)) result.push('Performance measurement')
  return unique(result).slice(0, 8)
}

function branchName(issueNumber: number, title: string, type: IssueContributionType): string {
  const prefix = type === 'Feature' ? 'feat' : type === 'Documentation' ? 'docs' : type === 'Testing' ? 'test' : 'fix'
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42)
  return `${prefix}/${issueNumber}-${slug || 'issue'}`
}

function progressSteps(): WorkspaceProgressStep[] {
  return [
    { id: 'repository-analysed', label: 'Repository analysed', completed: true },
    { id: 'issue-selected', label: 'Issue selected', completed: true },
    { id: 'maintainer-contacted', label: 'Maintainer contacted', completed: false },
    { id: 'repository-forked', label: 'Repository forked', completed: false },
    { id: 'branch-created', label: 'Branch created', completed: false },
    { id: 'change-implemented', label: 'Change implemented', completed: false },
    { id: 'tests-passed', label: 'Tests passed', completed: false },
    { id: 'pull-request-opened', label: 'Pull request opened', completed: false },
    { id: 'review-received', label: 'Review received', completed: false },
    { id: 'merged', label: 'Merged', completed: false },
  ]
}

export function createContributionWorkspaceDraft(
  workspaceId: string,
  request: IssueRecommendationRequest,
  analysis: RepositoryAnalysisData,
  storedIssue: SuitableIssue,
  githubIssue: GitHubIssueResponse,
  comments: GitHubIssueCommentResponse[],
): Omit<ContributionWorkspace, 'metadata'> & { metadata: Omit<ContributionWorkspace['metadata'], 'persisted'> } {
  const withFullBody: SuitableIssue = {
    ...storedIssue,
    title: githubIssue.title,
    bodyPreview: githubIssue.body?.slice(0, 1_000) ?? storedIssue.bodyPreview,
    labels: issueLabels(githubIssue),
    assignees: githubIssue.assignees.map((assignee) => assignee.login),
    comments: githubIssue.comments,
    githubUpdatedAt: githubIssue.updated_at,
  }
  const recommendation = refineAvailability(
    scoreStoredIssue(request, analysis, withFullBody),
    comments,
  )
  const current = extractSection(githubIssue.body, [/(current|actual) behavio[u]?r/i, /problem/i, /bug description/i])
  const expected = extractSection(githubIssue.body, [/expected behavio[u]?r/i, /desired behavio[u]?r/i, /proposed solution/i])
  const branch = branchName(githubIssue.number, githubIssue.title, recommendation.contributionType)
  const install = analysis.setup.installCommand
  const test = analysis.setup.testCommand
  const lint = analysis.setup.lintCommand

  const suggestedApproach = [
    'Read the issue discussion and confirm that no contributor is already working on it.',
    analysis.documents.contributing.exists
      ? `Read ${analysis.documents.contributing.path} and follow its contribution rules.`
      : 'Check the README and repository discussions for contribution rules because no CONTRIBUTING file was detected.',
    install
      ? `Fork and clone the repository, then run \`${install}\` to install dependencies.`
      : 'Fork and clone the repository, then determine the correct dependency-installation command from the README.',
    'Run the existing test and lint commands before editing so you know the baseline is healthy.',
    'Reproduce or clearly observe the behavior described by the issue.',
    'Trace the smallest relevant code path and keep the change focused on the issue.',
    'Add or update a regression test when the repository has a test setup.',
    'Run the repository checks again, summarize the change, and open a focused pull request.',
  ]

  const possibleRisks = unique([
    ...recommendation.warnings,
    !analysis.contributionReadiness.hasTests ? 'No test setup was detected at the repository root; verify how maintainers expect changes to be validated.' : '',
    !analysis.documents.contributing.exists ? 'Contribution conventions may exist outside the locations inspected by IssuePilot.' : '',
    'Inspection targets are based on root structure and issue keywords; verify them before editing.',
  ])

  const maintainerMessage = `Hi, I would like to work on #${githubIssue.number} (${githubIssue.title}).\n\nI have read the available repository guidance and reviewed the issue discussion. My current plan is to reproduce the behavior, make a focused change, and add or update tests where applicable.\n\nIs the issue still available, and does this approach match what the maintainers expect?`

  const pullRequestDescription = `## Summary\n\nAddresses #${githubIssue.number}: ${githubIssue.title}\n\n## Changes\n\n- Describe the focused implementation change\n- Describe any tests or documentation added\n\n## Validation\n\n- ${test ?? 'Add the repository test command used'}\n- ${lint ?? 'Add the repository lint command used'}\n\nCloses #${githubIssue.number}`

  return {
    id: workspaceId,
    username: request.username.toLowerCase(),
    repository: analysis.repository,
    issue: {
      ...recommendation,
      fullBody: githubIssue.body,
      recentComments: commentsToPublic(comments),
    },
    issueSummary: summarizeBody(githubIssue.body, githubIssue.title),
    currentBehavior: current ?? 'The issue does not separate the current behavior into a clear section. Read the complete issue and reproduce the reported behavior before editing.',
    expectedBehavior: expected ?? 'The expected outcome is not explicitly separated. Confirm the acceptance criteria with the maintainer before implementation.',
    requiredConcepts: concepts(recommendation),
    inspectionTargets: createInspectionTargets(analysis, recommendation),
    suggestedApproach,
    possibleRisks,
    setup: analysis.setup,
    gitCommands: [
      { label: 'Clone your fork', command: `git clone https://github.com/YOUR_USERNAME/${analysis.repository.name}.git` },
      { label: 'Enter repository', command: `cd ${analysis.repository.name}` },
      { label: 'Add upstream', command: `git remote add upstream ${analysis.repository.githubUrl}.git` },
      { label: 'Create branch', command: `git checkout -b ${branch}` },
      { label: 'Sync with upstream', command: `git fetch upstream && git rebase upstream/${analysis.repository.defaultBranch}` },
      { label: 'Push branch', command: `git push -u origin ${branch}` },
    ],
    maintainerMessage,
    pullRequestDescription,
    testingChecklist: unique([
      'Reproduce or understand the original issue before changing code.',
      analysis.setup.testCommand ? `Run ${analysis.setup.testCommand}.` : 'Identify and run the repository test command.',
      analysis.setup.lintCommand ? `Run ${analysis.setup.lintCommand}.` : 'Identify and run the repository lint command when available.',
      analysis.setup.typecheckCommand ? `Run ${analysis.setup.typecheckCommand}.` : '',
      'Add a focused regression test when behavior changes.',
      'Verify that unrelated behavior still works.',
    ]),
    pullRequestChecklist: unique([
      `Reference issue #${githubIssue.number} in the pull request description.`,
      'Keep the pull request focused and avoid unrelated refactoring.',
      'Explain what changed, why it changed, and how it was tested.',
      analysis.contributionReadiness.hasPullRequestTemplate ? 'Complete every required section of the repository pull-request template.' : '',
      'Review the final diff before requesting maintainer review.',
    ]),
    progress: progressSteps(),
    personalNotes: '',
    metadata: {
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'GitHub REST API + deterministic workspace generator',
      isAiGenerated: false,
      uncertaintyNotes: [
        'Issue difficulty and time are rule-based estimates.',
        'Inspection targets are suggestions derived from root-level structure and issue keywords.',
        'Always verify issue availability and implementation expectations with maintainers.',
      ],
    },
  }
}
