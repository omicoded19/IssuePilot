import { randomUUID } from 'node:crypto'
import { pool } from '../lib/database.js'
import type { AuthUser, GitHubOAuthUser } from '../types/auth.js'
import { hashOpaqueToken } from '../utils/auth-crypto.js'

interface UpsertAuthUserInput {
  githubUser: GitHubOAuthUser
  email: string | null
  encryptedAccessToken: string
  accessTokenIv: string
  accessTokenAuthTag: string
}

interface AuthUserRow {
  id: string
  githubUserId: string
  username: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  email: string | null
  bio: string | null
  location: string | null
  company: string | null
  publicRepos: number
  followers: number
  following: number
  lastLoginAt: Date
}

interface StoredAuthUserRow extends AuthUserRow {
  encryptedAccessToken: string
  accessTokenIv: string
  accessTokenAuthTag: string
}

function mapAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    githubUserId: row.githubUserId,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    profileUrl: row.profileUrl,
    email: row.email,
    bio: row.bio,
    location: row.location,
    company: row.company,
    publicRepos: row.publicRepos,
    followers: row.followers,
    following: row.following,
    lastLoginAt: row.lastLoginAt.toISOString(),
  }
}

export async function upsertAuthUser(input: UpsertAuthUserInput): Promise<AuthUser> {
  const { githubUser } = input
  const result = await pool.query<AuthUserRow>(
    `
      INSERT INTO "AuthUser" (
        "id", "githubUserId", "username", "displayName", "avatarUrl",
        "profileUrl", "email", "bio", "location", "company", "publicRepos",
        "followers", "following", "encryptedAccessToken", "accessTokenIv",
        "accessTokenAuthTag", "lastLoginAt", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("githubUserId") DO UPDATE SET
        "username" = EXCLUDED."username",
        "displayName" = EXCLUDED."displayName",
        "avatarUrl" = EXCLUDED."avatarUrl",
        "profileUrl" = EXCLUDED."profileUrl",
        "email" = EXCLUDED."email",
        "bio" = EXCLUDED."bio",
        "location" = EXCLUDED."location",
        "company" = EXCLUDED."company",
        "publicRepos" = EXCLUDED."publicRepos",
        "followers" = EXCLUDED."followers",
        "following" = EXCLUDED."following",
        "encryptedAccessToken" = EXCLUDED."encryptedAccessToken",
        "accessTokenIv" = EXCLUDED."accessTokenIv",
        "accessTokenAuthTag" = EXCLUDED."accessTokenAuthTag",
        "lastLoginAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING
        "id", "githubUserId", "username", "displayName", "avatarUrl",
        "profileUrl", "email", "bio", "location", "company", "publicRepos",
        "followers", "following", "lastLoginAt"
    `,
    [
      randomUUID(),
      String(githubUser.id),
      githubUser.login,
      githubUser.name ?? githubUser.login,
      githubUser.avatar_url,
      githubUser.html_url,
      input.email,
      githubUser.bio,
      githubUser.location,
      githubUser.company,
      githubUser.public_repos,
      githubUser.followers,
      githubUser.following,
      input.encryptedAccessToken,
      input.accessTokenIv,
      input.accessTokenAuthTag,
    ],
  )

  const row = result.rows[0]
  if (!row) throw new Error('Auth user upsert returned no row.')
  return mapAuthUser(row)
}

export async function createAuthSession(input: {
  userId: string
  token: string
  expiresAt: Date
  userAgent: string | null
  ipAddress: string | null
}): Promise<void> {
  await pool.query('DELETE FROM "AuthSession" WHERE "expiresAt" <= CURRENT_TIMESTAMP')
  await pool.query(
    `
      INSERT INTO "AuthSession" (
        "id", "userId", "tokenHash", "expiresAt", "lastSeenAt",
        "userAgent", "ipAddress", "createdAt"
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, CURRENT_TIMESTAMP)
    `,
    [
      randomUUID(),
      input.userId,
      hashOpaqueToken(input.token),
      input.expiresAt,
      input.userAgent,
      input.ipAddress,
    ],
  )
}

export async function findAuthUserBySessionToken(
  token: string,
): Promise<AuthUser | null> {
  const tokenHash = hashOpaqueToken(token)

  const result = await pool.query<AuthUserRow>(
    `
      SELECT
        auth_user."id",
        auth_user."githubUserId",
        auth_user."username",
        auth_user."displayName",
        auth_user."avatarUrl",
        auth_user."profileUrl",
        auth_user."email",
        auth_user."bio",
        auth_user."location",
        auth_user."company",
        auth_user."publicRepos",
        auth_user."followers",
        auth_user."following",
        auth_user."lastLoginAt"
      FROM "AuthSession" AS auth_session
      INNER JOIN "AuthUser" AS auth_user
        ON auth_user."id" = auth_session."userId"
      WHERE auth_session."tokenHash" = $1
        AND auth_session."expiresAt" > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash],
  )

  const row = result.rows[0]

  if (!row) {
    return null
  }

  await pool.query(
    `
      UPDATE "AuthSession"
      SET "lastSeenAt" = CURRENT_TIMESTAMP
      WHERE "tokenHash" = $1
    `,
    [tokenHash],
  )

  return mapAuthUser(row)
}


export async function findStoredAuthUserBySessionToken(
  token: string,
): Promise<import('../types/auth.js').StoredAuthUser | null> {
  const tokenHash = hashOpaqueToken(token)
  const result = await pool.query<StoredAuthUserRow>(
    `
      SELECT
        auth_user."id", auth_user."githubUserId", auth_user."username", auth_user."displayName",
        auth_user."avatarUrl", auth_user."profileUrl", auth_user."email", auth_user."bio",
        auth_user."location", auth_user."company", auth_user."publicRepos", auth_user."followers",
        auth_user."following", auth_user."lastLoginAt", auth_user."encryptedAccessToken",
        auth_user."accessTokenIv", auth_user."accessTokenAuthTag"
      FROM "AuthSession" AS auth_session
      INNER JOIN "AuthUser" AS auth_user ON auth_user."id" = auth_session."userId"
      WHERE auth_session."tokenHash" = $1
        AND auth_session."expiresAt" > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash],
  )

  const row = result.rows[0]
  if (!row) return null

  await pool.query(
    'UPDATE "AuthSession" SET "lastSeenAt" = CURRENT_TIMESTAMP WHERE "tokenHash" = $1',
    [tokenHash],
  )

  return {
    ...mapAuthUser(row),
    encryptedAccessToken: row.encryptedAccessToken,
    accessTokenIv: row.accessTokenIv,
    accessTokenAuthTag: row.accessTokenAuthTag,
  }
}

export async function deleteAuthSession(token: string): Promise<void> {
  await pool.query('DELETE FROM "AuthSession" WHERE "tokenHash" = $1', [hashOpaqueToken(token)])
}
