import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  generateContributionWorkspace,
  generateIssueRecommendations,
  loadContributionWorkspace,
  saveContributionWorkspaceProgress,
} from '../services/issue-intelligence-service.js'
import type {
  ContributionWorkspaceRequest,
  ContributionWorkspaceUpdate,
  IssueRecommendationRequest,
} from '../types/issue-intelligence.js'
import { requireAuthenticatedGitHubContext } from '../services/auth-context-service.js'
import { AppError } from '../utils/app-error.js'
import { assertAuthenticatedUsername } from '../utils/auth-ownership.js'

const githubUsername = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(/^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/, 'Enter a valid GitHub username.')

const repositorySegment = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/, 'Enter a valid GitHub repository segment.')

const skillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  wantToLearn: z.boolean(),
})

const availabilitySchema = z.object({
  hoursPerWeek: z.number().int().min(1).max(80),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  repositorySize: z.enum(['Small', 'Medium', 'Large']),
  organizationType: z.enum(['Startup', 'Foundation', 'Community', 'Enterprise']),
})

const issueProfileSchema = z.object({
  owner: repositorySegment,
  repository: repositorySegment,
  username: githubUsername,
  skills: z.array(skillSchema).min(1).max(40),
  contributionPreferences: z.array(z.string().trim().min(1).max(60)).max(20),
  availability: availabilitySchema,
})

export const issueRecommendationBodySchema = issueProfileSchema
export const workspaceBodySchema = issueProfileSchema.extend({
  issueNumber: z.number().int().positive(),
})

const progressStepSchema = z.object({
  id: z.enum([
    'repository-analysed',
    'issue-selected',
    'maintainer-contacted',
    'repository-forked',
    'branch-created',
    'change-implemented',
    'tests-passed',
    'pull-request-opened',
    'review-received',
    'merged',
  ]),
  label: z.string().trim().min(1).max(100),
  completed: z.boolean(),
})

export const workspaceUpdateBodySchema = z.object({
  progress: z.array(progressStepSchema).length(10),
  personalNotes: z.string().max(20_000),
})

function requiredParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== 'string' || !value) {
    throw new AppError(400, 'INVALID_ROUTE_PARAMETER', `Missing ${name} route parameter.`)
  }
  return value
}

export const recommendIssues: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const body = response.locals.validatedBody as IssueRecommendationRequest
  assertAuthenticatedUsername(body.username, user.username)
  const recommendations = await generateIssueRecommendations({ ...body, username: user.username })
  response.status(201).json({ success: true, data: recommendations })
}

export const createWorkspace: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const body = response.locals.validatedBody as ContributionWorkspaceRequest
  assertAuthenticatedUsername(body.username, user.username)
  const workspace = await generateContributionWorkspace({ ...body, username: user.username })
  response.status(201).json({ success: true, data: workspace })
}

export const getWorkspace: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const username = requiredParam(request.params.username, 'username')
  const owner = requiredParam(request.params.owner, 'owner')
  const repository = requiredParam(request.params.repository, 'repository')
  const issueNumber = z.coerce.number().int().positive().safeParse(request.params.issueNumber)
  if (!issueNumber.success) {
    throw new AppError(400, 'INVALID_ISSUE_NUMBER', 'Enter a valid issue number.')
  }

  assertAuthenticatedUsername(username, user.username)
  const workspace = await loadContributionWorkspace(
    user.username,
    owner,
    repository,
    issueNumber.data,
  )
  if (!workspace) {
    throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'No saved workspace was found for this issue.')
  }
  response.json({ success: true, data: workspace })
}

export const updateWorkspace: RequestHandler = async (request, response) => {
  const { user } = await requireAuthenticatedGitHubContext(request)
  const workspaceId = requiredParam(request.params.workspaceId, 'workspace ID')
  const body = response.locals.validatedBody as ContributionWorkspaceUpdate
  const workspace = await saveContributionWorkspaceProgress(workspaceId, user.username, body)
  response.json({ success: true, data: workspace })
}
