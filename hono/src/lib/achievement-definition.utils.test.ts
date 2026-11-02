import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ACHIEVEMENT_THRESHOLD_MAX,
  isValidAchievementId,
  isValidAchievementThreshold,
} from '../../../shared/utils/achievement-definition.utils'

/** The API and the admin form share these, so they must keep matching the
 * `.sql` CHECK constraints on `achievement_definitions`. Title and description
 * are not editable through the API (`ACHIEVEMENT_COPY` owns them), so their
 * length caps are covered by `achievement-copy.test.ts`. */
describe('achievement definition validation', () => {
  describe('id', () => {
    it('accepts lowercase snake_case between 2 and 60 characters', () => {
      assert.equal(isValidAchievementId('first_upload'), true)
      assert.equal(isValidAchievementId('ab'), true)
      assert.equal(isValidAchievementId('a'.repeat(60)), true)
    })

    it('rejects anything the DB CHECK rejects', () => {
      assert.equal(isValidAchievementId('a'), false)
      assert.equal(isValidAchievementId('a'.repeat(61)), false)
      assert.equal(isValidAchievementId('First_Upload'), false)
      assert.equal(isValidAchievementId('first-upload'), false)
      assert.equal(isValidAchievementId('first upload'), false)
      assert.equal(isValidAchievementId(''), false)
    })

    it('rejects non-strings', () => {
      assert.equal(isValidAchievementId(null), false)
      assert.equal(isValidAchievementId(42), false)
      assert.equal(isValidAchievementId({}), false)
    })
  })

  describe('threshold', () => {
    it('accepts whole numbers above zero', () => {
      assert.equal(isValidAchievementThreshold(1), true)
      assert.equal(isValidAchievementThreshold(ACHIEVEMENT_THRESHOLD_MAX), true)
    })

    it('rejects zero, negatives, fractions and non-numbers', () => {
      assert.equal(isValidAchievementThreshold(0), false)
      assert.equal(isValidAchievementThreshold(-1), false)
      assert.equal(isValidAchievementThreshold(1.5), false)
      assert.equal(isValidAchievementThreshold(Number.NaN), false)
      assert.equal(isValidAchievementThreshold(Number.POSITIVE_INFINITY), false)
      // Past int4, the insert fails with 22003 instead of a clean 400.
      assert.equal(
        isValidAchievementThreshold(ACHIEVEMENT_THRESHOLD_MAX + 1),
        false
      )
      assert.equal(isValidAchievementThreshold('10'), false)
    })
  })
})
