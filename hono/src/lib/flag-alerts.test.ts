import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldAlertAtThreshold } from './flag-alerts'

test('alerts only when the distinct reporter count first reaches five', () => {
  assert.equal(shouldAlertAtThreshold(4), false)
  assert.equal(shouldAlertAtThreshold(5), true)
  assert.equal(shouldAlertAtThreshold(6), false)
})
