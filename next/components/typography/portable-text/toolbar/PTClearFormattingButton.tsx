'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { getSelectedTextBlocks } from '@portabletext/editor/selectors'
import Remove from '@sanity/icons/Remove'
import { PT_STRINGS } from '@shared/config/pt-strings'
import {
  ALIGNMENT_DECORATORS,
  COLOR_DECORATORS,
  DEFAULT_DECORATOR_NAMES,
  LIST_ITEMS,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'
import { Button } from '@/components/common/Button'

const ALL_DECORATOR_NAMES = [
  ...DEFAULT_DECORATOR_NAMES,
  ...COLOR_DECORATORS.map((d) => d.name),
  ...WEIGHT_DECORATORS.map((d) => d.name),
  ...ALIGNMENT_DECORATORS.map((d) => d.name),
]

/** Clears formatting for PT Editor */
export const ClearFormattingButton = () => {
  const editor = useEditor()
  const selectedBlocks = useEditorSelector(editor, getSelectedTextBlocks)

  const handleClear = () => {
    ALL_DECORATOR_NAMES.forEach((name) => {
      editor.send({ type: 'decorator.remove', decorator: name })
    })

    LIST_ITEMS.map((list) => list.name).forEach((name) => {
      editor.send({ type: 'list item.remove', listItem: name })
    })
    selectedBlocks.forEach((block) => {
      editor.send({
        type: 'block.unset',
        at: block.path,
        props: ['textAlign'],
      })
    })

    editor.send({ type: 'style.toggle', style: 'normal' })
    editor.send({ type: 'focus' })
  }

  return (
    <Button
      onClick={handleClear}
      aria-label={PT_STRINGS.toolbar.clearFormatting.title}
      title={PT_STRINGS.toolbar.clearFormatting.title}
      className='button button-sm danger rounded'
    >
      <Remove className='flex h-5 w-5 shrink-0' />
    </Button>
  )
}
