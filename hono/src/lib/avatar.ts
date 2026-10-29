import type { Context } from 'hono'
import type { HonoEnv } from '../types/env.types'
import { honoLog } from './logger'
import { deleteR2Files } from './r2'

/** Avatars live in the script bucket, under their own prefix and one key per
 * user, so they never mix with script files and a re-upload overwrites the
 * previous picture instead of leaving another object behind. */
const AVATAR_KEY_PREFIX = 'avatars'

/** The one key a user's avatar lives under. */
export const avatarKey = (userId: string): string =>
  `${AVATAR_KEY_PREFIX}/${userId}.webp`

/** The key without its extension, which is what the optimizer appends the
 * stored type to (always `.webp` for an avatar). */
export const avatarKeyBase = (userId: string): string =>
  `${AVATAR_KEY_PREFIX}/${userId}`

/**
 * The public URL an avatar is shown under. `version` changes on every upload:
 * the key is reused, so without it a browser or CDN that cached the previous
 * picture would keep showing it for a year. With it, each upload is a new URL
 * that can be cached immutably, like every other object in the bucket.
 */
export const buildAvatarUrl = (
  publicUrl: string,
  userId: string,
  version: string
): string =>
  `${publicUrl.replace(/\/+$/, '')}/${avatarKey(userId)}?v=${version}`

/**
 * Best-effort removal of a user's avatar object, when the account goes away (so
 * a deleted account's photo doesn't stay publicly reachable). Failures are
 * logged, never thrown. `remove` is injectable for tests, like the R2 client in
 * `createStagedUpload`.
 */
export const removeAvatarObject = async (
  c: Context<HonoEnv>,
  userId: string,
  remove: typeof deleteR2Files = deleteR2Files
): Promise<void> => {
  try {
    await remove(c, [{ bucket: c.env.R2_BUCKET, fileKey: avatarKey(userId) }])
  } catch (error) {
    honoLog({
      logLevel: 'warn',
      message: 'Failed to delete an avatar object',
      error,
    })
  }
}
