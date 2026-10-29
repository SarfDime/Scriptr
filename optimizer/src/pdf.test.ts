import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  buildGhostscriptArgs,
  createPdfOptimizer,
  type GhostscriptStep,
  type RunGhostscript,
} from './pdf'
import { assertAccepted, assertRejected } from './test-helpers'
import type { SizeLimits } from './types'

// Small numbers keep the fake PDFs tiny. None of these tests run Ghostscript.
const limits: SizeLimits = { target: 100, cap: 150 }
const context = (deadline = Number.MAX_SAFE_INTEGER) => ({ deadline, limits })

/** A fake PDF of `size` bytes: it only has to look like one. */
const pdf = (size: number) => {
  const bytes = new Uint8Array(size)
  bytes.set(new TextEncoder().encode('%PDF-1.7'))
  return bytes
}

/** A Ghostscript stand-in that "produces" the given size per step, and fails
 * for a step with none. Records which steps were run. */
const fakeGhostscript = (
  sizes: Partial<Record<GhostscriptStep, number>>,
  runs: Array<GhostscriptStep> = []
): RunGhostscript => {
  return async ({ outputPath, step }) => {
    runs.push(step)
    const size = sizes[step]
    if (size === undefined) throw new Error('gs failed')
    await writeFile(outputPath, pdf(size))
  }
}

test('stores a PDF already within the target as uploaded, without running gs', async () => {
  const runs: Array<GhostscriptStep> = []
  const input = pdf(90)

  const outcome = await createPdfOptimizer(fakeGhostscript({}, runs))(
    input,
    'pdf',
    context()
  )

  assertAccepted(outcome)
  assert.equal(outcome.bytes, input)
  assert.deepEqual(runs, [])
})

test('uses the gentlest step when that is enough', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 80, '/screen': 40, '/screen 50dpi': 20 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 80)
  assert.deepEqual(runs, ['/ebook'])
})

test('moves to the next step when the one before is not enough', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 130, '/screen': 90, '/screen 50dpi': 50 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.deepEqual(runs, ['/ebook', '/screen'])
})

test('falls through to the 50 dpi step when the presets are not enough', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await createPdfOptimizer(
    fakeGhostscript(
      { '/ebook': 140, '/screen': 130, '/screen 50dpi': 90 },
      runs
    )
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.equal(outcome.operation, 'gs /screen 50dpi')
  assert.deepEqual(runs, ['/ebook', '/screen', '/screen 50dpi'])
})

test('settles for the smallest version within the cap when none hits the target', async () => {
  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 140, '/screen': 120, '/screen 50dpi': 130 })
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 120)
})

test('rejects as too-large when nothing gets under the cap', async () => {
  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 300, '/screen': 200, '/screen 50dpi': 250 })
  )(pdf(400), 'pdf', context())

  assertRejected(outcome, 'too-large')
})

test('keeps the original when gs makes it no smaller', async () => {
  // Over the target but within the cap, and gs only makes it bigger.
  const input = pdf(120)

  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 200, '/screen': 130, '/screen 50dpi': 140 })
  )(input, 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes, input)
})

test('fails when gs fails', async () => {
  const outcome = await createPdfOptimizer(fakeGhostscript({}))(
    pdf(400),
    'pdf',
    context()
  )

  assertRejected(outcome, 'failed')
})

test('fails when gs produces something that is not a PDF', async () => {
  const notAPdf: RunGhostscript = async ({ outputPath }) => {
    await writeFile(outputPath, new Uint8Array(50))
  }

  const outcome = await createPdfOptimizer(notAPdf)(pdf(400), 'pdf', context())

  assertRejected(outcome, 'failed')
})

test('does not start gs once the deadline has passed', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 80 }, runs)
  )(pdf(400), 'pdf', context(Date.now() - 1))

  assertRejected(outcome, 'failed')
  assert.deepEqual(runs, [])
})

test('gives gs only the time that is left', async () => {
  const timeouts: Array<number> = []
  const spy: RunGhostscript = async ({ outputPath, timeoutMs }) => {
    timeouts.push(timeoutMs)
    await writeFile(outputPath, pdf(80))
  }

  await createPdfOptimizer(spy)(pdf(400), 'pdf', context(Date.now() + 5000))

  assert.equal(timeouts.length, 1)
  assert.ok((timeouts[0] ?? 0) > 0 && (timeouts[0] ?? 0) <= 5000)
})

const job = { inputPath: '/tmp/in.pdf', outputPath: '/tmp/out.pdf' }

test('the gentle steps are just a preset', () => {
  for (const step of ['/ebook', '/screen'] as const) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes(`-dPDFSETTINGS=${step}`))
    assert.ok(!args.some((arg) => arg.startsWith('-dColorImageResolution')))
  }
})

test('the 50 dpi step spells out every downsampling switch', () => {
  // Only the resolution after the preset makes gs fall back to a cruder
  // downsampling method and the file comes out larger, so all of these stay.
  const args = buildGhostscriptArgs({ ...job, step: '/screen 50dpi' })

  for (const expected of [
    '-dPDFSETTINGS=/screen',
    '-dDownsampleColorImages=true',
    '-dColorImageDownsampleType=/Average',
    '-dColorImageResolution=50',
    '-dDownsampleGrayImages=true',
    '-dGrayImageDownsampleType=/Average',
    '-dGrayImageResolution=50',
  ]) {
    assert.ok(args.includes(expected), expected)
  }
})

test('every step runs sandboxed and writes where it is told', () => {
  for (const step of ['/ebook', '/screen', '/screen 50dpi'] as const) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes('-dSAFER'))
    assert.ok(args.includes('-sOutputFile=/tmp/out.pdf'))
    assert.equal(args.at(-1), '/tmp/in.pdf')
  }
})
