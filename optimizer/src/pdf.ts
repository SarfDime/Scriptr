import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { matchesFileSignature } from '@shared/utils/file-signature'
import { describeError } from './format'
import { describePdfBloat, inspectPdf } from './pdf-bloat'
import { type StripPdfMetadata, stripPdfMetadata } from './pdf-metadata'
import type { FileOptimizer, OptimizeAttempt } from './types'
import { smallest } from './types'

const execFileAsync = promisify(execFile)

/** A resolution, in dpi, that images are rendered at. */
export type GhostscriptStep = number

export type RunGhostscript = (job: {
  inputPath: string
  outputPath: string
  step: GhostscriptStep
  timeoutMs: number
}) => Promise<void>

/**
 * What a PDF is rendered at, gentlest first. A file only gets a lower
 * resolution when the one before did not get it inside the cap.
 *
 * A 200 dpi step leads the ladder when the file is small enough to afford it
 * (see `stepsFor`), so a file only ever gets the highest resolution it can pay
 * for. Measured on a 15.7 MB InDesign manual: 150 dpi 3.24 MB and 200 dpi
 * 3.65 MB, both inside the 3.5 MB cap so 200 wins, while 250 dpi reached
 * 4.40 MB and is unaffordable. Placed artwork in such exports is natively about
 * 300 dpi, so 200 dpi still downsamples and nothing is ever upsampled.
 *
 * This is a resolution ladder rather than Ghostscript's named presets because
 * the presets jump straight from about 150 dpi to about 72, which overshoots
 * badly on image-heavy files: measured on a 24-page 400 dpi scan, 120 dpi
 * already fitted the cap at 2.9 MB while 72 dpi produced 1.4 MB and 50 dpi
 * 0.7 MB for the same storable result. Stopping at the highest resolution that
 * fits keeps detail that a preset jump would have thrown away.
 *
 * 72 dpi is the floor. Measured edge sharpness against a 150 dpi render holds
 * up to about 96 dpi and then falls away — 96 dpi 47.0, 84 dpi 45.8, 72 dpi
 * 43.9, 50 dpi 38.5 — so below 72 dpi the loss stops being small and text that
 * was scanned as an image stops being comfortable to read. A file that cannot
 * fit at 72 dpi is rejected rather than quietly destroyed. 84 is left out
 * deliberately: it would save one boundary case at the cost of another whole
 * Ghostscript render on every oversized file.
 */
const STEPS: ReadonlyArray<GhostscriptStep> = [150, 120, 96, 72]

/** The one step above the standard ladder, tried only when there is room. */
const SHARP_STEP: GhostscriptStep = 200

/**
 * Try the 200 dpi step only for files below this size.
 *
 * It is the only step that can make an oversized document take *longer* to
 * settle, because a large file rarely has the headroom for it and the pass is
 * wasted before the ladder reaches a resolution that fits. Small files usually
 * do have room, so there the extra sharpness is close to free.
 *
 * Measured on the uploaded file, before metadata is stripped off it. That is
 * the size the user chose and the one the API acts on, so the rule is easy to
 * predict; the cost is that a large upload which strips down small still skips
 * the step, trading sharpness for one fewer Ghostscript pass.
 */
const SHARP_STEP_MAX_BYTES = 10 * 1024 * 1024

/** The ladder for one file: the sharp step leads it only when affordable. */
const stepsFor = (inputBytes: number): ReadonlyArray<GhostscriptStep> =>
  inputBytes < SHARP_STEP_MAX_BYTES ? [SHARP_STEP, ...STEPS] : STEPS

// Every switch is spelled out at every step. Setting only the resolution is not
// enough: Ghostscript then falls back to a cruder downsampling method and the
// output can come out *larger* (checked on a test PDF), whereas the full set
// shrinks it further.
//
// Colour and grey use `/Bicubic`, which keeps edges sharp where `/Average` went
// soft — the point of a lower resolution is to lose pixels, not the text that
// rides on them. Mono images are nearly always 1-bit glyph masks, where a
// bicubic filter would only grey the glyphs and 72 dpi would destroy them, so
// they are subsampled and held at 300 dpi.
const downsampleArgs = (dpi: number): ReadonlyArray<string> => [
  '-dDownsampleColorImages=true',
  '-dColorImageDownsampleType=/Bicubic',
  `-dColorImageResolution=${dpi}`,
  '-dDownsampleGrayImages=true',
  '-dGrayImageDownsampleType=/Bicubic',
  `-dGrayImageResolution=${dpi}`,
  '-dDownsampleMonoImages=true',
  '-dMonoImageDownsampleType=/Subsample',
  '-dMonoImageResolution=300',
]

// Applied to every step. These only drop things no one can see, so they cost no
// fidelity: document XMP, the Info dates (which would otherwise make every run
// of the same file differ) and the file ID.
//
// `-dOmitXMP` is worth little on its own — Ghostscript re-emits XMP found
// attached to embedded artwork regardless, which on an InDesign export can be
// most of the file (see `pdf-bloat.ts`) — but it does drop the catalog packet.
const STRIP_ARGS: ReadonlyArray<string> = [
  '-dOmitXMP=true',
  '-dOmitInfoDate=true',
  '-dOmitID=true',
]

// Everything else that decides how small and how faithful the output is.
const QUALITY_ARGS: ReadonlyArray<string> = [
  // Writes the catalogue and the cross-reference table as compressed object
  // streams rather than as plain text, which matters on documents with
  // thousands of objects.
  '-dWriteObjStms=true',
  '-dWriteXRefStm=true',
  '-dDetectDuplicateImages=true',
  '-dCompressFonts=true',
  '-dSubsetFonts=true',
  '-dEmbedAllFonts=true',
  // Rotating a near-square page changes every coordinate in an already typeset
  // document, so keep the orientation the author chose.
  '-dAutoRotatePages=/None',
  // Keep existing JPEG data as it is when a step is not resampling: a
  // decompress-and-recompress round trip loses quality and often gains bytes.
  '-dPassThroughJPEGImages=true',
]

/** The Ghostscript command line for one step. No user-supplied text reaches it:
 * the paths are inside a directory this process just created. */
export const buildGhostscriptArgs = ({
  inputPath,
  outputPath,
  step,
}: {
  inputPath: string
  outputPath: string
  step: GhostscriptStep
}): Array<string> => [
  '-q',
  '-dNOPAUSE',
  '-dBATCH',
  '-dSAFER',
  '-sDEVICE=pdfwrite',
  '-dCompatibilityLevel=1.5',
  // Only the image and font profile is taken from the preset; the resolution
  // below overrides the one it would set.
  '-dPDFSETTINGS=/ebook',
  ...downsampleArgs(step),
  ...STRIP_ARGS,
  ...QUALITY_ARGS,
  `-sOutputFile=${outputPath}`,
  inputPath,
]

export const runGhostscript: RunGhostscript = async ({
  inputPath,
  outputPath,
  step,
  timeoutMs,
}) => {
  await execFileAsync(
    'gs',
    buildGhostscriptArgs({ inputPath, outputPath, step }),
    { timeout: timeoutMs, killSignal: 'SIGKILL' }
  )
}

/**
 * Why a PDF is still too big, in one clause, for the log. Best-effort: a
 * document that cannot be measured simply gets no diagnosis rather than an
 * error, because the reason it was rejected is the size, not the diagnosis.
 */
const diagnose = (input: Uint8Array): string | undefined => {
  const report = inspectPdf(input)
  return report ? describePdfBloat(report) : undefined
}

/**
 * Shrinks a PDF only when it needs shrinking. One already within the target is
 * stored as uploaded: re-rendering risks the document for no gain that
 * matters. A bigger one goes through Ghostscript with each step in turn,
 * gentlest first, and stops at the first result that fits the cap.
 *
 * It deliberately does *not* keep grinding down to the smallest result.
 * `TARGET_STORED_FILE_BYTES` may be missed when going lower costs quality, and
 * on a document whose bulk is not images the harshest step buys only a few
 * percent: on one real manual, taking images from 72 dpi to 50 dpi saved 2.7%
 * because embedded rasters were a tenth of the file. Settling at the gentlest
 * step that fits keeps that detail and still stores the file.
 *
 * A rejection carries a `diagnostics` clause saying what the file is made of,
 * because the usual reason a PDF will not shrink further is metadata that
 * Ghostscript preserves, and no amount of extra downsampling will change that.
 */
export const createPdfOptimizer =
  (
    run: RunGhostscript = runGhostscript,
    strip: StripPdfMetadata = stripPdfMetadata
  ): FileOptimizer =>
  async (input, _declaredType, { deadline, limits }) => {
    if (input.byteLength <= limits.target) {
      return {
        ok: true,
        bytes: input,
        fileType: 'pdf',
        operation: 'stored as uploaded (already within the target)',
        attempts: [],
      }
    }

    // Before Ghostscript, not after: it re-emits XMP attached to embedded
    // artwork, so stripping first saves both those bytes and the work of
    // copying them through. Costs no pixels, and on a metadata-heavy document
    // it is the difference between fitting and being rejected.
    const stripped = await strip(input)
    const source = stripped.byteLength < input.byteLength ? stripped : input

    // Metadata alone sometimes gets a file under the target, in which case it
    // is stored without Ghostscript ever re-encoding an image.
    if (source.byteLength <= limits.target) {
      return {
        ok: true,
        bytes: source,
        fileType: 'pdf',
        operation: 'stripped metadata (now within the target)',
        attempts: [],
      }
    }

    const attempts: Array<OptimizeAttempt> = []
    const workDir = await mkdtemp(join(tmpdir(), 'optimizer-'))
    try {
      const inputPath = join(workDir, 'input.pdf')
      await writeFile(inputPath, source)

      const candidates = [
        {
          step: source === input ? 'original' : 'stripped metadata',
          bytes: source,
        },
      ]
      let stoppedAt: string | undefined
      for (const [index, step] of stepsFor(input.byteLength).entries()) {
        const label = `gs ${step}dpi`
        const remainingMs = deadline - Date.now()
        if (remainingMs <= 0) {
          stoppedAt = label
          break
        }

        const outputPath = join(workDir, `output-${index}.pdf`)
        const startedAt = Date.now()
        await run({ inputPath, outputPath, step, timeoutMs: remainingMs })

        const output = new Uint8Array(await readFile(outputPath))
        attempts.push({
          step: label,
          bytes: output.byteLength,
          ms: Date.now() - startedAt,
        })
        // Ghostscript can exit cleanly and still produce nothing usable.
        if (!matchesFileSignature('pdf', output)) {
          return {
            ok: false,
            reason: 'failed',
            detail: `${label} produced something that is not a PDF`,
            attempts,
          }
        }
        // A "smaller" PDF that isn't smaller is no use.
        if (output.byteLength >= source.byteLength) continue

        // Gentlest fit wins. Every later step is harsher, so once one is inside
        // the cap there is nothing left to gain that justifies the quality.
        if (output.byteLength <= limits.cap) {
          return {
            ok: true,
            bytes: output,
            fileType: 'pdf',
            operation: label,
            attempts,
          }
        }
        candidates.push({ step: label, bytes: output })
      }

      // Settle for the best result that actually fits, so running out of time
      // never fails a file that could have been stored — the ladder is several
      // renders long and a big document can exhaust the deadline part-way.
      const storable = candidates.filter(
        (candidate) => candidate.bytes.byteLength <= limits.cap
      )
      if (storable.length > 0) {
        const best = smallest(storable)
        return {
          ok: true,
          bytes: best.bytes,
          fileType: 'pdf',
          operation:
            best.step === 'original'
              ? 'kept the original (gs made it no smaller)'
              : best.step,
          attempts,
        }
      }

      const best = smallest(candidates)
      if (stoppedAt) {
        return {
          ok: false,
          reason: 'failed',
          detail: `deadline passed before ${stoppedAt}`,
          attempts,
        }
      }
      return {
        ok: false,
        reason: 'too-large',
        sizeBytes: best.bytes.byteLength,
        detail: `smallest was ${best.step}`,
        diagnostics: diagnose(input),
        attempts,
      }
    } catch (error) {
      return {
        ok: false,
        reason: 'failed',
        detail: describeError(error),
        attempts,
      }
    } finally {
      await rm(workDir, { recursive: true, force: true })
    }
  }
