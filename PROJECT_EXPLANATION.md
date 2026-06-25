# IssuePilot — Project Explanation

This document is written so the project can be explained clearly in an interview and modified confidently without depending on generated code.

## 1. Problem being solved

New contributors often select repositories based only on popularity. They then discover that the setup is difficult, the codebase uses unfamiliar technologies, the issue is already claimed, or the project has unclear contribution rules.

IssuePilot reduces that research work. Its current real workflow accepts a GitHub repository URL, retrieves public data, analyses factual repository signals, stores the analysis, and displays a contribution-preparation dashboard.

## 2. Current architecture

```text
Browser
  |
  | POST /api/repositories/analyze
  v
Express route
  |
  v
Zod request validation
  |
  v
Repository controller
  |
  v
Repository service
  |---------------------> GitHub service -----> GitHub REST API
  |                              |
  |                              v
  |                     Repository data bundle
  |                              |
  v                              v
Deterministic analysis service
  |
  v
PostgreSQL database service
  |
  v
Structured JSON response
  |
  v
Zustand store
  |
  v
React repository-analysis page
```

## 3. Complete request flow

1. The user enters a repository URL on `LandingPage.tsx`.
2. The form calls `useRepositoryAnalysisStore().analyze()`.
3. The store calls `analyzeRepository()` in `src/services/repository-api.ts`.
4. `apiRequest()` sends a POST request to `/api/repositories/analyze`.
5. Express matches the request in `server/src/routes/repository-routes.ts`.
6. `validateBody()` validates the JSON body with Zod.
7. `analyzeRepository` in the controller parses the repository URL.
8. `analyseAndPersistRepository()` starts the backend workflow.
9. `fetchRepositoryBundle()` requests metadata, languages, root contents, important files, and issues from GitHub.
10. `analyseRepositoryBundle()` converts raw GitHub data into useful deterministic results.
11. `persistRepositoryAnalysis()` saves the repository, analysis history, and issues in PostgreSQL.
12. The backend returns typed JSON.
13. Zustand saves the result in `currentAnalysis`.
14. React navigates to a route such as `/repositories/appwrite--sdk-for-web`.
15. `RealRepositoryAnalysisPage.tsx` renders the real result.

## 4. Route, controller, service, database separation

### Route

A route defines the HTTP method and URL. It should not contain business logic.

Example:

```text
POST /api/repositories/analyze
```

### Controller

The controller receives already-validated request data, invokes a service, and chooses the HTTP response status.

### Service

A service performs reusable business logic. IssuePilot has separate services for:

- GitHub communication
- deterministic repository analysis
- repository workflow coordination
- PostgreSQL persistence

### Database layer

The database service contains parameterized SQL. It is responsible for transactions, upserts, analysis history, and rebuilding API responses from stored records.

This separation makes each layer easier to test and replace.

## 5. Why PostgreSQL was selected over MongoDB

IssuePilot contains strongly related entities:

```text
Repository
  -> many analyses
  -> many issues
```

PostgreSQL is useful because:

- Relations and uniqueness constraints are explicit.
- Repository and issue records are searchable using normal columns.
- Analysis snapshots can use JSONB for flexible GitHub-derived data.
- Aggregations for future analytics are straightforward.
- Transactions ensure repository, analysis, and issue updates succeed together.

MongoDB could store the same information, but PostgreSQL fits the relational and analytics-heavy nature of IssuePilot better.

## 6. Database tables

### Repository

Stores stable and searchable GitHub metadata. `githubRepositoryId` and `fullName` are unique.

### RepositoryAnalysis

Stores analysis snapshots. A new row is inserted on every reanalysis, so past results are preserved.

### Issue

Stores the latest known information for retrieved GitHub issues. Issues are upserted using `githubIssueId`.

### ContributionWorkspace

Stores the selected issue, deterministic guidance, checklist progress, and personal notes for a developer.

### AuthUser and AuthSession

Store the connected GitHub identity, encrypted OAuth access token, and hashed opaque browser sessions.

### PullRequestTracking

Stores the latest GitHub pull-request snapshot for a contribution workspace. The row is replaced on each synchronization while the workspace progress is updated transactionally.

### _issuepilot_migrations

Tracks which SQL migration files have been applied.

## 7. Why some values use JSONB

Values such as technologies, language percentages, labels, root structures, and score evidence can change shape as the product evolves. JSONB allows these flexible analysis results to remain inside PostgreSQL while identifiers and relationships stay relational.

## 8. Repository URL validation

`parseRepositoryUrl()` accepts:

```text
https://github.com/owner/repository
https://github.com/owner/repository/
github.com/owner/repository
owner/repository
owner/repository.git
```

It rejects:

- Non-GitHub hosts
- Missing owner or repository
- Issue and pull-request URLs
- Extra path segments
- Query strings and fragments
- Invalid characters

The parser returns:

```ts
{
  owner: string
  repository: string
}
```

## 9. GitHub API flow

`github-service.ts` uses the backend's native `fetch`, never the browser.

This is important because:

- The optional GitHub token remains secret.
- Rate-limit and API errors can be normalized.
- The browser only communicates with IssuePilot's API.

The service retrieves:

- Repository metadata
- Language byte counts
- Root contents
- `.github` contents
- Selected text files
- Open issues

It does not clone the repository or recursively download every source file.

## 10. Technology detection

Technology detection is evidence-based rather than AI-generated.

Examples:

- `react` in `package.json` -> React, high confidence
- `tsconfig.json` -> TypeScript, high confidence
- `Dockerfile` -> Docker, high confidence
- `go.mod` -> Go, high confidence
- GitHub language result -> language, high confidence

Each result contains:

```ts
{
  name: string
  category: string
  evidence: string
  confidence: 'high' | 'medium' | 'low'
}
```

The UI displays the evidence so users can verify why a technology was detected.

## 11. Setup-command detection

The backend first detects a package manager using lock files:

```text
pnpm-lock.yaml  -> pnpm
yarn.lock       -> yarn
bun.lockb       -> bun
package-lock.json -> npm
```

It then reads `package.json` scripts. A development command is returned only when an actual script such as `dev`, `serve`, or `develop` exists.

Missing values are returned as `null`; IssuePilot does not invent commands.

## 12. Scoring logic

The current scores are deterministic product scores, not ML predictions.

### Documentation quality

Signals include README, contribution guide, code of conduct, security policy, and pull-request template.

### Beginner friendliness

Signals include beginner issue labels, contribution documentation, tests, and issue templates.

### Repository activity

Calculated from how recently code was pushed and whether the repository is archived.

### Setup simplicity

Signals include detectable install/development/test commands, Docker requirements, and environment-file complexity.

### Contribution readiness

Signals include contribution rules, tests, linting, pull-request templates, and issue templates.

Every score includes reasons and penalties. This is more explainable than returning an unexplained percentage.

## 13. Issue ranking and availability

Pull requests are excluded because GitHub's issue endpoint returns both issues and pull requests.

Issues with labels such as `good first issue`, `help wanted`, `beginner`, `documentation`, and `bug` are ranked first.

Availability statuses are deliberately conservative:

- `probably_available`: open and unassigned with no comments
- `possibly_claimed`: one or more assignees
- `needs_review`: unassigned but comments may include a claim

The UI warns the user to read comments and ask the maintainer before starting.

## 14. PostgreSQL transaction

When analysis succeeds, one transaction performs:

1. Repository upsert
2. New analysis snapshot insert
3. Issue upserts
4. Commit

If any operation fails, the transaction rolls back. This avoids partial results such as a repository row without its analysis.

## 15. Stored analysis and reanalysis

`GET /api/repositories/:owner/:repository` reads the latest stored analysis without calling GitHub again.

`POST /api/repositories/:owner/:repository/reanalyze` fetches fresh GitHub data and adds another analysis snapshot.

This design supports future comparisons such as repository growth and analysis-latency measurements.

## 16. Frontend state flow

`repositoryAnalysisStore.ts` stores:

- `currentAnalysis`
- loading/success/error status
- safe error message
- error code

The store is intentionally not persisted to localStorage because repository analyses can be large. On refresh, the page extracts owner and repository from the route and requests the stored analysis from PostgreSQL.

## 17. Real data versus demo data

Real backend data powers the main authenticated product flows:

- Repository analysis and stored analysis history
- Public GitHub developer-profile and skill analysis
- Personalized organization and repository recommendations
- Personalized issue ranking and contribution workspaces
- GitHub OAuth users and server-side sessions
- Pull-request discovery, review status, and merge snapshots
- User-specific analytics calculated from PostgreSQL activity
- Redis cold-versus-warm performance benchmarks

The original organization, repository, issue, workspace, and analytics fixtures remain only for development or clearly labelled fallback previews when the user has not generated a real result yet. They are never presented as live GitHub or user measurements.

## 18. Error handling

Backend errors are converted to safe codes:

- `400`: invalid repository URL
- `403`: GitHub access denied
- `404`: repository or stored analysis not found
- `429`: GitHub rate limit
- `502`: GitHub unavailable
- `503`: PostgreSQL unavailable
- `500`: unexpected server error

Tokens, database URLs, stack traces, and raw SQL errors are not returned to the browser.

## 19. Important files

### Frontend

- `src/pages/LandingPage.tsx`: repository input and submit flow
- `src/pages/RepositoryAnalysisPage.tsx`: chooses real or demo analysis
- `src/pages/RealRepositoryAnalysisPage.tsx`: renders real backend data
- `src/services/api-client.ts`: shared HTTP client and errors
- `src/services/repository-api.ts`: repository API functions and route IDs
- `src/store/repositoryAnalysisStore.ts`: async analysis state
- `src/components/flow/PreparationFlow.tsx`: real-data-aware preparation roadmap
- `src/types/repository-analysis.ts`: frontend API contracts

### Backend

- `server/src/app.ts`: Express middleware and route mounting
- `server/src/index.ts`: starts and shuts down the server
- `server/src/utils/repository-url.ts`: repository URL parser
- `server/src/services/github-service.ts`: GitHub REST API communication
- `server/src/services/repository-analysis-service.ts`: rule-based analysis
- `server/src/services/repository-database-service.ts`: PostgreSQL transaction and queries
- `server/src/services/repository-service.ts`: coordinates the workflow
- `server/src/controllers/repository-controller.ts`: HTTP controller functions
- `server/src/middleware/error-handler.ts`: consistent safe errors
- `server/src/scripts/migrate.ts`: migration runner
- `server/database/migrations/001_init.sql`: database schema

## 20. Main functions and their inputs/outputs

### parseRepositoryUrl(input)

Input: repository URL or `owner/repository` string  
Output: `{ owner, repository }`  
Throws: `AppError` for invalid input

### fetchRepositoryBundle(coordinates)

Input: owner and repository  
Output: raw repository metadata, languages, selected files, root entries, and issues

### analyseRepositoryBundle(bundle)

Input: retrieved GitHub bundle  
Output: deterministic analysis draft

### persistRepositoryAnalysis(draft)

Input: analysis draft  
Output: final analysis with database ID and persisted flag

### analyzeRepository(repositoryUrl)

Frontend input: repository URL  
Frontend output: typed real repository analysis

## 21. Security decisions

- GitHub and database secrets exist only in `server/.env`.
- Environment files are ignored by Git.
- SQL queries use placeholders instead of string concatenation.
- Request bodies are validated with Zod.
- GitHub responses are not blindly exposed.
- API error responses exclude internal details.
- Repository fetching has a timeout.
- Large text files are not decoded into memory beyond the configured limit.

## 22. Current scalability limitations

- GitHub file requests happen during the user request.
- No Redis cache is present.
- No background queue is present.
- Issue ranking is rule-based.
- Root structure is not recursively indexed.
- PostgreSQL issue upserts are currently sequential.
- There is no per-user authorization.

## 23. Planned improvements

1. GitHub OAuth and developer profile analysis
2. Editable skills and contribution preferences
3. Organization and repository recommendation scoring
4. Redis cache for unchanged GitHub metadata
5. BullMQ background repository indexing
6. Embeddings for issue-to-skill semantic matching
7. AI explanations grounded in retrieved repository files
8. GitHub webhooks for pull-request status tracking
9. Real contribution analytics
10. Performance benchmarks for resume metrics

## 24. Interview questions and concise answers

### 1. Why does the frontend call your backend instead of GitHub directly?

To keep the GitHub token secret, normalize errors, persist results, and centralize analysis logic.

### 2. Why did you use PostgreSQL?

Repositories, analyses, and issues have clear relations, while JSONB handles flexible analysis payloads.

### 3. How do you avoid SQL injection?

All database values are passed through PostgreSQL placeholders such as `$1`, `$2`, and `$3`.

### 4. Why save multiple analyses?

It preserves history and enables future trend comparisons without overwriting earlier results.

### 5. How do you detect technologies?

I inspect language statistics, dependency manifests, configuration names, lock files, and Docker files, and attach evidence to each result.

### 6. Is the repository score generated by AI?

No. It is a transparent weighted rule system with reasons and penalties.

### 7. How do you detect package manager commands?

I identify a lock file, then map real `package.json` scripts to package-manager commands.

### 8. Why don't you clone the full repository?

The MVP needs metadata and setup signals, so cloning would add latency, storage, and security risk unnecessarily.

### 9. How do you handle GitHub rate limits?

The backend maps rate-limit responses to a safe 429 error and supports an optional server-side token.

### 10. Why use a transaction?

It ensures repository metadata, the analysis snapshot, and issues are saved atomically.

### 11. How does refresh work on a real analysis page?

The route encodes owner and repository. On refresh the frontend loads the latest stored analysis from PostgreSQL.

### 12. How is issue availability determined?

It is a conservative estimate based on assignment and discussion activity, and the user is told to verify with maintainers.

### 13. What is the biggest current limitation?

Analysis only understands root-level structure and selected files; it does not yet index source code deeply.

### 14. How would you reduce latency?

Cache repository ETags and analyses in Redis, move indexing to a queue, parallelize safe requests, and skip unchanged files.

### 15. How would personalized recommendations work?

Extract user skills, assign weighted compatibility features, then later combine deterministic scores with embedding similarity.

### 16. What happens when PostgreSQL fails?

The backend returns a safe 503 response and the frontend shows a database-unavailable state instead of fake data.

### 17. Why keep demo pages?

They preserve the product design while real features are implemented incrementally and clearly labelled.

## 25. Exercises to prove understanding

### Exercise 1

Add `biome.json` detection and return Biome as a quality tool with evidence.

### Exercise 2

Add a `minimumStars` query filter to the repository recommendation API after that API is implemented.

### Exercise 3

Change the activity score thresholds, update the tests, and explain how the score changes for a repository last pushed 90 days ago.

## GitHub profile skill analysis flow

```text
GitHub username entered in onboarding
→ POST /api/developers/analyze
→ Zod validates the username
→ GitHub service fetches the user and public owned repositories
→ forks and archived repositories are removed
→ up to 12 strong recent repositories are selected
→ language endpoints and package.json files are fetched
→ deterministic analysis aggregates languages and dependency evidence
→ PostgreSQL stores the analysis history
→ frontend updates the real user profile and editable skill store
→ Developer Profile page displays evidence and analysed repositories
```

The platform does not claim that GitHub activity proves expertise. `suggestedProficiency` is based on repository count and repeated evidence, is labelled as an estimate, and can be edited during onboarding.

### New important files

- `server/src/services/developer-profile-analysis-service.ts`: converts GitHub repository evidence into language and technology signals.
- `server/src/services/developer-profile-database-service.ts`: saves and retrieves profile-analysis history.
- `server/src/controllers/developer-profile-controller.ts`: validates requests and returns API responses.
- `src/services/developer-profile-api.ts`: frontend API functions for profile analysis.
- `src/store/developerProfileStore.ts`: persists the latest safe analysis in local storage.
- `src/pages/DeveloperProfilePage.tsx`: displays the real profile, language activity, technology evidence, and source repositories.

## Personalized recommendation flow

```text
Editable skills and preferences
→ POST /api/recommendations
→ Zod validates the contribution profile
→ recommendation service combines a curated baseline with live GitHub search based on the current user’s profile
→ GitHub service fetches live repository metadata, root files, and open issues
→ scoring engine calculates seven transparent compatibility features
→ repository recommendations are grouped into organization recommendations
→ PostgreSQL stores the request and recommendation result
→ React displays live cards and lets the user analyse a selected repository
```

### Why recommendations are no longer limited to a fixed list

The current version retains a small curated baseline for predictable quality, but
also searches GitHub at recommendation time using each user’s strongest known
skills, learning targets, and contribution preferences. Another user can therefore
receive a different candidate set. Live metadata and open issues are still fetched
before scoring, and the final list is capped to control API usage.

### Recommendation score

The overall score is a weighted average:

- 40% technology compatibility
- 15% contribution preference match
- 10% preferred difficulty
- 8% repository size
- 7% organization type
- 10% repository activity
- 10% beginner opportunity

Every result includes the individual components, reasons it matched, and gaps.
The score is a deterministic ranking aid, not a guarantee that a contribution
will be accepted.

### New important files

- `server/src/data/recommendation-catalog.ts`: curated candidate repositories and stable classification metadata.
- `server/src/services/recommendation-engine.ts`: pure scoring, issue filtering, and organization grouping logic.
- `server/src/services/recommendation-service.ts`: bounded-concurrency GitHub retrieval and orchestration.
- `server/src/services/recommendation-database-service.ts`: persists and retrieves recommendation runs.
- `src/store/recommendationStore.ts`: frontend recommendation state and loading/error handling.
- `src/lib/recommendation-mappers.ts`: converts API results into existing visual card models.
- `src/pages/OrganizationsPage.tsx`: live organization results with demo fallback.
- `src/pages/RepositoriesPage.tsx`: live repository results, filtering, sorting, and analysis handoff.

### Interview questions for recommendations

1. **Why is technology compatibility weighted most heavily?**  
   The product's first responsibility is to avoid recommending codebases that are far outside the user's current or desired stack.

2. **Why not call the score an AI prediction?**  
   It is a deterministic weighted formula. Labelling it accurately makes the system explainable and easier to test.

3. **How is API fan-out controlled?**  
   Candidate fetches run with bounded concurrency rather than sending every GitHub request simultaneously.

4. **Why persist recommendation runs?**  
   It supports reloads, auditing, future comparison metrics, and later analysis of which recommendations led to contributions.

5. **What would be the next scaling improvement?**  
   Cache unchanged metadata with ETags and Redis, then index candidates in background jobs instead of fetching every candidate during the request.


## Personalized issue intelligence flow

```text
Analysed repository + edited developer profile
→ POST /api/issues/recommend
→ load stored repository analysis and beginner-oriented issues
→ infer contribution type, difficulty, technologies, and time
→ calculate five transparent score components
→ display ranked real GitHub issues
→ user selects an issue
→ GET saved workspace or POST /api/issues/workspace
→ fetch full issue and issue comments from GitHub
→ refine availability and extract explicit issue sections
→ generate commands, checklists, and contribution templates
→ save workspace, progress, and notes in PostgreSQL
```

### Issue score

The score is a weighted formula, not machine learning:

- 40% skill match
- 20% contribution preference
- 15% preferred difficulty
- 15% issue availability
- 10% repository readiness

`issue-intelligence-engine.ts` is a pure deterministic module. It can be unit tested without PostgreSQL or live GitHub requests. It infers difficulty and contribution type from labels first, then title/body keywords. Explicit labels are treated as stronger evidence than incidental words.

### Contribution workspace persistence

`ContributionWorkspace` stores one workspace per developer, repository, and issue. The generated guidance is JSONB because it contains flexible checklists and evidence, while username, repository relation, issue number, dates, and uniqueness remain relational columns.

When a workspace is regenerated, current progress and personal notes are preserved. This prevents refreshed GitHub guidance from erasing the user's work.

### Availability refinement

The repository-analysis phase uses assignees and stored issue data. When a workspace opens, IssuePilot also reads recent comments and looks for phrases such as “I would like to work on this issue.” A match changes the status to `needs_review`; it still does not assert that the issue is definitely claimed.

### Relevant-area guidance

IssuePilot currently sees only root-level repository structure. It therefore calls results “inspection targets,” not “relevant files.” CONTRIBUTING and package manifests can be exact files; source directories inferred from keywords are marked medium or low confidence. Deep tree traversal and code-symbol retrieval are future work.

### New important files

- `server/src/services/issue-intelligence-engine.ts`: deterministic issue scoring and workspace generation.
- `server/src/services/issue-intelligence-service.ts`: orchestration for stored analysis, GitHub issue details, and persistence.
- `server/src/services/issue-intelligence-database-service.ts`: PostgreSQL workspace upsert, retrieval, and progress updates.
- `server/src/controllers/issue-intelligence-controller.ts`: Zod validation and HTTP responses.
- `src/store/issueIntelligenceStore.ts`: recommendation/workspace loading, errors, persistence-safe client state.
- `src/pages/IssuesPage.tsx`: personalized issue filters and ranking UI.
- `src/pages/WorkspacePage.tsx`: real issue preparation, progress, notes, templates, and comments.

### Interview questions for issue intelligence

1. **Why score stored issues instead of calling GitHub for every filter change?**  
   Repository analysis already stores a bounded issue set, so deterministic scoring is fast, repeatable, and avoids unnecessary API usage.

2. **Why fetch GitHub again when opening a workspace?**  
   The list stores a preview. The workspace needs the complete body and recent comments to extract acceptance criteria and refine availability.

3. **How are user notes protected during regeneration?**  
   The PostgreSQL upsert updates generated workspace JSON while preserving the existing progress and personal-notes columns.

4. **Why is availability conservative?**  
   GitHub does not provide a universal “someone is working on this” field. Assignees and comment language are signals, not proof.

5. **What is the next improvement?**  
   Add GitHub OAuth and webhooks so workspace stages can be verified automatically from forks, branches, pull requests, reviews, and merges.


## GitHub OAuth and session flow

The authentication flow is separate from public repository analysis:

```text
Browser clicks Continue with GitHub
  -> GET /api/auth/github/start
  -> backend creates a random state value in an HttpOnly cookie
  -> GitHub authorization page
  -> GitHub redirects to /api/auth/github/callback with code and state
  -> backend verifies state
  -> backend exchanges code for a GitHub access token
  -> backend fetches the authenticated GitHub user
  -> access token is encrypted with AES-256-GCM
  -> AuthUser and AuthSession rows are created in PostgreSQL
  -> browser receives an opaque HttpOnly session cookie
  -> frontend calls /api/auth/status to restore the signed-in user
```

### Why the token exchange is server-side

The GitHub client secret must never be shipped in the Vite bundle. The browser only starts the flow and receives a session cookie; the backend performs the code exchange and stores the encrypted GitHub token.

### CSRF protection

`startGitHubAuth` creates a cryptographically random OAuth state value. The same value is sent to GitHub and stored in an HttpOnly, SameSite=Lax cookie. The callback proceeds only when both values match using a timing-safe comparison.

### Session design

The browser receives a random opaque token. PostgreSQL stores only its SHA-256 hash in `AuthSession`, so a database reader cannot directly reuse the browser cookie. Sessions expire after 30 days and are deleted on logout.

### OAuth-token encryption

GitHub access tokens are encrypted using AES-256-GCM before storage. The ciphertext, IV, and authentication tag are stored separately. `AUTH_ENCRYPTION_KEY` stays only in the backend environment. This prepares the project for future user-authorized GitHub API calls without exposing raw tokens.

### New tables

`AuthUser` stores the signed-in GitHub identity and encrypted token material. `AuthSession` stores server-side session metadata and links each session to one user. Existing contribution tables still use usernames; a later migration can replace those references with `AuthUser.id`.

### Important authentication files

- `server/src/controllers/auth-controller.ts`: starts OAuth, validates callbacks, creates sessions, and logs users out.
- `server/src/services/github-oauth-service.ts`: builds the authorization URL, exchanges the code, and fetches the authenticated user.
- `server/src/services/auth-database-service.ts`: persists users and session hashes.
- `server/src/utils/auth-crypto.ts`: encrypts GitHub tokens and hashes session tokens.
- `src/store/authStore.ts`: restores the signed-in user and starts login/logout actions.
- `src/components/auth/AuthBootstrap.tsx`: checks the session when the React app starts.
- `src/pages/AuthCallbackPage.tsx`: shows callback success or a safe error before routing to onboarding.

### Authentication interview questions

1. **Why use an HttpOnly cookie?** JavaScript cannot read it, which reduces token theft through XSS.
2. **Why store a session hash rather than the raw session token?** A leaked database row is not immediately usable as a browser session.
3. **What does the OAuth state parameter prevent?** Login CSRF and callback substitution attacks.
4. **Why use AES-GCM?** It provides both encryption and integrity verification for stored OAuth tokens.
5. **Why is OAuth optional in local configuration?** Public repository analysis should continue working even before a developer creates a GitHub OAuth App.
6. **What is still missing?** Token refresh/revocation handling, private-repository permissions, and GitHub App webhooks.

## 18. Pull-request tracking flow

The contribution workspace can now connect to an actual GitHub pull request:

```text
Workspace page
  -> authenticated sync request
  -> session cookie lookup
  -> decrypt the user's GitHub OAuth token
  -> list PRs authored by that user in the repository
  -> match closing references such as "Fixes #123"
  -> fetch PR details and reviews
  -> derive review/merge status
  -> save a PostgreSQL snapshot
  -> synchronize workspace progress
  -> render the current PR timeline
```

Automatic matching prioritizes explicit closing references, then normal issue mentions. If multiple possible PRs remain, the UI asks the user to select or paste the exact GitHub PR URL rather than guessing.

The backend derives these states deterministically:

- draft
- open
- in review
- changes requested
- approved
- merged
- closed without merge

A pull-request sync marks `pull-request-opened`, `review-received`, and `merged` workspace steps from real GitHub evidence. Tracking is a snapshot, not a webhook stream, so the user refreshes it after GitHub activity.

### Security decisions

- The browser never receives the GitHub OAuth access token.
- OAuth tokens are encrypted with AES-256-GCM in PostgreSQL.
- Browser session tokens are random, HttpOnly, and stored only as SHA-256 hashes.
- A user may track only workspaces and pull requests belonging to their connected GitHub username.
- SQL uses parameterized values, and PR URLs are validated against the workspace repository.

### Current limitation

The OAuth App currently requests profile/email scope only. That is sufficient for public repository pull-request data, but private repository support would require carefully requesting broader repository access. Real-time updates will later use GitHub webhooks or a GitHub App.

## 19. Real analytics flow

The analytics page does not use the old preview totals. It requires the authenticated GitHub session and queries records associated with that user's GitHub username and `AuthUser.id`.

```text
AnalyticsPage
  -> analyticsStore.load()
  -> GET /api/analytics/me with the HttpOnly session cookie
  -> auth-context service validates the session
  -> analytics database service loads profile analyses, recommendation runs,
     contribution workspaces, and PR tracking rows in parallel
  -> analytics engine calculates totals, period comparisons, funnels,
     score distributions, progress counts, and recent activity
  -> React renders the returned data with Recharts
```

### Why analytics are computed in a pure engine

`analytics-engine.ts` receives plain typed data and a clock value. It does not know about Express or PostgreSQL. This makes calculations deterministic and unit-testable, including empty-account behavior and fixed-date period comparisons.

### Meaning of the figures

- **Repositories evaluated** is the sum of candidates checked by real recommendation runs.
- **Repositories recommended** is the sum of ranked results returned to the user.
- **Contributions started** is the number of persisted contribution workspaces.
- **Pull requests tracked** counts persisted tracking snapshots for the authenticated user.
- **Merge success rate** is merged tracked PRs divided by all tracked PRs.
- **Repository/issue match averages** use deterministic IssuePilot match scores, not ML accuracy.
- **Contribution completion** is completed workspace steps divided by all stored workspace steps.
- **30-day trends** compare the latest 30 days with the preceding 30 days.
- **Estimated time saved** is not a measured benchmark. The UI states the formula: two minutes per evaluated repository plus 30 minutes per generated workspace.

### Important analytics files

- `server/src/services/analytics-database-service.ts`: retrieves only the authenticated user's records.
- `server/src/services/analytics-engine.ts`: pure calculations and chart generation.
- `server/src/controllers/analytics-controller.ts`: requires authentication and returns no-cache JSON.
- `src/services/analytics-api.ts`: calls the authenticated endpoint with cookies.
- `src/store/analyticsStore.ts`: owns loading, success, and error states.
- `src/pages/AnalyticsPage.tsx`: renders real metrics, empty states, formulas, and charts.

### Analytics interview questions

1. **How do you prevent one user from seeing another user's analytics?** The backend derives identity from the server-side session, then filters username-based records and PR rows linked to the authenticated `AuthUser.id`; the browser cannot select a different username.
2. **Why calculate analytics in TypeScript instead of one large SQL query?** The current dataset per user is bounded, and a pure engine is easier to test and evolve. At larger scale, monthly aggregates would move into SQL/materialized views.
3. **What happens when a user has no data?** The endpoint returns zeros and empty chart arrays; the frontend renders an honest empty state instead of demo values.
4. **Are the percentage trends lifetime growth?** No. They compare the most recent 30-day period with the preceding 30 days.
5. **Is time saved a measured claim?** No. It is clearly marked as an estimate with a visible formula. Resume claims should use a separately controlled benchmark.
6. **What would you optimize first at scale?** Add indexed user foreign keys to all activity tables, pre-aggregate daily metrics, cache stable summaries, and load the analytics route lazily.


## 20. Redis cache and benchmark flow

Repository analysis now uses an optional Redis cache in front of the expensive GitHub workflow.

```text
POST /api/repositories/analyze
  -> parse owner/repository
  -> check Redis key issuepilot:repository-analysis:v1:owner/repository
  -> cache hit: deserialize and return without GitHub calls
  -> cache miss: call GitHub, analyse evidence, persist PostgreSQL data
  -> serialize the complete analysis into Redis with a TTL
  -> return response with cache, GitHub-request, and server-timing headers
```

A manual reanalysis bypasses and replaces the cache so the user can intentionally fetch fresh GitHub state. Redis is optional: when unavailable, repository analysis continues through GitHub and PostgreSQL rather than failing the main product flow.

### Controlled benchmark flow

```text
Analytics page
  -> authenticated POST /api/performance/benchmark
  -> invalidate one repository cache key
  -> cold run with GitHub request instrumentation
  -> warm run for the same repository
  -> verify that the warm run is a Redis hit
  -> calculate latency and GitHub-request reductions
  -> save PerformanceBenchmark in PostgreSQL
  -> display the measured result and methodology
```

The GitHub request counter uses Node.js `AsyncLocalStorage`. Every GitHub REST call increments only the counter belonging to the active benchmark operation, avoiding a global counter that would mix concurrent users' requests.

### Important performance files

- `server/src/services/cache-service.ts`: lazy Redis connection, JSON cache helpers, TTLs, fail-open behavior, and shutdown.
- `server/src/services/github-request-metrics.ts`: request-local GitHub API instrumentation.
- `server/src/services/repository-service.ts`: cache hit/miss/bypass orchestration and timing.
- `server/src/services/performance-service.ts`: runs the controlled cold/warm benchmark and calculates reductions.
- `server/src/services/performance-database-service.ts`: stores and loads benchmark history.
- `server/database/migrations/007_performance_benchmarks.sql`: benchmark persistence schema.
- `src/components/analytics/PerformanceBenchmarkPanel.tsx`: benchmark controls, results, methodology, and history.
- `src/store/performanceStore.ts`: frontend loading and benchmark state.

### What can honestly be claimed

Use only a result produced by the benchmark on a documented repository and environment. A valid explanation is: the cold path performs network requests, analysis, and database persistence, while the warm path returns a serialized analysis from Redis. Results should mention the repository, number of runs, machine/environment, and whether the reported value is median or a single run.

### Performance interview questions

1. **Why is Redis optional?** Repository analysis is a core feature, so a cache outage should reduce performance rather than make the feature unavailable.
2. **What is the cache key?** It includes a namespace, schema version, owner, and repository name so formats can be invalidated safely.
3. **How is stale data refreshed?** The reanalyse route bypasses and replaces the cached value; normal entries also expire after the configured TTL.
4. **Why benchmark cold and warm paths in one request?** It controls the repository and environment, reducing unrelated differences between measurements.
5. **Why count GitHub calls with AsyncLocalStorage?** It isolates metrics per asynchronous request even when multiple users benchmark concurrently.
6. **Why can latency reduction vary?** Network, GitHub, PostgreSQL, Redis, repository size, and local machine load all affect end-to-end duration.
7. **What would you improve for rigorous resume metrics?** Run several cold/warm pairs, discard warm-up outliers, report median and p95, and retain environment metadata.
8. **Why cache the final analysis rather than every GitHub response?** It makes the hot path one lookup and avoids repeating analysis and database persistence, while keeping the first implementation understandable.

## Production deployment decisions

IssuePilot is prepared for a split-origin production deployment: the React frontend runs on Vercel while the Express API runs on Render. The API allows only configured frontend origins and credentialed requests. In production, the session cookie uses `HttpOnly`, `Secure`, and `SameSite=None` because the browser sends it from the Vercel frontend to the Render API. Express trusts one reverse proxy so it correctly recognizes Render's HTTPS-forwarded requests.

The frontend routes are loaded lazily with React `Suspense`. This separates large pages such as Analytics, repository analysis, and contribution workspaces into route-level chunks instead of placing the whole product in the initial JavaScript bundle.

Database migrations are compiled with the backend. The Render start command runs the idempotent production migration script before starting the Express process, so the service does not start against an outdated schema. The health endpoint checks PostgreSQL and reports Redis status, allowing the deployment platform to detect whether the API is ready.
