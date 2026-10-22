import { UI_STRINGS } from '@shared/config/strings'

/**
 * TODO(r2-optimization): flip to true once the avatar upload route exists
 * (see `uploadMyAvatar` in lib/api/profile-api.ts). While false the edit
 * dialog shows the picker disabled, so no file can be chosen and the upload
 * step never runs.
 */
export const AVATAR_UPLOAD_ENABLED = false

export const AVATAR_ACCEPTED_TYPES: ReadonlyArray<string> = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

/**
 * Placeholder limit. TODO(r2-optimization): the real limit comes with the
 * optimization pipeline and should move to `shared/config/` so the upload
 * route and this check read the same value.
 */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

/** Returns an error message, or null when the file can be uploaded. */
export const validateAvatarFile = (file: File): string | null => {
  if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
    return UI_STRINGS.profile.edit.avatarInvalidType
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return UI_STRINGS.profile.edit.avatarTooLarge(
      AVATAR_MAX_BYTES / (1024 * 1024)
    )
  }
  return null
}
