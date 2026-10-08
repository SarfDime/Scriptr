'use client'

import { PORTABLE_TEXT_LIMITS } from '@shared/config/portable-text-limits'
import type { PortableTextValue } from '@shared/types/portable-text.types'
import {
  isCommentPortableTextValue,
  isValidCommentPortableTextValue,
  portableTextJsonByteLength,
  portableTextToPlainText,
} from '@shared/utils/portable-text.utils'
import { useState } from 'react'

/**
 * State for one rich-text draft (a new comment or a reply). `editorKey` is
 * bumped on `reset` so the uncontrolled editor remounts empty.
 */
export function useRichTextDraft() {
  const [content, setContent] = useState<PortableTextValue>()
  const [editorKey, setEditorKey] = useState(0)

  const plainText = portableTextToPlainText(content).trim()
  const hasMinimumLength =
    plainText.length >= PORTABLE_TEXT_LIMITS.commentMinimumCharacters
  const isTooLarge =
    content !== undefined &&
    isCommentPortableTextValue(content) &&
    portableTextJsonByteLength(content) >
      PORTABLE_TEXT_LIMITS.commentMaximumBytes
  const isValid =
    content !== undefined &&
    hasMinimumLength &&
    isValidCommentPortableTextValue(content)

  const reset = () => {
    setContent(undefined)
    setEditorKey((key) => key + 1)
  }

  return {
    content,
    setContent,
    editorKey,
    hasContent: plainText.length > 0,
    characterCount: plainText.length,
    hasMinimumLength,
    isTooLarge,
    isValid,
    reset,
  }
}
