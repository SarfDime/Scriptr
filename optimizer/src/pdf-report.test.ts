import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  createPdfOptimizer,
  type GhostscriptStep,
  type RunGhostscript,
} from './pdf'
import { assertAccepted } from './test-helpers'
import type { SizeLimits } from './types'

// What the PDF optimizer reports for the logs. Ghostscript is faked.
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
  const outcome = await createPdfOptimizer(fakeGhostscript({}))(
    pdf(90),
    'pdf',
    context()
  )

  assertAccepted(outcome)
  assert.match(outcome.operation ?? '', /stored as uploaded/)
  assert.deepEqual(outcome.attempts, [])
})

test('reports the step used and each size it tried', async () => {
  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 130, '/screen': 90 })
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.operation, 'gs /screen')
  assert.deepEqual(
    outcome.attempts?.map(({ step, bytes }) => [step, bytes]),
    [
      ['gs /ebook', 130],
      ['gs /screen', 90],
    ]
  )
  assert.ok(outcome.attempts?.every(({ ms }) => ms >= 0))
})

test('says when it kept the original because gs made it no smaller', async () => {
  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 200, '/screen': 130, '/screen 50dpi': 140 })
  )(pdf(120), 'pdf', context())

  assertAccepted(outcome)
  assert.match(outcome.operation ?? '', /kept the original/)
})

test('reports the best size reached when it is too large, with every step tried', async () => {
  const outcome = await createPdfOptimizer(
    fakeGhostscript({ '/ebook': 300, '/screen': 200, '/screen 50dpi': 250 })
  )(pdf(400), 'pdf', context())

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.reason, 'too-large')
  assert.equal(outcome.sizeBytes, 200)
  assert.equal(outcome.detail, 'smallest was gs /screen')
  assert.deepEqual(
    outcome.attempts?.map(({ step }) => step),
    ['gs /ebook', 'gs /screen', 'gs /screen 50dpi']
  )
})

test('explains a failure, and keeps the sizes of the runs that did finish', async () => {
  const outcome = await createPdfOptimizer(fakeGhostscript({ '/ebook': 300 }))(
    pdf(400),
    'pdf',
    context()
  )

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.reason, 'failed')
  assert.match(outcome.detail ?? '', /gs failed on \/screen/)
  assert.deepEqual(
    outcome.attempts?.map(({ step }) => step),
    ['gs /ebook']
  )
})

test('says the deadline passed when that is why it stopped', async () => {
  const outcome = await createPdfOptimizer(fakeGhostscript({ '/ebook': 80 }))(
    pdf(400),
    'pdf',
    context(Date.now() - 1)
  )

  assert.equal(outcome.ok, false)
  if (outcome.ok) return
  assert.equal(outcome.detail, 'deadline passed before gs /ebook')
})
