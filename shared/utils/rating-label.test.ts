import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isLocalizedRatingLabel,
  resolveRatingLabel,
  trimRatingLabel,
} from './rating-label.utils'

test('a criterion name is accepted in one language or in both', () => {
  assert.equal(isLocalizedRatingLabel({ mk: 'Тежина' }), true)
  assert.equal(isLocalizedRatingLabel({ en: 'Difficulty', mk: 'Тежина' }), true)
  assert.equal(isLocalizedRatingLabel({ en: '  Difficulty  ' }), true)
})

test('anything the reader could not resolve is rejected', () => {
  assert.equal(isLocalizedRatingLabel({}), false)
  assert.equal(isLocalizedRatingLabel('Difficulty'), false)
  assert.equal(isLocalizedRatingLabel(null), false)
  assert.equal(isLocalizedRatingLabel(['Difficulty']), false)
  assert.equal(isLocalizedRatingLabel({ sr: 'Tezina' }), false)
  assert.equal(isLocalizedRatingLabel({ en: 'D' }), false)
  assert.equal(isLocalizedRatingLabel({ en: 'D'.repeat(61) }), false)
  assert.equal(isLocalizedRatingLabel({ en: 5 }), false)
  // The length rule counts what is stored, not the padding around it.
  assert.equal(isLocalizedRatingLabel({ en: '  D  ' }), false)
})

test('storing a name trims it and keeps only the languages sent', () => {
  assert.deepEqual(trimRatingLabel({ en: '  Difficulty ' }), {
    en: 'Difficulty',
  })
  assert.deepEqual(trimRatingLabel({ en: 'Difficulty', mk: ' Тежина' }), {
    en: 'Difficulty',
    mk: 'Тежина',
  })
})

test("a name renders in the reader's language, else the default one", () => {
  const labels = { en: 'Difficulty', mk: 'Тежина' }
  assert.equal(resolveRatingLabel(labels, 'mk'), 'Тежина')
  assert.equal(resolveRatingLabel({ en: 'Difficulty' }, 'mk'), 'Difficulty')
  assert.equal(resolveRatingLabel(null, 'en'), '')
})
