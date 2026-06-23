import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { healthRouter } from './routes/health-routes.js'
import { repositoryRouter } from './routes/repository-routes.js'
import { developerProfileRouter } from './routes/developer-profile-routes.js'
import { recommendationRouter } from './routes/recommendation-routes.js'
import { issueIntelligenceRouter } from './routes/issue-intelligence-routes.js'
import { authRouter } from './routes/auth-routes.js'
import { pullRequestRouter } from './routes/pull-request-routes.js'

export const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: env.CLIENT_URL,
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
app.use(notFound)
app.use(errorHandler)
