import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseRepositoryUrl } from '../src/utils/repository-url.js'

const expected = { owner: 'appwrite', repository: 'sdk-for-web' }

describe('parseRepositoryUrl', () => {
  for (const input of [
    'https://github.com/appwrite/sdk-for-web',
    'https://github.com/appwrite/sdk-for-web/',
    'github.com/appwrite/sdk-for-web',
    'appwrite/sdk-for-web',
    'https://github.com/appwrite/sdk-for-web.git',
  ]) {
    it(`parses ${input}`, () => {
      assert.deepEqual(parseRepositoryUrl(input), expected)
    })
  }

  for (const input of [
    'https://gitlab.com/appwrite/sdk-for-web',
    'https://github.com/appwrite',
    'https://github.com/appwrite/sdk-for-web/issues/12',
    'https://github.com/appwrite/sdk-for-web/pull/12',
    'https://github.com//sdk-for-web',
    '',
  ]) {
    it(`rejects ${input || 'empty input'}`, () => {
      assert.throws(() => parseRepositoryUrl(input))
    })
  }
})
