import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { matchesFileSignature } from '@shared/utils/file-signature'
import { describeError } from './format'
import type { FileOptimizer, OptimizeAttempt } from './types'
import { smallest } from './types'

const execFileAsync = promisify(execFile)

export type GhostscriptStep = '/ebook' | '/screen' | '/screen 50dpi'

export type RunGhostscript = (job: {
  inputPath: string
  outputPath: string
  step: GhostscriptStep
  timeoutMs: number
}) => Promise<void>

// Gentlest first: a PDF only gets a harsher step when the one before wasn't
// enough. `/ebook` renders images at about 150 dpi and `/screen` at about
// 72 dpi; the last step takes `/screen` down to 50 dpi, for image-heavy files
// that are still over the cap.
const STEPS: ReadonlyArray<GhostscriptStep> = [
  '/ebook',
  '/screen',
  '/screen 50dpi',
]

// The last step spells out every downsampling switch. Setting only the
// resolution after the preset does not work: Ghostscript then falls back to a
// cruder downsampling method and the file comes out *larger* than plain
// `/screen` (checked on a test PDF), whereas the full set shrinks it further.
const STEP_ARGS: Record<GhostscriptStep, ReadonlyArray<string>> = {
  '/ebook': ['-dPDFSETTINGS=/ebook'],
  '/screen': ['-dPDFSETTINGS=/screen'],
  '/screen 50dpi': [
    '-dPDFSETTINGS=/screen',
    '-dDownsampleColorImages=true',
    '-dColorImageDownsampleType=/Average',
    '-dColorImageResolution=50',
    '-dDownsampleGrayImages=true',
    '-dGrayImageDownsampleType=/Average',
    '-dGrayImageResolution=50',
  ],
}

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
  ...STEP_ARGS[step],
  '-dDetectDuplicateImages=true',
  '-dCompressFonts=true',
  '-dSubsetFonts=true',
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
 * Shrinks a PDF only when it needs shrinking. One already within the target is
 * stored as uploaded: re-rendering risks the document for no gain that
 * matters. A bigger one goes through Ghostscript with each step in turn until
 * it fits the target; if none does, the smallest version (the original
 * included) is used when it is within the cap and the file is rejected as
 * `too-large` when it isn't.
 */
export const createPdfOptimizer =
  (run: RunGhostscript = runGhostscript): FileOptimizer =>
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

    const attempts: Array<OptimizeAttempt> = []
    const workDir = await mkdtemp(join(tmpdir(), 'optimizer-'))
    try {
      const inputPath = join(workDir, 'input.pdf')
      await writeFile(inputPath, input)

      const candidates = [{ step: 'original', bytes: input }]
      for (const [index, step] of STEPS.entries()) {
        const label = `gs ${step}`
        const remainingMs = deadline - Date.now()
        if (remainingMs <= 0) {
          return {
            ok: false,
            reason: 'failed',
            detail: `deadline passed before ${label}`,
            attempts,
          }
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
        if (output.byteLength >= input.byteLength) continue

        if (output.byteLength <= limits.target) {
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

      const best = smallest(candidates)
      if (best.bytes.byteLength > limits.cap) {
        return {
          ok: false,
          reason: 'too-large',
          sizeBytes: best.bytes.byteLength,
          detail: `smallest was ${best.step}`,
          attempts,
        }
      }
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
