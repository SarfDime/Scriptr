import {
  AVATAR_FILE_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from '@shared/config/avatar'
import { UI_STRINGS } from '@shared/config/strings'
import { getFileExtension, isFileType } from '@shared/utils/api.utils'

/** The `accept` value for the picker. Extensions rather than MIME types: the
 * upload is validated, and typed by the server, by extension, because browsers
 * report a MIME type inconsistently (a `.jpg` can arrive with an empty type). */
export const AVATAR_ACCEPT_ATTRIBUTE: ReadonlyArray<string> =
  AVATAR_FILE_TYPES.map((fileType) => `.${fileType}`)

/** Returns an error message, or null when the file can be uploaded. The API
 * applies the same type and size limits again; this only saves a round trip. */
export const validateAvatarFile = (file: File): string | null => {
  const extension = getFileExtension(file.name)
  if (!isFileType(extension) || !AVATAR_FILE_TYPES.includes(extension)) {
    return UI_STRINGS.profile.edit.avatarInvalidType
  }
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
    return UI_STRINGS.profile.edit.avatarTooLarge(
      AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024)
    )
  }
  return null
}
