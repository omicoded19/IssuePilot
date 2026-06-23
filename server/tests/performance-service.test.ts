import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calculateReductionPercent } from '../src/utils/performance.js'

describe('calculateReductionPercent', () => {
  it('calculates a positive latency reduction', () => {
    assert.equal(calculateReductionPercent(1000, 250), 75)
  })

  it('returns zero for an invalid baseline', () => {
    assert.equal(calculateReductionPercent(0, 20), 0)
  })

  it('preserves a negative result when the warm request is slower', () => {
    assert.equal(calculateReductionPercent(100, 125), -25)
  })

  it('rounds to two decimal places', () => {
    assert.equal(calculateReductionPercent(300, 100), 66.67)
  })
})
