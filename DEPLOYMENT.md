# IssuePilot Production Deployment

This guide deploys the current split architecture:

- React/Vite frontend on Vercel
- Express API on Render
- PostgreSQL on Neon
- Redis-compatible cache on Upstash

Never commit `.env` files or paste production secrets into issues, screenshots, or chat messages.

## 1. Verify the project locally

Use a supported Node.js release (22 or 24):

```bash
node --version
npm ci
npm --prefix server ci
npm run lint
npm run test
npm run build
```

Apply local migrations when needed:

```bash
npm run db:migrate
```

## 2. Prepare hosted PostgreSQL

Create a Neon PostgreSQL database and copy its direct connection string. Keep it private.

Run all migrations against Neon before the first deployment:

```bash
DATABASE_URL="YOUR_DIRECT_NEON_URL" DATABASE_SSL=true npm run db:migrate
```

The migrations are idempotent. Render also runs the compiled migration command before every server start, so already-applied migrations are skipped safely.

## 3. Prepare hosted Redis

Create an Upstash Redis database near the Render service region. Copy its TLS connection URL, normally beginning with `rediss://`.

Test it without committing the URL:

```bash
redis-cli -u "YOUR_UPSTASH_REDIS_URL" ping
```

Expected output:

```text
PONG
```

## 4. Deploy the API with Render Blueprint

The repository root contains `render.yaml`.

In Render:

1. Choose **New → Blueprint**.
2. Connect the IssuePilot repository.
3. Select branch `main`.
4. Keep the Blueprint path as `render.yaml`.
5. Use a name such as `IssuePilot Production`.
6. Enter the requested secret environment values.

Required Render variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | Set by the Blueprint to `production` |
| `DATABASE_URL` | Direct Neon PostgreSQL connection string |
| `DATABASE_SSL` | Set by the Blueprint to `true` |
| `REDIS_URL` | Upstash `rediss://` URL |
| `REDIS_CACHE_TTL_SECONDS` | Set by the Blueprint to `900` |
| `GITHUB_TOKEN` | Optional GitHub token used for higher API limits |
| `CLIENT_URL` | Initially `http://localhost:5173`; replace with the final Vercel URL |
| `ADDITIONAL_CLIENT_URLS` | Optional comma-separated additional frontend origins; leave blank initially |
| `GITHUB_OAUTH_CLIENT_ID` | Production GitHub OAuth App client ID; can be added after the first API deploy |
| `GITHUB_OAUTH_CLIENT_SECRET` | Production GitHub OAuth App client secret |
| `GITHUB_OAUTH_CALLBACK_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api/auth/github/callback` |
| `AUTH_ENCRYPTION_KEY` | A stable random key generated with `npm run auth:key` |

The Blueprint builds the server, then starts it with:

```text
npm run db:migrate:prod && npm start
```

This prevents a new server version from starting against an outdated schema.

After deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

A healthy response reports PostgreSQL as connected and includes Redis status.

## 5. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel.

Recommended settings:

```text
Framework Preset: Vite
Root Directory: repository root
Build Command: npm run build:client
Output Directory: dist
Install Command: npm ci
```

Add this Vercel environment variable for Production (and Preview only when required):

```env
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Deploy the project. `vercel.json` rewrites browser routes to `index.html`, so refreshing routes such as `/analytics` or `/profile` continues to work.

## 6. Replace temporary frontend origins on Render

After Vercel gives the production URL, update Render:

```env
CLIENT_URL=https://YOUR-PROJECT.vercel.app
ADDITIONAL_CLIENT_URLS=
```

Do not include a trailing slash. Add a custom frontend domain to `ADDITIONAL_CLIENT_URLS` only when both domains must be accepted, for example:

```env
ADDITIONAL_CLIENT_URLS=https://issuepilot.example.com
```

Save the variables and redeploy the Render service.

## 7. Configure a production GitHub OAuth App

Use a separate GitHub OAuth App for production so local development can keep its localhost callback.

Production OAuth App values:

```text
Homepage URL: https://YOUR-PROJECT.vercel.app
Authorization callback URL: https://YOUR-RENDER-SERVICE.onrender.com/api/auth/github/callback
```

Copy the production client ID and secret into Render, set the same callback URL in `GITHUB_OAUTH_CALLBACK_URL`, and redeploy.

Do not store the OAuth client secret in Vercel. OAuth exchange happens only in the backend.

## 8. Production verification checklist

Verify these flows in order:

1. `GET /api/health` reports PostgreSQL connected.
2. Redis status is `connected` when `REDIS_URL` is configured.
3. The Vercel landing page loads.
4. Refreshing `/profile`, `/analytics`, and a repository route does not return 404.
5. Public GitHub profile analysis succeeds.
6. Repository analysis succeeds and persists to Neon.
7. A repeated analysis can use Redis.
8. GitHub sign-in returns to `/auth/callback` and shows the authenticated user.
9. Personalized recommendations and issue workspaces load.
10. Pull-request synchronization and user analytics load for the signed-in account.

## 9. Troubleshooting

### CORS error

Confirm that `CLIENT_URL` exactly matches the deployed frontend origin. Use `ADDITIONAL_CLIENT_URLS` for comma-separated extra origins. `ALLOWED_ORIGINS` is not an IssuePilot variable.

### OAuth state or login failure

Confirm all of these values match exactly:

- GitHub OAuth App callback URL
- Render `GITHUB_OAUTH_CALLBACK_URL`
- Render service URL and HTTPS scheme

Also verify `CLIENT_URL` points to the Vercel production origin.

### Database migration failure

Check the Render logs and verify:

- `DATABASE_URL` is the Neon connection string
- `DATABASE_SSL=true`
- the Neon database is active and reachable

### Redis unavailable

The application fails open when Redis is unavailable: repository analysis still works, but the cache and benchmark warm path do not. Verify the Upstash URL begins with `rediss://` and has not been truncated.

### Authentication cookies blocked

IssuePilot uses `HttpOnly`, `Secure`, `SameSite=None` cookies in production because frontend and API are on different origins. Browser privacy settings or extensions may block cross-site cookies. For the most robust production setup, place the frontend and API on related custom domains, such as `app.example.com` and `api.example.com`.
