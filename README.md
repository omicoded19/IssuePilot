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

Organization recommendations, global analytics, onboarding, and pull-request tracking still use demo data. They are intentionally separated from the real repository-analysis workflow.

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
- An optional GitHub personal access token for a higher API rate limit

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
```

For a hosted PostgreSQL connection that requires TLS, set `DATABASE_SSL=true` or include `sslmode=require` in the connection URL.

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

## Verification commands

```bash
npm run lint
npm run test
npm run build
```

## Important limitations

- GitHub login and private-repository access are not implemented.
- Deep recursive source-code analysis is not implemented.
- Technology detection is rule-based, not AI-generated.
- Issue availability is an estimate and must be confirmed with maintainers.
- Organization recommendations and global analytics still use demo data.
- Pull-request status tracking and webhooks are not implemented.
- Redis caching, background queues, semantic matching, and AI explanations are future phases.

## Next development phase

The next useful feature is GitHub OAuth plus developer-skill extraction. That will allow IssuePilot to compare a user profile against repository technologies and replace generic readiness scores with personalized organization, repository, and issue match scores.

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
