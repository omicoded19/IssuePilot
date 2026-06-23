import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createOpaqueToken,
  decryptSecret,
  encryptSecret,
  hashOpaqueToken,
  safeTokenEquals,
} from '../src/utils/auth-crypto.js'

describe('auth crypto helpers', () => {
  const key = Buffer.alloc(32, 7).toString('base64')

  it('encrypts and decrypts an OAuth token', () => {
    const encrypted = encryptSecret('github-access-token', key)
    assert.notEqual(encrypted.encryptedValue, 'github-access-token')
    assert.equal(
      decryptSecret(encrypted.encryptedValue, encrypted.iv, encrypted.authTag, key),
      'github-access-token',
    )
  })

  it('creates random opaque tokens and stable hashes', () => {
    const token = createOpaqueToken()
    assert.ok(token.length >= 40)
    assert.equal(hashOpaqueToken(token), hashOpaqueToken(token))
    assert.notEqual(hashOpaqueToken(token), hashOpaqueToken(`${token}x`))
  })

  it('compares OAuth state values safely', () => {
    assert.equal(safeTokenEquals('same-state', 'same-state'), true)
    assert.equal(safeTokenEquals('same-state', 'other-state'), false)
  })
})
