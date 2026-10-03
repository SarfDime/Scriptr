'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { getActiveListItem } from '@portabletext/editor/selectors'
import { PT_STRINGS } from '@shared/config/pt-strings'
import { LIST_ITEMS } from '@shared/config/shared-pt-config'
import { PTDropdown } from './PTDropdown'
import { LIST_ICON, LIST_ICONS } from './PTicons'
import { RowButton } from './PTRowButton'

/** A dropdown for pt lists */
export const PTListDropdown = () => {
  const editor = useEditor()
  const activeList = useEditorSelector(editor, getActiveListItem)

  const toggle = (name: string) => {
    editor.send({ type: 'list item.toggle', listItem: name })
    editor.send({ type: 'focus' })
  }

  return (
    <PTDropdown
      label={PT_STRINGS.toolbar.list.label}
      title={PT_STRINGS.toolbar.list.title}
      icon={LIST_ICON}
    >
      {LIST_ITEMS.map((l) => (
        <RowButton
          key={l.name}
          icon={LIST_ICONS[l.name]}
          active={activeList === l.name}
          onClick={() => toggle(l.name)}
        >
          {l.label}
        </RowButton>
      ))}
    </PTDropdown>
  )
}
