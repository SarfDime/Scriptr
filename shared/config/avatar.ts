import type { FileType } from '../types/api.types'

/**
 * Profile pictures. Whatever is uploaded is cropped square, shrunk, and stored
 * as WebP in a public bucket under a stable URL, because that URL is stored on
 * the profile and used directly as an image source on cached pages.
 */

/** Types accepted for an avatar upload. It is always stored as WebP. */
export const AVATAR_FILE_TYPES: ReadonlyArray<FileType> = [
  'jpg',
  'jpeg',
  'png',
  'webp',
]

/** Largest file a user may pick (a phone photo); it is shrunk to a few KB. */
export const AVATAR_MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Stored avatars are this many pixels square, enough for the largest place
 * one is shown at twice the pixel density. */
export const AVATAR_SIZE_PX = 320

/** What the optimizer aims for, and the most an avatar may be once stored. */
export const AVATAR_TARGET_STORED_BYTES = 100 * 1024
export const AVATAR_MAX_STORED_BYTES = 200 * 1024
