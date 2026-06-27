# IssuePilot

A full-stack platform that helps developers discover suitable open-source repositories, find contribution-ready issues, create contribution workspaces, and track pull requests.

[Live Demo](https://issue-pilot-beta.vercel.app) · [GitHub Repository](https://github.com/omicoded19/IssuePilot)

## Features

* GitHub OAuth authentication
* GitHub profile and skill analysis
* Repository and organization recommendations
* Issue ranking using skill match, difficulty, freshness, and repository activity
* Repository technology and contribution-readiness analysis
* Persistent contribution workspaces
* Pull-request tracking for open, merged, closed, and changes-requested states
* Contribution dashboard and analytics
* PostgreSQL persistence and Redis-backed caching
* Responsive desktop and mobile interface
* Automated backend tests

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Recharts

**Backend:** Node.js, Express.js, TypeScript, PostgreSQL, Redis

**APIs and Services:** GitHub REST API, GitHub OAuth, Neon, Upstash, Render, Vercel

## How It Works

1. Sign in with GitHub.
2. Analyse your GitHub profile.
3. Review detected skills and contribution preferences.
4. Generate personalised repository recommendations.
5. Explore ranked issues and repository insights.
6. Create a contribution workspace.
7. Open a pull request on GitHub.
8. Track reviews, requested changes, closure, and merge status.

## Run Locally

### Prerequisites

* Node.js 24
* npm
* PostgreSQL
* GitHub OAuth App
* Redis is optional

### 1. Clone the Repository

```bash
git clone https://github.com/omicoded19/IssuePilot.git
cd IssuePilot
```

For a fork:

```bash
git clone https://github.com/YOUR_USERNAME/IssuePilot.git
cd IssuePilot
```

### 2. Install Dependencies

```bash
npm ci
npm --prefix server ci
```

### 3. Configure Environment Variables

Create the frontend environment file:

```bash
cp .env.example .env
```

Add:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

Configure `server/.env`:

```env
NODE_ENV=development
PORT=4000

CLIENT_URL=http://localhost:5173
ADDITIONAL_CLIENT_URLS=

DATABASE_URL=postgresql://postgres:password@localhost:5432/issuepilot
DATABASE_SSL=false

GITHUB_TOKEN=

GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback

AUTH_ENCRYPTION_KEY=

REDIS_URL=
REDIS_CACHE_TTL_SECONDS=900
```

Generate the encryption key:

```bash
npm run auth:key
```

Copy the generated value into `AUTH_ENCRYPTION_KEY`.

### 4. Create a GitHub OAuth App

Go to:

```text
GitHub → Settings → Developer settings → OAuth Apps
```

Use:

```text
Homepage URL:
http://localhost:5173

Authorization callback URL:
http://localhost:4000/api/auth/github/callback
```

Add the generated client ID and secret to `server/.env`.

Each fork owner must create their own GitHub OAuth App.

### 5. Apply Database Migrations

```bash
npm run db:migrate
```

### 6. Start IssuePilot

```bash
npm run dev
```

Open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

## Available Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:migrate
npm run auth:key
```

Before committing changes, run:

```bash
npm run lint
npm run test
npm run build
```

## Deployment

The deployed architecture uses:

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** Neon PostgreSQL
* **Cache:** Upstash Redis

Production frontend environment:

```env
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND_URL
```

Production backend environment:

```env
NODE_ENV=production
CLIENT_URL=https://YOUR_VERCEL_URL

DATABASE_URL=YOUR_DATABASE_URL
DATABASE_SSL=true

REDIS_URL=YOUR_REDIS_URL

GITHUB_OAUTH_CLIENT_ID=YOUR_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET=YOUR_CLIENT_SECRET
GITHUB_OAUTH_CALLBACK_URL=https://YOUR_RENDER_BACKEND_URL/api/auth/github/callback

AUTH_ENCRYPTION_KEY=YOUR_STABLE_ENCRYPTION_KEY
```

Update the production GitHub OAuth App with the deployed homepage and callback URLs.

## Notes

* Redis is optional; the main application can run without it.
* Private repository analysis is not currently supported.
* Issue availability is estimated and should still be confirmed with maintainers.
* Free Render services may take time to wake up after inactivity.
* OAuth may be less reliable in Incognito mode because of strict cross-site cookie blocking.

## Author

**Omdeep Masram**

* [GitHub](https://github.com/omicoded19)
* [LinkedIn](https://www.linkedin.com/in/omdeep-masram-6a4200324/)
* [Email](mailto:omimasram@gmail.com)
