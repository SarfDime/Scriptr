import sharp, { type Sharp, type WebpOptions } from 'sharp'
import { describeError } from './format'
import type { FileOptimizer, OptimizeAttempt, OptimizeOutcome } from './types'
import { smallest } from './types'

type LossyStep = { maxDimension: number; quality: number }
type Candidate = { step: string; bytes: Uint8Array }

// Best quality first. A step is only tried when the one before it was over
// the target. Photos nearly always fit on the first.
const LOSSY_STEPS: ReadonlyArray<LossyStep> = [
  { maxDimension: 2400, quality: 80 },
  { maxDimension: 2400, quality: 70 },
  { maxDimension: 2000, quality: 70 },
  { maxDimension: 2000, quality: 60 },
  { maxDimension: 1600, quality: 60 },
  { maxDimension: 1600, quality: 50 },
  { maxDimension: 1200, quality: 50 },
]

// Screenshots and diagrams keep their crisp text as lossless WebP when that fits.
const LOSSLESS_MAX_DIMENSION = 2400

// About 100 megapixels: far beyond any phone photo, and a guard against
// decompression bombs.
const MAX_INPUT_PIXELS = 100_000_000

const WEBP_EFFORT = 4

const fitWithin = (maxDimension: number) => ({
  width: maxDimension,
  height: maxDimension,
  fit: 'inside' as const,
  withoutEnlargement: true,
})

const encodeWebp = async (
  source: Sharp,
  maxDimension: number,
  options: WebpOptions
): Promise<Uint8Array> =>
  new Uint8Array(
    await source
      .clone()
      .resize(fitWithin(maxDimension))
      .webp({ effort: WEBP_EFFORT, ...options })
      .toBuffer()
  )

const isPixelLimitError = (error: unknown): boolean =>
  error instanceof Error && /pixel limit/i.test(error.message)

/**
 * Converts an image to WebP: oriented by its EXIF data, stripped of metadata
 * (which removes things like GPS location), and no larger than 2400px on its
 * long side. Walks down a quality and size ladder until the result fits the
 * target; if nothing does, returns the smallest result when it is within the
 * cap and rejects as `too-large` when it isn't.
 */
export const optimizeImage: FileOptimizer = async (
  input,
  declaredType,
  { limits }
) => {
  const attempts: Array<OptimizeAttempt> = []
  try {
    // Re-encoding drops metadata unless asked to keep it, so none is kept.
    const source = sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: 'error',
    }).rotate()

    const candidates: Array<Candidate> = []
    const encode = async (
      step: string,
      maxDimension: number,
      options: WebpOptions
    ): Promise<Candidate> => {
      const startedAt = Date.now()
      const bytes = await encodeWebp(source, maxDimension, options)
      attempts.push({
        step,
        bytes: bytes.byteLength,
        ms: Date.now() - startedAt,
      })
      const candidate = { step, bytes }
      candidates.push(candidate)
      return candidate
    }
    const accept = ({ step, bytes }: Candidate): OptimizeOutcome => ({
      ok: true,
      bytes,
      fileType: 'webp',
      operation: `webp ${step}`,
      attempts,
    })

    if (declaredType === 'png') {
      const lossless = await encode(
        `lossless max ${LOSSLESS_MAX_DIMENSION}px`,
        LOSSLESS_MAX_DIMENSION,
        { lossless: true }
      )
      if (lossless.bytes.byteLength <= limits.target) return accept(lossless)
    }

    for (const { maxDimension, quality } of LOSSY_STEPS) {
      const lossy = await encode(
        `q${quality} max ${maxDimension}px`,
        maxDimension,
        { quality }
      )
      if (lossy.bytes.byteLength <= limits.target) return accept(lossy)
    }

    const best = smallest(candidates)
    return best.bytes.byteLength <= limits.cap
      ? accept(best)
      : {
          ok: false,
          reason: 'too-large',
          sizeBytes: best.bytes.byteLength,
          detail: `smallest was ${best.step}`,
          attempts,
        }
  } catch (error) {
    return {
      ok: false,
      reason: isPixelLimitError(error) ? 'too-large' : 'invalid-content',
      detail: describeError(error),
      attempts,
    }
  }
}
