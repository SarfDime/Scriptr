import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mergeProfilePreferences,
  readStoredProfilePreferences,
  validateProfilePreferences,
} from './profile-preferences'

test('validates the versioned preferences shape', () => {
  assert.deepEqual(
    validateProfilePreferences({
      version: 1,
      notifications: { toasts: false, achievements: 'hide' },
    }),
    {
      version: 1,
      notifications: { toasts: false, achievements: 'hide' },
    }
  )
  assert.equal(
    validateProfilePreferences({
      version: 1,
      notifications: { toasts: false, achievements: 'hide', future: true },
    }),
    null
  )
})

test('reads an empty stored object without applying a default', () => {
  assert.deepEqual(readStoredProfilePreferences({}), {})
})

test('merges a partial update with defaults or existing preferences', () => {
  assert.deepEqual(
    mergeProfilePreferences(
      {},
      { version: 1, notifications: { toasts: false } }
    ),
    {
      version: 1,
      notifications: { toasts: false, achievements: 'show' },
    }
  )
  assert.deepEqual(
    mergeProfilePreferences(
      { version: 1, notifications: { toasts: false, achievements: 'hide' } },
      { notifications: { toasts: true } }
    ),
    {
      version: 1,
      notifications: { toasts: true, achievements: 'hide' },
    }
  )
})

test('rejects invalid patches and malformed stored preferences', () => {
  assert.equal(mergeProfilePreferences({}, { version: 2 }), null)
  assert.equal(
    mergeProfilePreferences({}, { notifications: { toasts: 'false' } }),
    null
  )
  assert.equal(
    mergeProfilePreferences({}, { notifications: { other: true } }),
    null
  )
  assert.equal(
    mergeProfilePreferences(
      { version: 1, unknown: true },
      { notifications: { toasts: true } }
    ),
    null
  )
})
