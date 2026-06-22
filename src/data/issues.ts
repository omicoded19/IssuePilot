import type { Issue, WorkspaceData } from '@/types/issue'

export const mockIssues: Issue[] = [
  {
    id: 'issue-validation-account',
    repositoryId: 'appwrite-sdk-for-web',
    title: 'Improve validation error handling in account service',
    number: 487,
    matchScore: 94,
    difficulty: 'Beginner–Intermediate',
    estimatedTime: '3–5 hours',
    technologies: ['TypeScript', 'API handling', 'Jest'],
    contributionType: 'Bug fix',
    maintainerActivity: 'Active — reviewed 3 PRs this week',
    availability: 'Probably available',
    likelyFiles: '2–3 files',
    repositoryKnowledgeRequired: 'Basic — Account service module only',
    labels: ['good first issue', 'bug', 'account', 'typescript'],
    matchReason: 'Directly uses your TypeScript skills. Isolated to the Account service with existing test patterns to follow. No assignee and no linked PR.',
    hasAssignee: false,
    hasLinkedPR: false,
    body: 'The account service currently returns generic error messages for validation failures. Contributors should map server validation codes to descriptive client-side error messages.',
  },
  {
    id: 'issue-session-refresh',
    repositoryId: 'appwrite-sdk-for-web',
    title: 'Add automatic session refresh before expiry',
    number: 512,
    matchScore: 88,
    difficulty: 'Intermediate',
    estimatedTime: '5–8 hours',
    technologies: ['TypeScript', 'Async patterns', 'Jest'],
    contributionType: 'Feature',
    maintainerActivity: 'Active — maintainer commented 2 days ago',
    availability: 'Available',
    likelyFiles: '3–4 files',
    repositoryKnowledgeRequired: 'Moderate — Client and Account modules',
    labels: ['enhancement', 'account', 'auth'],
    matchReason: 'Builds on your async JavaScript knowledge. Well-scoped feature with clear acceptance criteria in the issue description.',
    hasAssignee: false,
    hasLinkedPR: false,
  },
  {
    id: 'issue-jsdoc-account',
    repositoryId: 'appwrite-sdk-for-web',
    title: 'Add JSDoc comments to Account service public methods',
    number: 445,
    matchScore: 91,
    difficulty: 'Beginner',
    estimatedTime: '2–3 hours',
    technologies: ['TypeScript', 'Documentation'],
    contributionType: 'Documentation',
    maintainerActivity: 'Moderate — last review 5 days ago',
    availability: 'Available',
    likelyFiles: '1 file',
    repositoryKnowledgeRequired: 'Minimal — read method signatures only',
    labels: ['documentation', 'good first issue'],
    matchReason: 'Perfect first contribution. No complex logic — just document existing methods following the project JSDoc style guide.',
    hasAssignee: false,
    hasLinkedPR: false,
  },
  {
    id: 'issue-error-types',
    repositoryId: 'appwrite-sdk-for-web',
    title: 'Extend AppwriteException with typed error codes enum',
    number: 498,
    matchScore: 85,
    difficulty: 'Intermediate',
    estimatedTime: '4–6 hours',
    technologies: ['TypeScript', 'Error handling', 'Jest'],
    contributionType: 'Refactoring',
    maintainerActivity: 'Active — 2 related PRs merged recently',
    availability: 'Probably available',
    likelyFiles: '2–3 files',
    repositoryKnowledgeRequired: 'Moderate — exception.ts and service error paths',
    labels: ['enhancement', 'typescript', 'error-handling'],
    matchReason: 'Strengthens your TypeScript generics and enum skills. Maintainer expressed interest in this improvement in a recent discussion.',
    hasAssignee: false,
    hasLinkedPR: false,
  },
  {
    id: 'issue-storage-upload',
    repositoryId: 'appwrite-sdk-for-web',
    title: 'Fix progress callback not firing for large file uploads',
    number: 523,
    matchScore: 79,
    difficulty: 'Advanced',
    estimatedTime: '8–12 hours',
    technologies: ['TypeScript', 'Streams', 'Storage API'],
    contributionType: 'Bug fix',
    maintainerActivity: 'Active',
    availability: 'Likely taken',
    likelyFiles: '4–5 files',
    repositoryKnowledgeRequired: 'Advanced — Storage service and Client transport',
    labels: ['bug', 'storage', 'needs-investigation'],
    matchReason: 'Challenging but high-impact. Consider after completing a simpler Account service contribution first.',
    hasAssignee: true,
    hasLinkedPR: true,
  },
  {
    id: 'issue-query-retry',
    repositoryId: 'tanstack-query',
    title: 'Add configurable retry delay for network errors',
    number: 7821,
    matchScore: 90,
    difficulty: 'Intermediate',
    estimatedTime: '4–6 hours',
    technologies: ['TypeScript', 'React', 'Vitest'],
    contributionType: 'Feature',
    maintainerActivity: 'Very active — daily reviews',
    availability: 'Available',
    likelyFiles: '3–4 files',
    repositoryKnowledgeRequired: 'Moderate — query core retry logic',
    labels: ['enhancement', 'good first issue'],
    matchReason: 'TanStack Query aligns perfectly with your React stack. Excellent test coverage to learn from.',
    hasAssignee: false,
    hasLinkedPR: false,
  },
]

export const workspaceData: Record<string, WorkspaceData> = {
  'issue-validation-account': {
    issueId: 'issue-validation-account',
    currentBehavior: 'When the Account service receives a validation error from the server (e.g., invalid email format), it throws a generic AppwriteException with code 400 and message "Invalid request". The original validation details from the server response are discarded.',
    expectedBehavior: 'Validation errors should preserve server-provided field-level error details. The AppwriteException should include a `details` array with `{ field, message }` objects, and public Account methods should document these error shapes in JSDoc.',
    requiredConcepts: [
      'TypeScript error class extension',
      'REST API error response parsing',
      'Jest mock HTTP responses',
      'Conventional Commits workflow',
    ],
    likelyRelevantFiles: [
      { path: 'src/exception.ts', reason: 'AppwriteException class — add details property' },
      { path: 'src/client.ts', reason: 'Response parsing in call() method' },
      { path: 'src/services/account.ts', reason: 'Account methods that trigger validation' },
      { path: 'tests/account.test.ts', reason: 'Add test cases for validation error paths' },
    ],
    suggestedApproach: [
      'Read the current AppwriteException and client.ts error parsing logic',
      'Inspect a sample 400 validation response from Appwrite API docs',
      'Extend AppwriteException with optional details: ValidationError[]',
      'Update client.ts parseError() to extract field-level details',
      'Add Jest tests mocking validation error responses',
      'Update JSDoc on affected Account methods',
    ],
    possibleRisks: [
      'Breaking change if details property changes existing error handling in consumer apps',
      'Server response format may differ between Appwrite versions',
      'Need to ensure backward compatibility for apps catching AppwriteException by code only',
    ],
    maintainerInstructions: 'Please add tests for at least 3 validation scenarios (invalid email, weak password, missing required field). Follow existing test patterns in tests/account.test.ts. Keep the PR focused — no unrelated refactoring.',
    personalNotes: '',
    filesInspected: ['src/exception.ts', 'src/services/account.ts'],
    commandsExecuted: ['npm install', 'npm test -- --testPathPattern=account'],
    errorsEncountered: [],
    maintainerMessagePreview: `Hi! I'm interested in working on issue #487 (validation error handling in account service).

I've reviewed the Account service and exception.ts. My plan is to extend AppwriteException with field-level validation details and add corresponding Jest tests.

Could you confirm the expected shape of validation error responses from the server? I'll keep the PR focused and backward-compatible.

Thanks!`,
    prDescriptionPreview: `## Summary
Improves validation error handling in the Account service by preserving server-provided field-level error details in AppwriteException.

Fixes #487

## Changes
- Extended \`AppwriteException\` with optional \`details\` array
- Updated \`client.ts\` error parsing to extract validation details
- Added Jest tests for 3 validation error scenarios
- Updated JSDoc on affected Account methods

## Test plan
- [x] \`npm test\` passes locally
- [x] Added tests for invalid email, weak password, missing field
- [ ] Manual test against local Appwrite instance`,
    testingChecklist: [
      'Run npm test — all existing tests pass',
      'New validation error tests cover 3+ scenarios',
      'No regression in successful API call tests',
      'TypeScript compiles without errors (npm run build)',
      'Lint passes (npm run lint)',
    ],
    prChecklist: [
      'PR title follows Conventional Commits (fix(account): ...)',
      'Linked to issue #487',
      'PR template filled out completely',
      'Changes are focused — no unrelated refactoring',
      'JSDoc updated for changed public APIs',
      'Signed commits',
    ],
    gitCommands: [
      { label: 'Clone your fork', command: 'git clone https://github.com/YOUR_USERNAME/sdk-for-web.git' },
      { label: 'Add upstream remote', command: 'git remote add upstream https://github.com/appwrite/sdk-for-web.git' },
      { label: 'Create feature branch', command: 'git checkout -b fix/account-validation-errors' },
      { label: 'Fetch upstream', command: 'git fetch upstream' },
      { label: 'Rebase on main', command: 'git rebase upstream/main' },
      { label: 'Push branch', command: 'git push origin fix/account-validation-errors' },
    ],
  },
}

export function getIssueById(id: string): Issue | undefined {
  return mockIssues.find((i) => i.id === id)
}

export function getIssuesByRepository(repositoryId: string): Issue[] {
  return mockIssues.filter((i) => i.repositoryId === repositoryId)
}

export function getWorkspaceData(issueId: string): WorkspaceData | undefined {
  return workspaceData[issueId] ?? workspaceData['issue-validation-account']
}
