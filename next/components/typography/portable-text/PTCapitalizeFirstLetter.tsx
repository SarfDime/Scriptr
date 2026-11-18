'use client'

import { useEditor } from '@portabletext/editor'
import { defineBehavior, execute } from '@portabletext/editor/behaviors'
import { getBlockTextBefore } from '@portabletext/editor/selectors'
import { capitalize } from '@shared/utils/common-utils'
import { useEffect } from 'react'

/**
 * Upper-cases the first character typed at the start of the block, so a title
 * never begins lowercase. Mount it once inside `EditorProvider`; the behavior
 * only fires while the block has nothing before the caret.
 */
export const PTCapitalizeFirstLetter = () => {
  const editor = useEditor()

  useEffect(() => {
    if (!editor) return

    return editor.registerBehavior({
      behavior: defineBehavior({
        on: 'insert.text',
        guard: ({ event, snapshot }) => {
          const first = event.text.charAt(0)
          return (
            first !== first.toUpperCase() && getBlockTextBefore(snapshot) === ''
          )
        },
        actions: [
          ({ event }) => [
            execute({ type: 'insert.text', text: capitalize(event.text) }),
          ],
        ],
      }),
    })
  }, [editor])

  return null
}
