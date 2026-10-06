'use client'

import type { PortableTextValue } from '@shared/types/portable-text.types'
import { portableTextToPlainText } from '@shared/utils/portable-text.utils'
import { useState } from 'react'

/**
 * State for one rich-text draft (a new comment or a reply). `editorKey` is
 * bumped on `reset` so the uncontrolled editor remounts empty.
 */
export function useRichTextDraft() {
  const [content, setContent] = useState<PortableTextValue>()
  const [editorKey, setEditorKey] = useState(0)

  const plainText = portableTextToPlainText(content).trim()

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
    reset,
  }
}
