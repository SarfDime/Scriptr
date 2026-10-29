import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { optimizeImage } from './image'
import { assertAccepted, assertRejected } from './test-helpers'
import { DEFAULT_LIMITS, type SizeLimits } from './types'

const context = (limits: SizeLimits = DEFAULT_LIMITS) => ({
  deadline: Number.MAX_SAFE_INTEGER,
  limits,
})

// Random noise doesn't compress, which makes it the worst case for the ladder.
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

const solid = (width: number, height: number) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 120, b: 40 },
    },
  })

test('converts a JPEG to WebP that fits the target', async () => {
  const input = await noise(1200, 900).jpeg({ quality: 90 }).toBuffer()

  const outcome = await optimizeImage(input, 'jpg', context())

  assertAccepted(outcome)
  assert.equal(outcome.fileType, 'webp')
  assert.equal((await sharp(outcome.bytes).metadata()).format, 'webp')
  assert.ok(outcome.bytes.byteLength <= DEFAULT_LIMITS.target)
})

test('scales a large image down to 2400px on its long side', async () => {
  const input = await solid(5000, 3000).png().toBuffer()

  const outcome = await optimizeImage(input, 'png', context())

  assertAccepted(outcome)
  const { width, height } = await sharp(outcome.bytes).metadata()
  assert.deepEqual([width, height], [2400, 1440])
})

test('never scales an image up', async () => {
  const input = await solid(800, 600).jpeg().toBuffer()

  const outcome = await optimizeImage(input, 'jpg', context())

  assertAccepted(outcome)
  const { width, height } = await sharp(outcome.bytes).metadata()
  assert.deepEqual([width, height], [800, 600])
})

test('applies the EXIF orientation and strips the metadata', async () => {
  const input = await noise(200, 100)
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer()
  assert.equal((await sharp(input).metadata()).orientation, 6)

  const outcome = await optimizeImage(input, 'jpg', context())

  assertAccepted(outcome)
  const metadata = await sharp(outcome.bytes).metadata()
  // A photo taken sideways comes out upright: 200x100 turned 90 degrees.
  assert.deepEqual([metadata.width, metadata.height], [100, 200])
  assert.equal(metadata.exif, undefined)
})

test('keeps transparency', async () => {
  const input = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer()

  const outcome = await optimizeImage(input, 'png', context())

  assertAccepted(outcome)
  assert.equal((await sharp(outcome.bytes).metadata()).hasAlpha, true)
})

test('steps down in quality when the first try is over the target', async () => {
  const input = await noise(1000, 1000).jpeg({ quality: 90 }).toBuffer()
  const roomy = {
    target: Number.MAX_SAFE_INTEGER,
    cap: Number.MAX_SAFE_INTEGER,
  }

  const firstTry = await optimizeImage(input, 'jpg', context(roomy))
  // An unreachable target walks the whole ladder and keeps the smallest result.
  const squeezed = await optimizeImage(
    input,
    'jpg',
    context({ ...roomy, target: 1 })
  )

  assertAccepted(firstTry)
  assertAccepted(squeezed)
  assert.ok(squeezed.bytes.byteLength < firstTry.bytes.byteLength)
})

test('rejects as too-large when nothing fits under the cap', async () => {
  const input = await noise(500, 500).jpeg().toBuffer()

  const outcome = await optimizeImage(
    input,
    'jpg',
    context({ target: 10, cap: 100 })
  )

  assertRejected(outcome, 'too-large')
})

test('rejects bytes that are not an image', async () => {
  const outcome = await optimizeImage(
    new Uint8Array([1, 2, 3, 4]),
    'jpg',
    context()
  )

  assertRejected(outcome, 'invalid-content')
})

test('reports what it did and every size it tried', async () => {
  const input = await noise(1200, 900).jpeg({ quality: 90 }).toBuffer()

  const outcome = await optimizeImage(input, 'jpg', context())

  assertAccepted(outcome)
  assert.match(outcome.operation ?? '', /^webp q80 max 2400px$/)
  assert.equal(outcome.attempts?.length, 1)
  assert.equal(outcome.attempts?.[0]?.bytes, outcome.bytes.byteLength)
})

test('reports the smallest size it reached when it is too large', async () => {
  const input = await noise(500, 500).jpeg().toBuffer()

  const outcome = await optimizeImage(
    input,
    'jpg',
    context({ target: 10, cap: 100 })
  )

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.reason, 'too-large')
  const sizes = outcome.attempts?.map(({ bytes }) => bytes) ?? []
  assert.equal(outcome.sizeBytes, Math.min(...sizes))
  assert.ok((outcome.sizeBytes ?? 0) > 100)
})
