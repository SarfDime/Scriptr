import {
  AVATAR_FILE_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from '@shared/config/avatar'
import type { LocaleId } from '@shared/config/localization-constants'
import { UI_STRINGS_PACK } from '@shared/config/strings'
import { getFileExtension, isFileType } from '@shared/utils/api.utils'
import { getStrings } from '@shared/utils/localized-strings'

/** The `accept` value for the picker. Extensions rather than MIME types: the
 * upload is validated, and typed by the server, by extension, because browsers
 * report a MIME type inconsistently (a `.jpg` can arrive with an empty type). */
export const AVATAR_ACCEPT_ATTRIBUTE: ReadonlyArray<string> =
  AVATAR_FILE_TYPES.map((fileType) => `.${fileType}`)

/** Returns an error message, or null when the file can be uploaded. The API
 * applies the same type and size limits again; this only saves a round trip.
 * The language is an argument because this runs from a change handler, where a
 * hook is not available. */
export const validateAvatarFile = (
  file: File,
  locale: LocaleId
): string | null => {
  const { edit } = getStrings(UI_STRINGS_PACK, locale).profile
  const extension = getFileExtension(file.name)
  if (!isFileType(extension) || !AVATAR_FILE_TYPES.includes(extension)) {
    return edit.avatarInvalidType
  }
  if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
    return edit.avatarTooLarge(AVATAR_MAX_UPLOAD_BYTES / (1024 * 1024))
  }
  return null
}
