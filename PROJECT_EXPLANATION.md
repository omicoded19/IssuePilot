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

Real data currently powers only the repository-analysis flow.

Still demo-based:

- Organization recommendations
- Developer profile analytics
- Global contribution metrics
- Pull-request status tracking

This distinction prevents the product from presenting invented values as factual results.

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
