'use client'

import { useEditor, useEditorSelector } from '@portabletext/editor'
import { PT_STRINGS } from '@shared/config/pt-strings'
import type { COLOR_DECORATORS } from '@shared/config/shared-pt-config'
import { activeDecoratorsSelector } from './activeDecoratorsSelector'
import { PTDropdown } from './PTDropdown'
import { type PTIconComponent, resolveDecoratorIcon } from './PTicons'
import { RowButton } from './PTRowButton'

/** The toolbar's label for a decorator. Weight names spread first so a
 * decorator label wins where a name appears in both maps. */
const DECORATOR_LABELS = {
  ...PT_STRINGS.weightLabels,
  ...PT_STRINGS.decoratorLabels,
} as const

/** Every decorator this dropdown can be handed: the text styles `PT_STRINGS`
 * labels, plus the colour decorators, which have no entry there and fall back
 * to their own name. */
type DecoratorName =
  | keyof typeof DECORATOR_LABELS
  | (typeof COLOR_DECORATORS)[number]['name']

const hasLabel = (name: DecoratorName): name is keyof typeof DECORATOR_LABELS =>
  name in DECORATOR_LABELS

const decoratorLabel = (name: DecoratorName): string =>
  hasLabel(name) ? DECORATOR_LABELS[name] : name

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
  names: ReadonlyArray<DecoratorName>
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
          {decoratorLabel(name)}
        </RowButton>
      ))}
    </PTDropdown>
  )
}
