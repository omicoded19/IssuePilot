import cors from 'cors'
import express from 'express'
import { allowedClientOrigins, env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { healthRouter } from './routes/health-routes.js'
import { repositoryRouter } from './routes/repository-routes.js'
import { developerProfileRouter } from './routes/developer-profile-routes.js'
import { recommendationRouter } from './routes/recommendation-routes.js'
import { issueIntelligenceRouter } from './routes/issue-intelligence-routes.js'
import { authRouter } from './routes/auth-routes.js'
import { pullRequestRouter } from './routes/pull-request-routes.js'
import { analyticsRouter } from './routes/analytics-routes.js'
import { performanceRouter } from './routes/performance-routes.js'

export const app = express()

app.disable('x-powered-by')

// Render and similar platforms terminate TLS before forwarding requests to Node.
// Trusting the first proxy lets Express correctly identify secure production requests.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}

app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include health checks and server-to-server calls.
      if (!origin || allowedClientOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by IssuePilot CORS.`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Welcome to the IssuePilot API',
  })
})
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/repositories', repositoryRouter)
app.use('/api/developers', developerProfileRouter)
app.use('/api/recommendations', recommendationRouter)
app.use('/api/issues', issueIntelligenceRouter)
app.use('/api/pull-requests', pullRequestRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/performance', performanceRouter)
app.use(notFound)
app.use(errorHandler)
