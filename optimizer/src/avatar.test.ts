import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AVATAR_SIZE_PX } from '@shared/config/avatar'
import sharp from 'sharp'
import { AVATAR_LIMITS, optimizeAvatar } from './avatar'
import { assertAccepted, assertRejected } from './test-helpers'
import type { SizeLimits } from './types'

const context = (limits: SizeLimits = AVATAR_LIMITS) => ({
  deadline: Number.MAX_SAFE_INTEGER,
  limits,
})

const noise = (width: number, height: number) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: 'gaussian', mean: 128, sigma: 50 },
    },
  })

test('crops any picture to a square avatar and stores it as WebP', async () => {
  for (const [width, height] of [
    [4000, 3000],
    [600, 1800],
    [100, 100],
  ] as const) {
    const input = await noise(width, height).jpeg().toBuffer()

    const outcome = await optimizeAvatar(input, 'jpg', context())

    assertAccepted(outcome)
    assert.equal(outcome.fileType, 'webp')
    const metadata = await sharp(outcome.bytes).metadata()
    assert.deepEqual(
      [metadata.format, metadata.width, metadata.height],
      ['webp', AVATAR_SIZE_PX, AVATAR_SIZE_PX]
    )
  }
})

test('applies the EXIF orientation and drops the metadata', async () => {
  const input = await noise(400, 200)
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer()

  const outcome = await optimizeAvatar(input, 'jpg', context())

  assertAccepted(outcome)
  assert.equal((await sharp(outcome.bytes).metadata()).exif, undefined)
})

test('keeps a transparent PNG transparent', async () => {
  const input = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.4 },
    },
  })
    .png()
    .toBuffer()

  const outcome = await optimizeAvatar(input, 'png', context())

  assertAccepted(outcome)
  assert.equal((await sharp(outcome.bytes).metadata()).hasAlpha, true)
})

test('lowers the quality when the first try is over the target, and says what it did', async () => {
  const input = await noise(1000, 1000).jpeg({ quality: 95 }).toBuffer()

  const outcome = await optimizeAvatar(
    input,
    'jpg',
    context({ target: 1, cap: Number.MAX_SAFE_INTEGER })
  )

  assertAccepted(outcome)
  assert.equal(outcome.attempts?.length, 4)
  assert.match(outcome.operation ?? '', /over target/)
})

test('rejects as too-large when even the smallest avatar is over the cap', async () => {
  const input = await noise(1000, 1000).jpeg().toBuffer()

  const outcome = await optimizeAvatar(
    input,
    'jpg',
    context({ target: 1, cap: 2 })
  )

  assertRejected(outcome, 'too-large')
  if (!outcome.ok) assert.ok((outcome.sizeBytes ?? 0) > 2)
})

test('rejects bytes that are not an image', async () => {
  const outcome = await optimizeAvatar(
    new Uint8Array([1, 2, 3]),
    'png',
    context()
  )

  assertRejected(outcome, 'invalid-content')
})
