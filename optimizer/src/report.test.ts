import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeOutcome } from './report'
import { DEFAULT_LIMITS } from './types'

const MIB = 1024 * 1024

test('describes a success: what was done, the sizes, and every step tried', () => {
  const { level, message } = describeOutcome({
    declaredType: 'pdf',
    result: {
      ok: true,
      file: {
        fileKey: 'u/k.pdf',
        fileType: 'pdf',
        fileSizeBytes: Math.round(2.9 * MIB),
        bucket: 'b',
      },
    },
    summary: {
      inputBytes: 16 * MIB,
      operation: 'gs /screen',
      attempts: [
        { step: 'gs /ebook', bytes: 8 * MIB, ms: 20_000 },
        { step: 'gs /screen', bytes: Math.round(2.9 * MIB), ms: 19_000 },
      ],
    },
    durationMs: 41_000,
    limits: DEFAULT_LIMITS,
  })

  assert.equal(level, 'success')
  assert.match(message, /^pdf -> pdf: 16\.00 MB -> 2\.90 MB \(-82%\)/)
  assert.match(message, /via gs \/screen in 41\.0s/)
  assert.match(
    message,
    /\[gs \/ebook 8\.00 MB in 20\.0s, gs \/screen 2\.90 MB in 19\.0s\]/
  )
  assert.match(message, /-> u\/k\.pdf$/)
})

test('shows a conversion, such as an image becoming webp', () => {
  const { message } = describeOutcome({
    declaredType: 'jpg',
    result: {
      ok: true,
      file: {
        fileKey: 'u/k.webp',
        fileType: 'webp',
        fileSizeBytes: 300_000,
        bucket: 'b',
      },
    },
    summary: { inputBytes: 2_000_000, operation: 'webp q80 max 2400px' },
    durationMs: 480,
    limits: DEFAULT_LIMITS,
  })

  assert.match(message, /^jpg -> webp: /)
  assert.match(message, /via webp q80 max 2400px in 480ms/)
})

test('describes a too-large rejection with the best size reached and the cap', () => {
  const { level, message } = describeOutcome({
    declaredType: 'pdf',
    result: {
      ok: false,
      reason: 'too-large',
      sizeBytes: Math.round(4.2 * MIB),
    },
    summary: {
      detail: 'smallest was gs /screen',
      attempts: [
        { step: 'gs /screen', bytes: Math.round(4.2 * MIB), ms: 9000 },
      ],
    },
    durationMs: 9500,
    limits: DEFAULT_LIMITS,
  })

  assert.equal(level, 'warn')
  assert.match(
    message,
    /^pdf rejected as too-large \(best 4\.20 MB, cap 3\.50 MB\)/
  )
  assert.match(message, /: smallest was gs \/screen after 9\.5s/)
  assert.match(message, /\[gs \/screen 4\.20 MB in 9\.0s\]$/)
})

test('describes a failure with the reason it gave', () => {
  const { level, message } = describeOutcome({
    declaredType: 'pdf',
    result: { ok: false, reason: 'failed' },
    summary: { detail: 'deadline passed before gs /screen' },
    durationMs: 80_100,
    limits: DEFAULT_LIMITS,
  })

  assert.equal(level, 'warn')
  assert.equal(
    message,
    'pdf rejected as failed: deadline passed before gs /screen after 80.1s'
  )
})

test('describes a rejection that has nothing more to say', () => {
  const { message } = describeOutcome({
    declaredType: 'png',
    result: { ok: false, reason: 'missing' },
    summary: {},
    durationMs: 12,
    limits: DEFAULT_LIMITS,
  })

  assert.equal(message, 'png rejected as missing after 12ms')
})
