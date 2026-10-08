'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { PT_STRINGS } from '@shared/config/pt-strings'
import { activeDecoratorsSelector } from './activeDecoratorsSelector'
import { PTDropdown } from './PTDropdown'
import { type PTIconComponent, resolveDecoratorIcon } from './PTicons'
import { RowButton } from './PTRowButton'

/** One dropdown for a group of decorators (Format/Color/Weight/Align).
 * Mutual exclusivity for Color/Weight/Align is handled once, centrally,
 * by the `ClearOtherDecorators` plugin.
 */
export const DecoratorDropdown = ({
  label,
  title,
  names,
  fallbackIcon,
}: {
  label: string
  title: string
  names: ReadonlyArray<string>
  fallbackIcon?: PTIconComponent
}) => {
  const editor = useEditor()
  const selector = activeDecoratorsSelector(names)
  const active = useEditorSelector(editor, selector)

  const toggle = (name: string) => {
    editor.send({ type: 'decorator.toggle', decorator: name })
    editor.send({ type: 'focus' })
  }

  const icons = active
    .map((name) => resolveDecoratorIcon(name))
    .filter((icon): icon is PTIconComponent => Boolean(icon))

  return (
    <PTDropdown
      label={label}
      title={title}
      icon={fallbackIcon}
      icons={icons}
      active={active.length > 0}
    >
      {names.map((name) => (
        <RowButton
          key={name}
          icon={resolveDecoratorIcon(name)}
          active={active.includes(name)}
          onClick={() => toggle(name)}
        >
          {PT_STRINGS.decoratorLabels[name] ??
            PT_STRINGS.weightLabels[name] ??
            name}
        </RowButton>
      ))}
    </PTDropdown>
  )
}
