import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { AppError } from './app-error.js'

const ALGORITHM = 'aes-256-gcm'

function decodeEncryptionKey(value: string): Buffer {
  const trimmed = value.trim()
  const candidate = /^[a-f\d]{64}$/i.test(trimmed)
    ? Buffer.from(trimmed, 'hex')
    : Buffer.from(trimmed, 'base64')

  if (candidate.length !== 32) {
    throw new AppError(
      500,
      'INVALID_AUTH_ENCRYPTION_KEY',
      'AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.',
    )
  }

  return candidate
}

export function encryptSecret(
  value: string,
  encryptionKey: string,
): { encryptedValue: string; iv: string; authTag: string } {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, decodeEncryptionKey(encryptionKey), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return {
    encryptedValue: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

export function decryptSecret(
  encryptedValue: string,
  iv: string,
  authTag: string,
  encryptionKey: string,
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    decodeEncryptionKey(encryptionKey),
    Buffer.from(iv, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export function createOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function safeTokenEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
