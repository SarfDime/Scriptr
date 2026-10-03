'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { getSelectedTextBlocks } from '@portabletext/editor/selectors'
import { PT_STRINGS } from '@shared/config/pt-strings'
import {
  ALIGNMENT_DECORATORS,
  type AlignmentType,
} from '@shared/config/shared-pt-config'
import { PTDropdown } from './PTDropdown'
import { ALIGN_ICON, resolveDecoratorIcon } from './PTicons'
import { RowButton } from './PTRowButton'

const getTextAlignment = (value: unknown): AlignmentType | undefined =>
  ALIGNMENT_DECORATORS.find((item) => item.name === value)?.name

export const PTAlignmentDropdown = () => {
  const editor = useEditor()
  const selectedBlocks = useEditorSelector(editor, getSelectedTextBlocks)
  const selectedAlignments = new Set(
    selectedBlocks
      .map((block) =>
        'textAlign' in block.node
          ? getTextAlignment(block.node.textAlign)
          : undefined
      )
      .filter((alignment): alignment is AlignmentType => Boolean(alignment))
  )
  const activeAlignment =
    selectedBlocks.length > 0 && selectedAlignments.size === 1
      ? [...selectedAlignments][0]
      : undefined

  const setAlignment = (alignment: AlignmentType) => {
    selectedBlocks.forEach((block) => {
      editor.send({
        type: 'block.set',
        at: block.path,
        props: { textAlign: alignment },
      })
    })
    editor.send({ type: 'focus' })
  }

  return (
    <PTDropdown
      label={PT_STRINGS.toolbar.align.label}
      title={PT_STRINGS.toolbar.align.title}
      icon={ALIGN_ICON}
      icons={
        activeAlignment
          ? [resolveDecoratorIcon(activeAlignment)].filter(
              (icon): icon is NonNullable<typeof icon> => Boolean(icon)
            )
          : undefined
      }
    >
      {ALIGNMENT_DECORATORS.map(({ name, label }) => (
        <RowButton
          key={name}
          icon={resolveDecoratorIcon(name)}
          active={activeAlignment === name}
          onClick={() => setAlignment(name)}
        >
          {label}
        </RowButton>
      ))}
    </PTDropdown>
  )
}
