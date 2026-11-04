import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isDestinationKeyBase,
  isSafeBucketName,
  isSafeObjectKey,
  isStagingKey,
} from './object-key'

const UUID = '223e4567-e89b-12d3-a456-426614174000'

test('accepts the key shapes the API actually mints', () => {
  assert.equal(isStagingKey(`staging/${UUID}/${UUID}.pdf`), true)
  assert.equal(isDestinationKeyBase(`avatars/${UUID}`), true)
  assert.equal(isDestinationKeyBase(`${UUID}/${UUID}`), true)
  assert.equal(
    isDestinationKeyBase(`faculty/${UUID}/study/${UUID}/${UUID}`),
    true
  )
})

test('rejects traversal, empty segments and absolute keys', () => {
  for (const key of [
    '../etc/passwd',
    'a//b',
    '/leading',
    'trailing/',
    '.',
    '..',
  ]) {
    assert.equal(isSafeObjectKey(key), false, key)
  }
})

test('rejects staging keys outside the staging prefix or with a bad id', () => {
  assert.equal(isStagingKey(`avatars/${UUID}/${UUID}.pdf`), false)
  assert.equal(isStagingKey('staging/user/not-a-uuid.pdf'), false)
  assert.equal(isStagingKey(`staging/${UUID}/${UUID}`), false)
})

test('rejects destination bases that do not end in an id', () => {
  assert.equal(isDestinationKeyBase('index.html'), false)
  assert.equal(isDestinationKeyBase(`avatars/${UUID}/index.html`), false)
  assert.equal(isDestinationKeyBase(`avatars/${UUID}`), true)
})

test('rejects keys longer than the store allows', () => {
  assert.equal(isSafeObjectKey(`${'a/'.repeat(300)}b`), false)
})

test('bucket names follow the R2/S3 rules', () => {
  assert.equal(isSafeBucketName('scriptr-files'), true)
  assert.equal(isSafeBucketName('abc'), true)
  assert.equal(isSafeBucketName('ab'), false)
  assert.equal(isSafeBucketName('Upper-case'), false)
  assert.equal(isSafeBucketName('-leading'), false)
  assert.equal(isSafeBucketName('trailing-'), false)
})
