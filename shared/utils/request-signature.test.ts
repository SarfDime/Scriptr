import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesSecret } from './request-signature'

const SECRET = 'a-shared-secret'

test('accepts the exact secret', async () => {
  assert.equal(await matchesSecret(SECRET, SECRET), true)
})

test('rejects a different value of any length', async () => {
  assert.equal(await matchesSecret('a-shared-secre', SECRET), false)
  assert.equal(await matchesSecret(`${SECRET}x`, SECRET), false)
  assert.equal(await matchesSecret('completely-different', SECRET), false)
})

test('rejects a missing header', async () => {
  assert.equal(await matchesSecret(null, SECRET), false)
  assert.equal(await matchesSecret('', SECRET), false)
})

test('never matches an empty presented value', async () => {
  assert.equal(await matchesSecret('', ''), false)
  assert.equal(await matchesSecret('anything', ''), false)
})
