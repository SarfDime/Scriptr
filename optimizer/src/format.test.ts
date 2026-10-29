import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeError, formatBytes, formatDuration } from './format'

test('formatBytes reads in B, KB and MB', () => {
  assert.equal(formatBytes(93), '93 B')
  assert.equal(formatBytes(1536), '1.5 KB')
  assert.equal(formatBytes(3.5 * 1024 * 1024), '3.50 MB')
  assert.equal(formatBytes(16 * 1024 * 1024 + 1), '16.00 MB')
})

test('formatDuration reads in ms and seconds', () => {
  assert.equal(formatDuration(480), '480ms')
  assert.equal(formatDuration(12_340), '12.3s')
})

test('describeError keeps a log line short', () => {
  assert.equal(describeError(new Error('boom')), 'boom')
  assert.equal(describeError('plain'), 'plain')
  assert.equal(describeError(new Error('x'.repeat(1000))).length, 300)
})
