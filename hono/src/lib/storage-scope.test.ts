import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ScriptFileInput } from '@shared/types/api.types'
import { isFileInScope, isOwnUploadKey } from './storage-scope'

const UUID = '123e4567-e89b-12d3-a456-426614174000'
const scope = { bucket: 'uni-bucket', keyPrefix: 'fac/study/subject/user-1' }
const file = (overrides: Partial<ScriptFileInput> = {}): ScriptFileInput => ({
  fileKey: `${scope.keyPrefix}/${UUID}.pdf`,
  fileType: 'pdf',
  fileSizeBytes: 100,
  bucket: scope.bucket,
  ...overrides,
})

test('accepts a file named the way finalize names it, in the caller scope', () => {
  assert.equal(isFileInScope(file(), scope), true)
})

test("rejects another user's key and a lookalike prefix", () => {
  assert.equal(
    isFileInScope(
      file({ fileKey: `fac/study/subject/user-2/${UUID}.pdf` }),
      scope
    ),
    false
  )
  assert.equal(
    isFileInScope(file({ fileKey: `fac/study/subject/user-10/${UUID}.pdf` }), {
      ...scope,
      keyPrefix: 'fac/study/subject/user-1',
    }),
    false
  )
})

test('rejects a bucket other than the resolved one', () => {
  assert.equal(isFileInScope(file({ bucket: 'someone-elses' }), scope), false)
})

test('rejects keys that nest, traverse, or are not uuid-named', () => {
  for (const fileKey of [
    `${scope.keyPrefix}/nested/${UUID}.pdf`,
    `${scope.keyPrefix}/../other/${UUID}.pdf`,
    `${scope.keyPrefix}/report.pdf`,
    `${scope.keyPrefix}/${UUID}`,
    `${scope.keyPrefix}//${UUID}.pdf`,
  ]) {
    assert.equal(isFileInScope(file({ fileKey }), scope), false, fileKey)
  }
})

test('rejects an extension that does not match the reported type', () => {
  assert.equal(isFileInScope(file({ fileType: 'png' }), scope), false)
})

test("an upload key is the caller's own only when their id sits right before the name", () => {
  for (const fileKey of [
    `fac/study/subject/user-1/${UUID}.pdf`,
    `user-1/${UUID}.webp`,
  ]) {
    assert.equal(isOwnUploadKey(fileKey, 'user-1'), true, fileKey)
  }
})

test("an upload key is never another user's, whatever else it contains", () => {
  for (const fileKey of [
    `fac/study/subject/user-2/${UUID}.pdf`,
    `user-10/${UUID}.pdf`,
    `user-1/nested/${UUID}.pdf`,
    `user-1/report.pdf`,
    `user-1/${UUID}`,
    `${UUID}.pdf`,
    'staging/user-2/x.pdf',
    '',
  ]) {
    assert.equal(isOwnUploadKey(fileKey, 'user-1'), false, fileKey)
  }
})
