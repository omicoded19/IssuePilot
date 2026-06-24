# IssuePilot

IssuePilot is a full-stack open-source contribution navigator. A developer can paste a public GitHub repository URL, retrieve real repository data, detect technologies and setup commands, inspect contribution-readiness signals, review open issues, and follow an interactive preparation flow before starting a contribution.

## Current status

The first real full-stack workflow is implemented:

```text
Repository URL
  -> React form
  -> Express API
  -> GitHub REST API
  -> deterministic repository analysis
  -> PostgreSQL persistence
  -> real repository analysis dashboard
```

Repository analysis, GitHub profile analysis, personalized repository recommendations, personalized issue ranking, contribution workspaces, GitHub OAuth sessions, and pull-request tracking now use real backend data. Global analytics remain demo data and are clearly labelled.

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- React Flow
- Recharts
- Motion

### Backend

- Node.js
- Express.js
- TypeScript
- Zod
- PostgreSQL
- `pg` PostgreSQL driver
- GitHub REST API

## Implemented features

- Public GitHub repository URL validation
- Real repository metadata retrieval
- GitHub language breakdown
- Root-directory inspection
- README and contribution-file detection
- `package.json` script extraction
- Package-manager and setup-command detection
- Evidence-based technology detection
- Transparent repository-readiness scores
- Beginner-oriented issue ranking
- Conservative issue-availability indicators
- PostgreSQL analysis history
- Stored-analysis retrieval
- Reanalysis endpoint
- Real-data integration with the existing frontend
- Loading, backend-error, missing-data, and empty-issue states
- Unit tests for URL parsing and deterministic analysis
- Public GitHub developer-profile and skill analysis
- Personalized organization and repository recommendations
- Personalized issue scores with transparent score breakdowns
- Full issue and comment retrieval for selected contributions
- PostgreSQL-backed contribution workspaces and progress
- GitHub OAuth sign-in with CSRF state validation
- Encrypted OAuth-token storage and opaque server-side sessions
- HttpOnly session cookies and sign-out support
- Repository-specific setup, Git commands, checklists, maintainer-message templates, and PR templates
- Automatic detection of pull requests authored by the connected GitHub account
- Manual pull-request URL selection when automatic matching is ambiguous
- Real review, approval, changes-requested, merge, branch, commit, and diff statistics
- PostgreSQL-backed pull-request snapshots with contribution-progress synchronization

## Project structure

```text
IssuePilot/
├── src/                         # React frontend
│   ├── pages/
│   ├── components/
│   ├── services/                # Frontend API client
│   ├── store/                   # Zustand state
│   ├── data/                    # Demo data for unfinished features
│   └── types/
├── server/
│   ├── database/migrations/     # PostgreSQL migrations
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── scripts/
│   └── tests/
├── .env.example
└── PROJECT_EXPLANATION.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database
- An optional GitHub personal access token for repository-analysis rate limits
- A GitHub OAuth App for real user sign-in

## Environment configuration

Create a frontend environment file:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:4000
```

Create a backend environment file:

```bash
cp server/.env.example server/.env
```

```env
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://username:password@localhost:5432/issuepilot
DATABASE_SSL=false
GITHUB_TOKEN=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
AUTH_ENCRYPTION_KEY=
```

For a hosted PostgreSQL connection that requires TLS, set `DATABASE_SSL=true` or include `sslmode=require` in the connection URL.

### Configure GitHub OAuth login

Create a GitHub OAuth App for local development with:

```text
Application name: IssuePilot Local
Homepage URL: http://localhost:5173
Authorization callback URL: http://localhost:4000/api/auth/github/callback
```

Copy its client ID and client secret into `server/.env`. Generate the token-encryption key locally:

```bash
npm run auth:key
```

Copy the printed value into `AUTH_ENCRYPTION_KEY`. Keep the OAuth secret and encryption key out of Git. Public username analysis remains available when OAuth is not configured.

## Installation

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm --prefix server install
```

Apply the database migration:

```bash
npm run db:migrate
```

## Running the project

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:4000
```

## API routes

### Health

```http
GET /api/health
```

Checks the Express API and PostgreSQL connection.

### Analyse a repository

```http
POST /api/repositories/analyze
Content-Type: application/json

{
  "repositoryUrl": "https://github.com/appwrite/sdk-for-web"
}
```

### Retrieve the latest stored analysis

```http
GET /api/repositories/:owner/:repository
```

### Reanalyse a repository

```http
POST /api/repositories/:owner/:repository/reanalyze
```

### Retrieve stored issues

```http
GET /api/repositories/:owner/:repository/issues?availability=probably_available&limit=20
```

### Generate personalized issue recommendations

```http
POST /api/issues/recommend
```

Uses the developer's edited skills, contribution preferences, selected difficulty, stored GitHub issues, and repository-readiness signals.

### Create or load a contribution workspace

```http
POST /api/issues/workspace
GET /api/issues/workspace/:username/:owner/:repository/:issueNumber
PATCH /api/issues/workspace/:workspaceId
```

The workspace reads the complete GitHub issue and recent comments, then stores progress and notes in PostgreSQL.

### Track a contribution pull request

```http
GET /api/pull-requests/workspaces/:workspaceId
POST /api/pull-requests/workspaces/:workspaceId/sync
Content-Type: application/json

{
  "pullRequestUrl": "https://github.com/owner/repository/pull/123"
}
```

The sync route requires a GitHub-authenticated IssuePilot session. When no URL is provided, IssuePilot searches pull requests authored by the connected user and prefers PRs that close or mention the workspace issue. Tracking is stored as a snapshot; the user refreshes it after new GitHub reviews or merges.


### GitHub authentication

```http
GET /api/auth/status
GET /api/auth/github/start
GET /api/auth/github/callback
GET /api/auth/me
POST /api/auth/logout
```

The backend validates the OAuth `state` value, exchanges the temporary code on the server, encrypts the returned GitHub access token with AES-256-GCM, and creates an opaque session stored in PostgreSQL. The browser receives only an HttpOnly session cookie.

## Verification commands

```bash
npm run lint
npm run test
npm run build
```

## Important limitations

- GitHub OAuth login is implemented, but private-repository analysis is not yet enabled.
- Deep recursive source-code analysis is not implemented.
- Technology detection is rule-based, not AI-generated.
- Issue availability is an estimate and must be confirmed with maintainers.
- Analytics are user-specific and computed from stored activity; time-saved figures remain explicitly estimated.
- Pull-request tracking is implemented as an authenticated snapshot sync; real-time webhook updates are not implemented yet.
- Relevant-file guidance is limited to root-level evidence and issue keywords; it is not deep source-code analysis.
- Background queues, semantic matching, and AI explanations are future phases. Redis caching and controlled cold-versus-warm benchmarking are implemented when `REDIS_URL` is configured.

## Next development phase

The next useful phase is deployment, route-based code splitting, final UX testing, and optional AI or webhook-based enhancements. Redis caching and controlled performance benchmarks are now implemented.

## GitHub developer profile analysis

IssuePilot can now analyse a public GitHub username from the onboarding flow. The backend:

1. Fetches the public GitHub profile and owned public repositories.
2. Excludes forks and archived repositories.
3. Selects up to 12 strong recent repositories to control API usage.
4. Aggregates GitHub language bytes.
5. Reads root `package.json` files when present.
6. Detects frameworks and tools from dependency evidence.
7. Produces editable suggested proficiency levels.
8. Stores each analysis in PostgreSQL.

API routes:

```text
POST /api/developers/analyze
GET  /api/developers/:username
```

After pulling this version, apply the new migration:

```bash
npm run db:migrate
```

## Personalized organization and repository recommendations

IssuePilot can now turn the editable contribution profile into live recommendations.
The recommendation endpoint checks a curated set of recognizable open-source
repositories, fetches current GitHub metadata and beginner-labelled issues, and
calculates an explainable weighted score.

```text
POST /api/recommendations
GET  /api/recommendations/:username/latest
```

The score combines:

- technology compatibility: 40%
- contribution preference match: 15%
- preferred difficulty: 10%
- preferred repository size: 8%
- preferred organization type: 7%
- recent repository activity: 10%
- beginner contribution opportunities: 10%

The result is persisted in PostgreSQL as a recommendation run. The Organizations
and Repositories pages clearly distinguish live results from their original demo
preview data. Selecting a live recommendation can trigger the full repository
analysis workflow.

After updating to this version, apply the new migration:

```bash
npm run db:migrate
```


## Personalized issue intelligence and contribution workspaces

For a repository that has already been analysed, IssuePilot can rank its stored beginner-oriented issues using:

- 40% developer-skill compatibility
- 20% contribution-preference match
- 15% preferred-difficulty fit
- 15% conservative issue availability
- 10% repository readiness

Selecting an issue creates a persistent workspace. The backend fetches the complete issue and up to 30 issue comments, checks for possible claim language, extracts explicit current/expected-behavior sections when present, builds root-level inspection suggestions, generates repository-specific commands, and stores progress plus notes in PostgreSQL.

All guidance is deterministic and labelled with uncertainty. IssuePilot never claims that a suggested file is definitely the implementation location or that an issue is certainly available.

## Real contribution analytics

The Analytics page now uses the authenticated user's stored PostgreSQL activity instead of global demo totals.

```http
GET /api/analytics/me
```

The endpoint aggregates:

- GitHub profile analyses
- recommendation runs and candidate repositories checked
- contribution workspaces and completed progress stages
- tracked pull requests, reviews, and merge states

Charts include six-month recommendation activity, eight-week contribution activity, the contribution funnel, technology evidence, pull-request status, match-score distribution, and workspace progress.

The 30-day percentages compare the latest 30 days against the preceding 30 days. "Estimated research time saved" is explicitly labelled as an estimate and uses this documented formula:

```text
2 minutes per evaluated repository + 30 minutes per generated contribution workspace
```

No database migration is required for this phase because analytics are calculated from existing records.


## Redis caching and measured performance benchmarks

IssuePilot can optionally cache complete repository-analysis responses in Redis. The application remains functional when Redis is not configured; caching fails open and GitHub-backed analysis continues normally.

Add this to `server/.env`:

```env
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL_SECONDS=900
```

On macOS with Homebrew:

```bash
brew install redis
brew services start redis
redis-cli ping
```

`redis-cli ping` should return `PONG`. Restart IssuePilot after changing the environment.

Authenticated users can run a controlled benchmark from the Analytics page. The benchmark:

1. Invalidates the selected repository's cache key.
2. Runs a cold analysis that calls GitHub, performs deterministic analysis, persists PostgreSQL records, and fills Redis.
3. Immediately runs the identical request again and requires a Redis cache hit.
4. Records end-to-end duration and instrumented GitHub REST request counts for both runs.
5. Stores the result in PostgreSQL for later comparison.

API routes:

```http
GET  /api/performance/me
POST /api/performance/benchmark
```

Repository-analysis responses also include `X-IssuePilot-Cache`, `X-GitHub-Requests`, and `Server-Timing` response headers. Benchmark results are real measurements from the current machine and network, not guaranteed universal performance claims.

After updating to this version, apply the migration:

```bash
npm run db:migrate
```

## Production deployment

IssuePilot includes production configuration for a split deployment:

- React/Vite frontend on Vercel
- Express API on Render
- Hosted PostgreSQL
- Hosted Redis-compatible cache

The production configuration adds cross-origin secure-session handling, trusted-proxy support, strict CORS origin validation, route-based frontend code splitting, Vercel SPA rewrites, Render migration/start commands, and deployment documentation.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete deployment and OAuth checklist.
