import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import { COMMENT_STRINGS } from '@shared/strings/comments-strings'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import {
  isCommentPortableTextValue,
  isValidCommentPortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'

/** Returns the message explaining why a comment or reply can't be posted, or
 * `null` when it can. */
export const validateCommentContent = (
  value: PortableTextValue
): string | null => {
  const length = portableTextToPlainText(value).trim().length
  if (length < PORTABLE_TEXT_LIMITS.commentMinimumCharacters) {
    return COMMENT_STRINGS.general.minimumLength()
  }
  if (
    isCommentPortableTextValue(value) &&
    portableTextJsonByteLength(value) > PORTABLE_TEXT_LIMITS.commentMaximumBytes
  ) {
    return COMMENT_STRINGS.validation.maximumSize(
      PORTABLE_TEXT_LIMITS.commentMaximumBytes
    )
  }
  if (!isValidCommentPortableTextValue(value)) {
    return COMMENT_STRINGS.validation.minimumLength(
      PORTABLE_TEXT_LIMITS.commentMinimumCharacters
    )
  }
  return null
}
