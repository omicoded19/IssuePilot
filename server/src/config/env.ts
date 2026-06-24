import 'dotenv/config'
import { z } from 'zod'

const booleanString = z
  .string()
  .optional()
  .transform((value) => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  ADDITIONAL_CLIENT_URLS: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: booleanString,
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GITHUB_OAUTH_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:4000/api/auth/github/callback'),
  AUTH_ENCRYPTION_KEY: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid server environment:\n${details}`)
}

export const env = parsed.data

function parseAdditionalOrigins(value: string | undefined): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .filter((origin) => {
      try {
        return Boolean(new URL(origin))
      } catch {
        throw new Error(`Invalid URL in ADDITIONAL_CLIENT_URLS: ${origin}`)
      }
    })
}

export const allowedClientOrigins = Array.from(
  new Set([
    env.CLIENT_URL.replace(/\/$/, ''),
    ...parseAdditionalOrigins(env.ADDITIONAL_CLIENT_URLS),
  ]),
)
