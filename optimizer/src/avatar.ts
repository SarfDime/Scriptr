import {
  AVATAR_MAX_STORED_BYTES,
  AVATAR_SIZE_PX,
  AVATAR_TARGET_STORED_BYTES,
} from '@shared/config/avatar'
import sharp from 'sharp'
import { describeError } from './format'
import type { FileOptimizer, OptimizeAttempt, SizeLimits } from './types'

/** The limits an avatar is held to, instead of the script file ones. */
export const AVATAR_LIMITS: SizeLimits = {
  target: AVATAR_TARGET_STORED_BYTES,
  cap: AVATAR_MAX_STORED_BYTES,
}

// A square this small nearly always fits on the first try; the rest is a net.
const QUALITIES = [80, 70, 60, 50] as const

// About 100 megapixels: far beyond any phone photo, and a guard against
// decompression bombs.
const MAX_INPUT_PIXELS = 100_000_000

/**
 * Turns a picture into an avatar: oriented by its EXIF data, cropped to a
 * square around the most interesting part (so a face in a portrait stays in
 * frame), scaled to `AVATAR_SIZE_PX`, stripped of metadata (GPS included), and
 * stored as WebP.
 */
export const optimizeAvatar: FileOptimizer = async (
  input,
  _declaredType,
  { limits }
) => {
  const attempts: Array<OptimizeAttempt> = []
  try {
    const source = sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: 'error',
    })
      .rotate()
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, {
        fit: 'cover',
        position: sharp.strategy.attention,
      })

    let smallest: Uint8Array | null = null
    for (const quality of QUALITIES) {
      const startedAt = Date.now()
      const bytes = new Uint8Array(
        await source.clone().webp({ quality }).toBuffer()
      )
      attempts.push({
        step: `q${quality} ${AVATAR_SIZE_PX}px`,
        bytes: bytes.byteLength,
        ms: Date.now() - startedAt,
      })
      if (bytes.byteLength <= limits.target) {
        return {
          ok: true,
          bytes,
          fileType: 'webp',
          operation: `avatar webp q${quality} ${AVATAR_SIZE_PX}px`,
          attempts,
        }
      }
      if (!smallest || bytes.byteLength < smallest.byteLength) smallest = bytes
    }

    return smallest && smallest.byteLength <= limits.cap
      ? {
          ok: true,
          bytes: smallest,
          fileType: 'webp',
          operation: 'avatar webp (over target)',
          attempts,
        }
      : {
          ok: false,
          reason: 'too-large',
          sizeBytes: smallest?.byteLength,
          detail: 'smallest avatar was over the cap',
          attempts,
        }
  } catch (error) {
    return {
      ok: false,
      reason: 'invalid-content',
      detail: describeError(error),
      attempts,
    }
  }
}
