import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { contributionProfileBodySchema } from '../src/schemas/contribution-profile-schema.js'

describe('contribution profile validation', () => {
  it('accepts manually added skills and recommendation preferences', () => {
    const result = contributionProfileBodySchema.safeParse({
      skills: [
        { name: 'Rust', proficiency: 'Beginner', wantToLearn: true },
        { name: 'React', proficiency: 'Intermediate', wantToLearn: false },
      ],
      contributionPreferences: ['Backend', 'Bug fixes'],
      availability: {
        hoursPerWeek: 8,
        difficulty: 'Intermediate',
        repositorySize: 'Medium',
        organizationType: 'Community',
      },
      onboardingComplete: true,
    })

    assert.equal(result.success, true)
  })

  it('rejects empty skill names and unrealistic availability', () => {
    const result = contributionProfileBodySchema.safeParse({
      skills: [{ name: ' ', proficiency: 'Beginner', wantToLearn: false }],
      contributionPreferences: [],
      availability: {
        hoursPerWeek: 200,
        difficulty: 'Beginner',
        repositorySize: 'Small',
        organizationType: 'Community',
      },
      onboardingComplete: false,
    })

    assert.equal(result.success, false)
  })
})
