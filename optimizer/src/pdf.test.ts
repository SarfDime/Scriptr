import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  buildGhostscriptArgs,
  createPdfOptimizer,
  type GhostscriptStep,
  type RunGhostscript,
} from './pdf'
import type { StripPdfMetadata } from './pdf-metadata'
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

  const outcome = await optimizer(fakeGhostscript({}, runs))(
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

  const outcome = await optimizer(
    fakeGhostscript({ 200: 80, 150: 60, 120: 40, 96: 30, 72: 20 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 80)
  assert.deepEqual(runs, [200])
})

test('moves to the next step when the one before is not enough', async () => {
  const runs: Array<GhostscriptStep> = []

  // The first step lands over the cap, so it is no use however small it got.
  const outcome = await optimizer(
    fakeGhostscript({ 200: 170, 150: 160, 120: 90, 96: 50, 72: 40 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.deepEqual(runs, [200, 150, 120])
})

test('falls through to the 72 dpi floor when nothing gentler fits', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await optimizer(
    fakeGhostscript({ 200: 175, 150: 160, 120: 155, 96: 152, 72: 90 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.equal(outcome.operation, 'gs 72dpi')
  assert.deepEqual(runs, [200, 150, 120, 96, 72])
})

test('never goes below the 72 dpi floor', async () => {
  // A file that cannot fit at the floor is rejected rather than destroyed.
  const outcome = await optimizer(
    fakeGhostscript({ 200: 320, 150: 300, 120: 260, 96: 220, 72: 180 })
  )(pdf(400), 'pdf', context())

  assertRejected(outcome, 'too-large')
  if (outcome.ok) return
  assert.equal(outcome.sizeBytes, 180)
  assert.equal(outcome.detail, 'smallest was gs 72dpi')
})

test('settles at the gentlest step that fits the cap, not the smallest', async () => {
  // Every step fits the cap. Going on to a lower resolution would cost real
  // image quality for a few percent that buys nothing, so the first fit is kept
  // and the lower resolutions are never run.
  const runs: Array<GhostscriptStep> = []

  const outcome = await optimizer(
    fakeGhostscript({ 200: 140, 150: 130, 120: 120, 96: 105, 72: 100 }, runs)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 140)
  assert.equal(outcome.operation, 'gs 200dpi')
  assert.deepEqual(runs, [200])
})

test('skips the 200 dpi step for a file too big to afford it', async () => {
  // A large document rarely has headroom for 200 dpi, so the pass is wasted
  // before the ladder reaches a resolution that fits.
  const runs: Array<GhostscriptStep> = []

  const outcome = await optimizer(
    fakeGhostscript({ 150: 90, 120: 80, 96: 70, 72: 60 }, runs)
  )(pdf(11 * 1024 * 1024), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.equal(outcome.operation, 'gs 150dpi')
  assert.deepEqual(runs, [150])
})

test('still leads with 200 dpi for a file below the threshold', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await optimizer(
    fakeGhostscript({ 200: 90, 150: 80, 120: 70, 96: 60, 72: 50 }, runs)
  )(pdf(9 * 1024 * 1024), 'pdf', context())

  assertAccepted(outcome)
  assert.ok(outcome.bytes.byteLength <= 150)
  assert.deepEqual(runs, [200])
})

test('rejects as too-large when nothing gets under the cap', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 280, 150: 300, 120: 200, 96: 250, 72: 220 })
  )(pdf(400), 'pdf', context())

  assertRejected(outcome, 'too-large')
})

/** A PDF the bloat inspector can measure: one XMP packet and one image. */
const bloatyPdf = (): Uint8Array => {
  const encoder = new TextEncoder()
  const xmp = 'x'.repeat(600)
  return encoder.encode(
    [
      '%PDF-1.7\n',
      `1 0 obj\n<</Length ${xmp.length}/Type/Metadata/Subtype/XML>>\nstream\n${xmp}\nendstream\nendobj\n`,
      '2 0 obj\n<</Length 120/Subtype/Image/Width 4/Height 4>>\nstream\n',
      `${'y'.repeat(120)}\nendstream\nendobj\n`,
    ].join('')
  )
}

test('says what the file is made of when it rejects one as too-large', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 280, 150: 300, 120: 200, 96: 250, 72: 220 })
  )(bloatyPdf(), 'pdf', context())

  assertRejected(outcome, 'too-large')
  if (outcome.ok) return
  // Whatever the verdict, the reason is still the size; the diagnosis explains
  // why more downsampling would not have helped.
  assert.equal(outcome.detail, 'smallest was gs 120dpi')
  assert.match(
    outcome.diagnostics ?? '',
    /metadata is .* almost nothing to remove/
  )
})

test('a rejection it cannot measure still reports the size', async () => {
  const outcome = await optimizer(
    fakeGhostscript({ 200: 280, 150: 300, 120: 200, 96: 250, 72: 220 })
  )(pdf(400), 'pdf', context())

  assertRejected(outcome, 'too-large')
  if (outcome.ok) return
  assert.equal(outcome.diagnostics, undefined)
  assert.equal(outcome.sizeBytes, 200)
})

test('stores a PDF that metadata stripping alone brings within the target', async () => {
  // No Ghostscript at all: removing metadata costs no pixels, so re-encoding
  // every image would be pure loss.
  const runs: Array<GhostscriptStep> = []
  const outcome = await optimizer(fakeGhostscript({}, runs), async () =>
    pdf(90)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.equal(outcome.operation, 'stripped metadata (now within the target)')
  assert.deepEqual(runs, [])
})

test('runs gs on the stripped bytes, not the uploaded ones', async () => {
  const seen: Array<Uint8Array> = []
  const run: RunGhostscript = async ({ inputPath, outputPath }) => {
    seen.push(new Uint8Array(await readFile(inputPath)))
    await writeFile(outputPath, pdf(80))
  }

  const outcome = await optimizer(run, async () => pdf(200))(
    pdf(400),
    'pdf',
    context()
  )

  assertAccepted(outcome)
  assert.equal(seen.length, 1)
  // The staged file is what stripping produced, not the 400 byte upload.
  assert.equal(seen[0]?.byteLength, 200)
})

test('falls back to the uploaded bytes when stripping cannot help', async () => {
  const runs: Array<GhostscriptStep> = []
  const unchanged = pdf(400)

  const outcome = await optimizer(
    fakeGhostscript({ 200: 90 }, runs),
    async (bytes) => bytes
  )(unchanged, 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 90)
  assert.deepEqual(runs, [200])
})

test('keeps the stripped version when gs makes it no smaller', async () => {
  // Stripping got it under the cap but not the target, and gs could not beat
  // it. The stripped file is smaller than the upload and pixel-identical, so it
  // is what gets stored.
  const outcome = await optimizer(
    fakeGhostscript({ 200: 190, 150: 200, 120: 210, 96: 220, 72: 230 }),
    async () => pdf(140)
  )(pdf(400), 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes.byteLength, 140)
  assert.equal(outcome.operation, 'stripped metadata')
})

test('keeps the original when gs makes it no smaller', async () => {
  // Over the target but within the cap, and gs only makes it bigger.
  const input = pdf(120)

  const outcome = await optimizer(
    fakeGhostscript({ 200: 210, 150: 200, 120: 130, 96: 140, 72: 145 })
  )(input, 'pdf', context())

  assertAccepted(outcome)
  assert.equal(outcome.bytes, input)
})

test('fails when gs fails', async () => {
  const outcome = await optimizer(fakeGhostscript({}))(
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

  const outcome = await optimizer(notAPdf)(pdf(400), 'pdf', context())

  assertRejected(outcome, 'failed')
})

test('does not start gs once the deadline has passed', async () => {
  const runs: Array<GhostscriptStep> = []

  const outcome = await optimizer(fakeGhostscript({ 200: 80 }, runs))(
    pdf(400),
    'pdf',
    context(Date.now() - 1)
  )

  assertRejected(outcome, 'failed')
  assert.deepEqual(runs, [])
})

test('gives gs only the time that is left', async () => {
  const timeouts: Array<number> = []
  const spy: RunGhostscript = async ({ outputPath, timeoutMs }) => {
    timeouts.push(timeoutMs)
    await writeFile(outputPath, pdf(80))
  }

  await optimizer(spy)(pdf(400), 'pdf', context(Date.now() + 5000))

  assert.equal(timeouts.length, 1)
  assert.ok((timeouts[0] ?? 0) > 0 && (timeouts[0] ?? 0) <= 5000)
})

/** Tests pass their own stripper so they never touch pdf-lib; the real one is
 * covered in pdf-metadata.test.ts. */
const optimizer = (
  run: RunGhostscript,
  strip: StripPdfMetadata = async (bytes) => bytes
) => createPdfOptimizer(run, strip)

const job = { inputPath: '/tmp/in.pdf', outputPath: '/tmp/out.pdf' }

test('every step renders at its own resolution', () => {
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes(`-dColorImageResolution=${step}`), String(step))
    assert.ok(args.includes(`-dGrayImageResolution=${step}`), String(step))
  }
})

test('no step ever downsamples with /Average', () => {
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes('-dColorImageDownsampleType=/Bicubic'))
    assert.ok(args.includes('-dGrayImageDownsampleType=/Bicubic'))
    assert.ok(!args.includes('-dColorImageDownsampleType=/Average'))
    assert.ok(!args.includes('-dGrayImageDownsampleType=/Average'))
  }
})

test('no step goes below the 72 dpi floor', () => {
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })
    const resolutions = args
      .filter((arg) => arg.startsWith('-dColorImageResolution='))
      .map((arg) => Number.parseInt(arg.split('=')[1] ?? '0', 10))
    assert.deepEqual(resolutions, [step])
    assert.ok(step >= 72, `${step} is below the floor`)
  }
})

test('every step leaves 1-bit text masks sharp', () => {
  // Mono images are nearly always glyph masks: bicubic would grey them out, and
  // resampling them down with the colour channels is what made the old
  // aggressive step unreadable.
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes('-dDownsampleMonoImages=true'))
    assert.ok(args.includes('-dMonoImageDownsampleType=/Subsample'))
    assert.ok(args.includes('-dMonoImageResolution=300'))
  }
})

test('every step strips what cannot be seen and compresses the object table', () => {
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })

    for (const expected of [
      '-dOmitXMP=true',
      '-dOmitInfoDate=true',
      '-dOmitID=true',
      '-dWriteObjStms=true',
      '-dWriteXRefStm=true',
      '-dDetectDuplicateImages=true',
      '-dCompressFonts=true',
      '-dSubsetFonts=true',
      '-dEmbedAllFonts=true',
      '-dAutoRotatePages=/None',
      '-dPassThroughJPEGImages=true',
    ]) {
      assert.ok(args.includes(expected), `${step} is missing ${expected}`)
    }
  }
})

test('no step leaves the compression quality to chance', () => {
  // Every step names its own preset, so no step can silently inherit a stale
  // global default.
  for (const step of [200, 150, 120, 96, 72]) {
    const presets = buildGhostscriptArgs({ ...job, step }).filter((arg) =>
      arg.startsWith('-dPDFSETTINGS=')
    )
    assert.equal(presets.length, 1, `${step} must set exactly one preset`)
  }
})

test('every step runs sandboxed and writes where it is told', () => {
  for (const step of [200, 150, 120, 96, 72]) {
    const args = buildGhostscriptArgs({ ...job, step })
    assert.ok(args.includes('-dSAFER'))
    assert.ok(args.includes('-sOutputFile=/tmp/out.pdf'))
    assert.equal(args.at(-1), '/tmp/in.pdf')
  }
})
