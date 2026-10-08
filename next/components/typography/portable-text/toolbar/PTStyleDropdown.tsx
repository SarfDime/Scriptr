'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { getActiveStyle } from '@portabletext/editor/selectors'
import { PT_STRINGS } from '@shared/config/pt-strings'
import type { FontSizeType } from '@shared/config/shared-pt-config'
import { FONT_SIZE_STYLES } from '@shared/config/shared-pt-config'
import { cn } from '@/lib/common-utils'
import { PTDropdown } from './PTDropdown'
import { resolveStyleIcon, STYLE_ICON } from './PTicons'
import { RowButton } from './PTRowButton'

/** Dropdown for font-size selection in PT Editor toolbar. Renders the actual font-size */
export const PTStyleDropdown = ({
  excludedStyles = [],
}: {
  excludedStyles?: ReadonlyArray<FontSizeType>
}) => {
  const editor = useEditor()
  const activeStyle = useEditorSelector(editor, getActiveStyle) ?? 'normal'
  const styles = FONT_SIZE_STYLES.filter(
    (style) =>
      style.name !== '-' &&
      (style.name === 'normal' || !excludedStyles.includes(style.name))
  )

  const toggle = (name: string) => {
    editor.send({ type: 'style.toggle', style: name })
    editor.send({ type: 'focus' })
  }

  return (
    <PTDropdown
      title={PT_STRINGS.toolbar.style.title}
      icon={resolveStyleIcon(activeStyle) ?? STYLE_ICON}
      active={activeStyle !== 'normal'}
      iconClass='w-auto items-center justify-center !text-xs'
    >
      {styles.map((s) => (
        <RowButton
          key={s.name}
          icon={resolveStyleIcon(s.name)}
          active={activeStyle === s.name}
          onClick={() => toggle(s.name)}
          iconClass={cn('w-full', s.name !== 'normal' && 'justify-start')}
        />
      ))}
    </PTDropdown>
  )
}
