import type { LocaleId } from '@shared/config/localization-constants'
import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import { COMMENT_STRINGS_PACK } from '@shared/strings/comments-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import { getStrings } from '@shared/utils/localized-strings'
import {
  isCommentPortableTextValue,
  isValidCommentPortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'

/** Returns the message explaining why a comment or reply can't be posted, or
 * `null` when it can.
 *
 * The language is an argument rather than a module-level read: this runs from a
 * submit handler, where a hook is not available, and a process-wide value would
 * let one reader's choice decide another reader's message. The caller has the
 * locale from `useLocale()`. */
export const validateCommentContent = (
  value: PortableTextValue,
  locale: LocaleId
): string | null => {
  const strings = getStrings(COMMENT_STRINGS_PACK, locale)
  const length = portableTextToPlainText(value).trim().length
  if (length < PORTABLE_TEXT_LIMITS.commentMinimumCharacters) {
    return strings.general.minimumLength()
  }
  if (
    isCommentPortableTextValue(value) &&
    portableTextJsonByteLength(value) > PORTABLE_TEXT_LIMITS.commentMaximumBytes
  ) {
    return strings.validation.maximumSize(
      PORTABLE_TEXT_LIMITS.commentMaximumBytes
    )
  }
  if (!isValidCommentPortableTextValue(value)) {
    return strings.validation.minimumLength(
      PORTABLE_TEXT_LIMITS.commentMinimumCharacters
    )
  }
  return null
}
