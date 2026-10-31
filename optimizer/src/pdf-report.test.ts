import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  createPdfOptimizer,
  type GhostscriptStep,
  type RunGhostscript,
} from './pdf'
import type { StripPdfMetadata } from './pdf-metadata'
import { assertAccepted } from './test-helpers'
import type { SizeLimits } from './types'

// What the PDF optimizer reports for the logs. Ghostscript is faked.
/** Tests pass their own stripper so they never touch pdf-lib; the real one is
 * covered in pdf-metadata.test.ts. */
const optimizer = (
  run: RunGhostscript,
  strip: StripPdfMetadata = async (bytes) => bytes
) => createPdfOptimizer(run, strip)

const limits: SizeLimits = { target: 100, cap: 150 }
const context = (deadline = Number.MAX_SAFE_INTEGER) => ({ deadline, limits })

const pdf = (size: number) => {
  const bytes = new Uint8Array(size)
  bytes.set(new TextEncoder().encode('%PDF-1.7'))
  return bytes
}

const fakeGhostscript =
  (sizes: Partial<Record<GhostscriptStep, number>>): RunGhostscript =>
  async ({ outputPath, step }) => {
    const size = sizes[step]
    if (size === undefined) throw new Error(`gs failed on ${step}`)
    await writeFile(outputPath, pdf(size))
  }

test('says it stored a small PDF as uploaded', async () => {
  const outcome = await optimizer(fakeGhostscript({}))(
    pdf(90),
    'pdf',
    context()
  )

  assertAccepted(outcome)
  assert.match(outcome.operation ?? '', /stored as uploaded/)
  assert.deepEqual(outcome.attempts, [])
})

test('reports the step used and each size it tried', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 170, 150: 160, 120: 90 })
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.operation, 'gs 120dpi')
  assert.deepEqual(
    outcome.attempts?.map(({ step, bytes }) => [step, bytes]),
    [
      ['gs 200dpi', 170],
      ['gs 150dpi', 160],
      ['gs 120dpi', 90],
    ]
  )
  assert.ok(outcome.attempts?.every(({ ms }) => ms >= 0))
})

test('says when it kept the original because gs made it no smaller', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 210, 150: 200, 120: 130, 96: 140, 72: 145 })
  )(pdf(120), 'pdf', context())

  assertAccepted(outcome)
  assert.match(outcome.operation ?? '', /kept the original/)
})

test('reports the best size reached when it is too large, with every step tried', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 280, 150: 300, 120: 200, 96: 250, 72: 220 })
  )(pdf(400), 'pdf', context())

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.reason, 'too-large')
  assert.equal(outcome.sizeBytes, 200)
  assert.equal(outcome.detail, 'smallest was gs 120dpi')
  assert.deepEqual(
    outcome.attempts?.map(({ step }) => step),
    ['gs 200dpi', 'gs 150dpi', 'gs 120dpi', 'gs 96dpi', 'gs 72dpi']
  )
})

test('explains a failure, and keeps the sizes of the runs that did finish', async () => {
  const outcome = await optimizer(fakeGhostscript({ 200: 300 }))(
    pdf(400),
    'pdf',
    context()
  )

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.reason, 'failed')
  assert.match(outcome.detail ?? '', /gs failed on 150/)
  assert.deepEqual(
    outcome.attempts?.map(({ step }) => step),
    ['gs 200dpi']
  )
})

test('says the deadline passed when that is why it stopped', async () => {
  const outcome = await optimizer(fakeGhostscript({ 200: 80 }))(
    pdf(400),
    'pdf',
    context(Date.now() - 1)
  )

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.detail, 'deadline passed before gs 200dpi')
})
