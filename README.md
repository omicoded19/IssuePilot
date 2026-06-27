````markdown
# IssuePilot

### Navigate open source with data, not guesswork.

IssuePilot is a full-stack open-source contribution intelligence platform that analyses a developer's GitHub profile, detects technical skills, recommends relevant repositories and issues, prepares contribution workspaces, and tracks pull requests from discovery to merge.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Open_IssuePilot-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://issue-pilot-beta.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/omicoded19/IssuePilot)

> **Live application:** https://issue-pilot-beta.vercel.app  
> **Repository:** https://github.com/omicoded19/IssuePilot

---

## Table of Contents

- [Overview](#overview)
- [Why IssuePilot?](#why-issuepilot)
- [Core Features](#core-features)
- [How It Works](#how-it-works)
- [Recommendation Logic](#recommendation-logic)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Run Locally](#run-locally)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Testing and Verification](#testing-and-verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Current Limitations](#current-limitations)
- [Contributing](#contributing)
- [Author](#author)

---

## Overview

Finding an open-source repository is easy. Finding one that:

- matches your current skills,
- contains active and relevant issues,
- has usable contribution documentation,
- is maintained regularly,
- accepts beginner contributions,
- and gives you a realistic chance of completing a pull request

is much harder.

IssuePilot reduces that uncertainty by combining live GitHub data, deterministic repository analysis, personalised scoring, contribution planning, and pull-request tracking in one workflow.

Authenticated application pages use real GitHub, PostgreSQL, and Redis-backed data. Demo cards are restricted to the public landing page and are not used as fallback records inside authenticated product flows.

---

## Why IssuePilot?

Developers beginning their open-source journey often face four problems:

1. **Repository discovery**  
   They do not know which repositories match their skills.

2. **Issue selection**  
   Labels such as `good first issue` do not guarantee that an issue is available, recent, understandable, or actively maintained.

3. **Contribution preparation**  
   Setup instructions, relevant files, branch commands, checklists, and maintainer communication are spread across multiple pages.

4. **Progress tracking**  
   Developers manually monitor pull requests, reviews, requested changes, and merge status.

IssuePilot combines these tasks into a single contribution workflow.

---

## Core Features

### GitHub Authentication

- GitHub OAuth sign-in
- CSRF state validation
- Encrypted OAuth-token storage
- Opaque server-side sessions
- HttpOnly session cookies
- Account-scoped API access
- Sign-out and session cleanup
- Account-data export
- Permanent account deletion
- Best-effort GitHub token revocation

### Developer Profile Analysis

- Analyses a public GitHub username
- Reads public owned repositories
- Excludes forks and archived repositories
- Aggregates language usage
- Detects frameworks and tools from `package.json`
- Generates editable skills and proficiency suggestions
- Stores profile analyses in PostgreSQL

### Personalised Repository Discovery

- Searches live GitHub repositories
- Uses developer skills and learning targets
- Considers preferred difficulty and repository size
- Checks repository freshness and activity
- Looks for recent unassigned issues
- Produces transparent recommendation scores
- Stores recommendation history

### Repository Intelligence

- Validates public GitHub repository URLs
- Fetches live repository metadata
- Calculates language distribution
- Detects README and contribution documentation
- Detects package managers and setup commands
- Extracts available `package.json` scripts
- Identifies technologies from repository evidence
- Calculates repository-readiness scores
- Stores repository analyses in PostgreSQL
- Supports repository reanalysis

### Issue Intelligence

- Retrieves real GitHub issues
- Ranks issues against developer skills
- Estimates issue availability conservatively
- Detects possible claim comments
- Fetches full issue descriptions and recent comments
- Extracts current and expected behaviour
- Classifies likely issue type and difficulty
- Clearly labels uncertain guidance

### Contribution Workspace

Each selected issue can generate a persistent workspace containing:

- issue context,
- repository setup instructions,
- Git commands,
- suggested files to inspect,
- implementation checklist,
- testing checklist,
- maintainer-message template,
- pull-request template,
- personal notes,
- and contribution progress.

### Pull-Request Tracking

- Automatically searches for pull requests authored by the connected user
- Supports manual PR URL selection
- Associates a pull request with its contribution workspace
- Tracks:
  - open,
  - merged,
  - closed,
  - and changes-requested states
- Reads review and approval information
- Displays commits, branches, changed files, additions, and deletions
- Synchronises active pull requests when contribution pages open or regain focus
- Removes closed work from the active-contribution view

### Analytics

The analytics dashboard uses stored user activity to display:

- developer analyses,
- generated recommendation runs,
- repositories evaluated,
- contribution workspaces,
- workspace progress,
- tracked pull requests,
- reviews and merge states,
- technology evidence,
- match-score distribution,
- six-month recommendation activity,
- eight-week contribution activity,
- contribution funnel,
- pull-request status distribution,
- and estimated research time saved.

### Performance and Reliability

- Redis-backed repository-analysis caching
- In-memory fallback when Redis is unavailable
- Request throttling for expensive API operations
- Cold-versus-warm performance benchmarking
- GitHub REST request instrumentation
- Route-level frontend code splitting
- Loading, error, empty, and missing-data states
- Global frontend error boundary
- Responsive desktop and mobile layouts
- Automated backend tests

---

## How It Works

A typical contribution journey looks like this:

1. Sign in using GitHub.
2. Analyse your GitHub developer profile.
3. Review and edit detected skills.
4. Select learning targets and contribution preferences.
5. Generate personalised repository recommendations.
6. Open a recommended repository.
7. Run the repository analysis.
8. Review repository readiness and available issues.
9. Select an issue and create a contribution workspace.
10. Follow setup, implementation, testing, and communication guidance.
11. Open a pull request on GitHub.
12. Synchronise the pull request with IssuePilot.
13. Track reviews, requested changes, closure, and merge status.
14. Review progress through the dashboard and analytics pages.

---

## Recommendation Logic

IssuePilot does not hide its ranking logic behind an unexplained score.

### Repository Recommendation Score

| Signal | Weight |
|---|---:|
| Technology compatibility | 30% |
| Fresh unassigned issue activity | 20% |
| Contribution preference match | 12% |
| Recent repository activity | 10% |
| Beginner contribution opportunities | 10% |
| Preferred difficulty | 8% |
| Preferred repository size | 5% |
| Preferred organisation type | 5% |

### Issue Recommendation Score

| Signal | Weight |
|---|---:|
| Developer-skill compatibility | 40% |
| Contribution-preference match | 20% |
| Preferred-difficulty fit | 15% |
| Conservative issue availability | 15% |
| Repository readiness | 10% |

All results are deterministic and evidence-based. IssuePilot does not claim that an issue is definitely unassigned or that a suggested file is certainly the implementation location.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript | Static typing |
| Vite | Development server and production bundling |
| Tailwind CSS | Responsive styling |
| React Router | Client-side routing |
| Zustand | Application state management |
| React Flow | Interactive workflow visualisation |
| Recharts | Analytics charts |
| Motion | Interface animations |
| Lucide React | Icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Server runtime |
| Express.js 5 | REST API |
| TypeScript | Typed backend development |
| Zod | Request validation |
| PostgreSQL | Persistent application data |
| `pg` | PostgreSQL driver |
| Redis | Caching and rate-limit storage |
| GitHub REST API | Repository, issue, profile, review, and PR data |

### Deployment

| Service | Purpose |
|---|---|
| Vercel | React frontend |
| Render | Express API |
| Neon | Hosted PostgreSQL |
| Upstash | Redis-compatible cache |

---

## Architecture

```mermaid
flowchart LR
    U[User] --> F[React + TypeScript Frontend]
    F --> A[Express REST API]
    A --> G[GitHub REST API]
    A --> P[(PostgreSQL)]
    A --> R[(Redis Cache)]

    G --> A
    P --> A
    R --> A
    A --> F
````

### Repository Analysis Flow

```text
GitHub repository URL
        ↓
React analysis form
        ↓
Express REST API
        ↓
GitHub repository metadata
        ↓
Deterministic technology and readiness analysis
        ↓
PostgreSQL persistence
        ↓
Redis cache
        ↓
Repository intelligence dashboard
```

### Authentication Flow

```text
User selects "Continue with GitHub"
        ↓
Backend creates OAuth state
        ↓
GitHub authorization
        ↓
GitHub redirects to the Express callback
        ↓
Backend validates state and exchanges the code
        ↓
OAuth token is encrypted
        ↓
Opaque session is stored in PostgreSQL
        ↓
HttpOnly cookie is returned to the browser
```

---

## Project Structure

```text
IssuePilot/
├── public/
├── src/
│   ├── app/                    # Application routing
│   ├── components/             # Shared UI components
│   ├── data/                   # Landing examples and skill catalogue
│   ├── hooks/                  # Reusable React hooks
│   ├── lib/                    # Frontend utilities
│   ├── pages/                  # Application pages
│   ├── services/               # Frontend API client
│   ├── store/                  # Zustand stores
│   └── types/                  # Frontend TypeScript types
│
├── server/
│   ├── database/
│   │   └── migrations/         # PostgreSQL migrations
│   ├── src/
│   │   ├── controllers/        # HTTP request controllers
│   │   ├── lib/                # Database and shared backend setup
│   │   ├── middleware/         # Authentication and rate limiting
│   │   ├── routes/             # Express routes
│   │   ├── scripts/            # Database migration scripts
│   │   ├── services/           # Business logic and GitHub integration
│   │   ├── types/              # Backend TypeScript types
│   │   └── utils/              # Validation and helper functions
│   ├── tests/                  # Automated backend tests
│   ├── .env.example
│   └── package.json
│
├── .env.example
├── DEPLOYMENT.md
├── PROJECT_EXPLANATION.md
├── render.yaml
├── vercel.json
└── package.json
```

---

# Run Locally

## Prerequisites

Install or prepare:

* Node.js **22 or 24**
* npm
* PostgreSQL
* Git
* A GitHub account
* A GitHub OAuth App for authenticated features
* Redis optionally

Node.js 24 LTS is recommended.

Check your versions:

```bash
node --version
npm --version
git --version
```

Do not use Node.js 25 or 26 for this project.

---

## 1. Fork the Repository

Select **Fork** on GitHub and create a copy under your account.

Clone your fork:

```bash
git clone https://github.com/<your-github-username>/IssuePilot.git
cd IssuePilot
```

Add the original repository as an upstream remote if you want to receive later updates:

```bash
git remote add upstream https://github.com/omicoded19/IssuePilot.git
git remote -v
```

---

## 2. Use a Supported Node Version

With `nvm`:

```bash
nvm install 24
nvm use 24
```

The repository also contains an `.nvmrc`, so you can use:

```bash
nvm use
```

---

## 3. Install Dependencies

Install frontend dependencies:

```bash
npm ci
```

Install backend dependencies:

```bash
npm --prefix server ci
```

Use `npm install` instead of `npm ci` only when intentionally changing dependencies.

---

## 4. Create the Environment Files

Create the frontend file:

```bash
cp .env.example .env
```

Create the backend file:

```bash
cp server/.env.example server/.env
```

---

## 5. Configure the Frontend

Add this to `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 6. Configure PostgreSQL

Create an empty PostgreSQL database named `issuepilot`.

You may use:

* local PostgreSQL,
* pgAdmin,
* Docker,
* Neon,
* Supabase PostgreSQL,
* or another PostgreSQL provider.

Example local connection:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/issuepilot
DATABASE_SSL=false
```

For hosted PostgreSQL databases that require TLS:

```env
DATABASE_SSL=true
```

You can also add `sslmode=require` to the connection URL when required by your provider.

---

## 7. Configure the Backend

Your `server/.env` should look like this:

```env
NODE_ENV=development

PORT=4000

CLIENT_URL=http://localhost:5173
ADDITIONAL_CLIENT_URLS=

DATABASE_URL=postgresql://postgres:your_password@localhost:5432/issuepilot
DATABASE_SSL=false

# Optional token for higher unauthenticated GitHub API limits
GITHUB_TOKEN=

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback

# Generate using: npm run auth:key
AUTH_ENCRYPTION_KEY=

# Optional Redis cache
REDIS_URL=
REDIS_CACHE_TTL_SECONDS=900
```

Never commit `.env` or `server/.env`.

---

# GitHub OAuth Setup

Every fork owner must create their own GitHub OAuth App. The original project's OAuth credentials cannot be reused by a fork.

## 1. Create an OAuth App

Open:

```text
GitHub
→ Settings
→ Developer settings
→ OAuth Apps
→ New OAuth App
```

Use these local-development values:

```text
Application name:
IssuePilot Local

Homepage URL:
http://localhost:5173

Authorization callback URL:
http://localhost:4000/api/auth/github/callback
```

Create the application and generate a client secret.

## 2. Add OAuth Credentials

Update `server/.env`:

```env
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
```

## 3. Generate the Encryption Key

Run:

```bash
npm run auth:key
```

Copy the generated value into:

```env
AUTH_ENCRYPTION_KEY=the_generated_value
```

Keep this value stable. Changing it invalidates previously encrypted OAuth tokens.

> Public repository and username analysis can still work without OAuth. Contribution workspaces, authenticated recommendations, pull-request tracking, account management, and user-specific analytics require GitHub sign-in.

---

## 8. Optional GitHub Personal Access Token

Unauthenticated GitHub API calls have lower rate limits.

You can create a GitHub personal access token and add it to:

```env
GITHUB_TOKEN=your_token
```

For public repository analysis, avoid granting unnecessary permissions.

Never expose this token in the frontend `.env`.

---

## 9. Optional Redis Setup

IssuePilot works without Redis. When Redis is unavailable, caching fails open and the main application continues using GitHub and PostgreSQL.

To run Redis locally on macOS:

```bash
brew install redis
brew services start redis
redis-cli ping
```

Expected result:

```text
PONG
```

Then configure:

```env
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL_SECONDS=900
```

Without Redis:

```env
REDIS_URL=
```

---

## 10. Apply Database Migrations

Run:

```bash
npm run db:migrate
```

Migrations are idempotent, so already-applied migrations are skipped safely.

---

## 11. Start the Application

Run the frontend and backend together:

```bash
npm run dev
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

Check backend health:

```bash
curl http://localhost:4000/api/health
```

You can also run each service separately:

```bash
npm run dev:client
```

```bash
npm run dev:server
```

---

## Environment Variables

### Frontend

| Variable            | Required | Description        |
| ------------------- | -------: | ------------------ |
| `VITE_API_BASE_URL` |      Yes | Express API origin |

### Backend

| Variable                     |  Required | Description                                 |
| ---------------------------- | --------: | ------------------------------------------- |
| `NODE_ENV`                   |       Yes | `development`, `test`, or `production`      |
| `PORT`                       |       Yes | Express server port                         |
| `CLIENT_URL`                 |       Yes | Main allowed frontend origin                |
| `ADDITIONAL_CLIENT_URLS`     |        No | Comma-separated additional frontend origins |
| `DATABASE_URL`               |       Yes | PostgreSQL connection URL                   |
| `DATABASE_SSL`               |       Yes | Enables PostgreSQL TLS                      |
| `GITHUB_TOKEN`               |        No | Optional token for higher GitHub API limits |
| `GITHUB_OAUTH_CLIENT_ID`     | For login | GitHub OAuth client ID                      |
| `GITHUB_OAUTH_CLIENT_SECRET` | For login | GitHub OAuth client secret                  |
| `GITHUB_OAUTH_CALLBACK_URL`  | For login | Backend OAuth callback URL                  |
| `AUTH_ENCRYPTION_KEY`        | For login | Stable key used to encrypt OAuth tokens     |
| `REDIS_URL`                  |        No | Redis or Redis-compatible URL               |
| `REDIS_CACHE_TTL_SECONDS`    |        No | Repository-cache lifetime in seconds        |

---

## Available Scripts

Run these from the repository root.

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Run frontend and backend together     |
| `npm run dev:client`   | Run the Vite frontend                 |
| `npm run dev:server`   | Run the Express backend               |
| `npm run build`        | Build frontend and backend            |
| `npm run build:client` | Build the React frontend              |
| `npm run build:server` | Compile the Express backend           |
| `npm run lint`         | Lint frontend source files            |
| `npm run test`         | Run backend automated tests           |
| `npm run db:migrate`   | Apply PostgreSQL migrations           |
| `npm run auth:key`     | Generate an OAuth encryption key      |
| `npm run preview`      | Preview the production frontend build |

---

## API Overview

### Health

```http
GET /api/health
```

Checks the API and database connection.

### Authentication

```http
GET  /api/auth/status
GET  /api/auth/github/start
GET  /api/auth/github/callback
GET  /api/auth/me
POST /api/auth/logout
```

### Repository Analysis

```http
POST /api/repositories/analyze
GET  /api/repositories/:owner/:repository
POST /api/repositories/:owner/:repository/reanalyze
GET  /api/repositories/:owner/:repository/issues
```

Example:

```bash
curl -X POST http://localhost:4000/api/repositories/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/appwrite/sdk-for-web"
  }'
```

### Developer Analysis

```http
POST /api/developers/analyze
GET  /api/developers/:username
```

### Recommendations

```http
POST /api/recommendations
GET  /api/recommendations/:username/latest
```

### Issue Intelligence and Workspaces

```http
POST  /api/issues/recommend
POST  /api/issues/workspace
GET   /api/issues/workspace/:username/:owner/:repository/:issueNumber
PATCH /api/issues/workspace/:workspaceId
```

### Pull Requests

```http
GET  /api/pull-requests/workspaces/:workspaceId
POST /api/pull-requests/workspaces/:workspaceId/sync
```

### Analytics

```http
GET /api/analytics/me
```

### Performance

```http
GET  /api/performance/me
POST /api/performance/benchmark
```

---

## Testing and Verification

Before committing or deploying, run:

```bash
npm run lint
npm run test
npm run build
```

The full build performs both:

```bash
npm run build:client
npm run build:server
```

Check Git changes:

```bash
git status
git diff --check
```

The current backend test suite covers areas including:

* analytics aggregation,
* OAuth cryptography,
* contribution-profile validation,
* technology detection,
* issue intelligence,
* performance calculations,
* pull-request tracking,
* recommendation scoring,
* repository analysis,
* and repository URL parsing.

---

# Deployment

The production architecture uses:

```text
Frontend   → Vercel
Backend    → Render
Database   → Neon PostgreSQL
Cache      → Upstash Redis
OAuth      → GitHub OAuth App
```

The repository already includes:

* `vercel.json`
* `render.yaml`
* `DEPLOYMENT.md`

## 1. Deploy PostgreSQL

Create a Neon PostgreSQL project and copy its direct connection URL.

Apply migrations:

```bash
DATABASE_URL="YOUR_NEON_DATABASE_URL" \
DATABASE_SSL=true \
npm run db:migrate
```

## 2. Deploy Redis

Create an Upstash Redis database and copy its TLS URL.

It commonly begins with:

```text
rediss://
```

Redis is optional, but recommended for caching and shared rate-limit state.

## 3. Deploy the Backend on Render

In Render:

```text
New
→ Blueprint
→ Connect your IssuePilot fork
→ Select main
→ Use render.yaml
```

Configure:

```env
NODE_ENV=production

DATABASE_URL=your_neon_database_url
DATABASE_SSL=true

REDIS_URL=your_upstash_redis_url
REDIS_CACHE_TTL_SECONDS=900

GITHUB_TOKEN=your_optional_github_token

CLIENT_URL=https://your-vercel-domain.vercel.app
ADDITIONAL_CLIENT_URLS=

GITHUB_OAUTH_CLIENT_ID=your_production_oauth_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_production_oauth_client_secret
GITHUB_OAUTH_CALLBACK_URL=https://your-render-service.onrender.com/api/auth/github/callback

AUTH_ENCRYPTION_KEY=your_stable_generated_key
```

The included Blueprint uses:

```text
Build command:
npm ci --include=dev && npm run build

Start command:
npm run db:migrate:prod && npm start

Health check:
/api/health
```

## 4. Create a Production GitHub OAuth App

Create another OAuth App for production.

Use:

```text
Homepage URL:
https://your-vercel-domain.vercel.app

Authorization callback URL:
https://your-render-service.onrender.com/api/auth/github/callback
```

The callback URL must match `GITHUB_OAUTH_CALLBACK_URL` exactly.

## 5. Deploy the Frontend on Vercel

Import your fork into Vercel.

Add:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Deploy the application.

After receiving the final Vercel URL:

1. update `CLIENT_URL` on Render,
2. update the GitHub OAuth Homepage URL,
3. confirm the callback URL,
4. redeploy the Render service,
5. redeploy Vercel if the API URL changed.

## 6. Production Verification

Test:

```text
GET https://your-render-service.onrender.com/api/health
```

Then verify:

* landing page loads,
* GitHub login completes,
* onboarding analyses the signed-in account,
* recommendations are generated,
* repository analysis works,
* issues load,
* workspaces persist,
* pull requests synchronise,
* analytics display stored user data,
* sign-out works,
* account export works,
* and account deletion requires confirmation.

### Cross-Domain OAuth Note

The Vercel frontend and Render backend use different domains. Browsers with strict third-party cookie blocking, especially private or Incognito windows, may interfere with session cookies.

For the most reliable production authentication, use related custom domains such as:

```text
app.yourdomain.com
api.yourdomain.com
```

---

## Troubleshooting

### The server reports a missing dependency

Example:

```text
Cannot find module path-to-regexp/dist/index.js
```

Use Node.js 24 and reinstall cleanly:

```bash
nvm install 24
nvm use 24

rm -rf node_modules server/node_modules

npm ci
npm --prefix server ci
```

Do not use Node.js 26 for this project.

---

### GitHub login returns to the sign-in page

Check that all four values match:

```text
Frontend URL
Render CLIENT_URL
GitHub OAuth Homepage URL
GitHub OAuth callback URL
```

The callback must be:

```text
https://your-render-service.onrender.com/api/auth/github/callback
```

Also verify:

```env
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK_URL=
AUTH_ENCRYPTION_KEY=
```

Try a normal browser window if strict private-window cookie blocking is enabled.

---

### The backend cannot connect to PostgreSQL

Confirm:

```env
DATABASE_URL=
DATABASE_SSL=
```

Hosted databases commonly require:

```env
DATABASE_SSL=true
```

Apply migrations again:

```bash
npm run db:migrate
```

---

### Tables or columns are missing

Run:

```bash
npm run db:migrate
```

Restart the server afterwards.

---

### Redis is unavailable

Redis is optional.

Leave this empty:

```env
REDIS_URL=
```

The main application should continue without shared caching.

---

### CORS error in the browser

Ensure the exact frontend origin is configured:

```env
CLIENT_URL=http://localhost:5173
```

For additional origins:

```env
ADDITIONAL_CLIENT_URLS=https://preview.example.com,https://app.example.com
```

Do not include paths or trailing routes.

---

### GitHub API rate limit reached

Add a GitHub token to the backend:

```env
GITHUB_TOKEN=your_token
```

Never add it to the frontend `.env`.

---

### The first deployed request is slow

A free Render service may need time to start after inactivity. Wait for the API health endpoint to respond, then retry the application.

---

### Port already in use

Check the process using the port:

```bash
lsof -i :4000
lsof -i :5173
```

Stop the conflicting process or change the configured port.

---

## Current Limitations

* Private-repository analysis is not enabled.
* Technology detection is deterministic and rule-based rather than AI-generated.
* Issue availability is an estimate and must be confirmed with maintainers.
* Suggested files are based on repository evidence and issue keywords, not deep recursive source-code analysis.
* Pull-request updates use authenticated snapshot synchronisation rather than GitHub webhooks.
* True event-driven updates for arbitrary repositories would require an installable GitHub App.
* Estimated research-time savings are labelled as estimates rather than universal performance claims.
* Strict cross-site cookie blocking may affect OAuth on split-domain deployments.

---

## Contributing

Contributions are welcome.

### Contribution Workflow

1. Fork the repository.
2. Create a branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Run verification:

```bash
npm run lint
npm run test
npm run build
```

5. Commit:

```bash
git commit -m "Add your feature"
```

6. Push:

```bash
git push origin feature/your-feature-name
```

7. Open a pull request.

Please keep pull requests focused and describe:

* the problem,
* the implementation,
* the files changed,
* testing performed,
* and any screenshots for UI changes.

---

## Security

* Never commit environment files.
* Never expose OAuth secrets in frontend variables.
* Never expose `AUTH_ENCRYPTION_KEY`.
* Keep production and local OAuth Apps separate.
* Use least-privilege GitHub tokens.
* Rotate any secret that is accidentally exposed.
* Use HTTPS for production frontend, backend, database, and Redis connections.

Security issues should not be reported with secrets or private data in public GitHub issues.

---

## Author

**Omdeep Masram**

* GitHub: [@omicoded19](https://github.com/omicoded19)
* LinkedIn: [Omdeep Masram](https://www.linkedin.com/in/omdeep-masram-6a4200324/)
* Email: [omimasram@gmail.com](mailto:omimasram@gmail.com)

---

## Live Project

Visit IssuePilot:

### https://issue-pilot-beta.vercel.app

---

<p align="center">
  Built to make the first open-source contribution less confusing and more achievable.
</p>
```
