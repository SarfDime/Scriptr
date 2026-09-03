/** biome-ignore-all lint/style/useNamingConvention: <Need to be like this> */
import { useEditor } from '@portabletext/editor'
import { defineBehavior } from '@portabletext/editor/behaviors'
import { useEffect } from 'react'
import {
  AlignmentDecorators,
  ColorDecorators,
  WeightDecorators,
} from '../decorators'

/** Categorizes decorators */
const DecoratorCategories = {
  alignment: AlignmentDecorators.map((decorator) => decorator.value),
  color: ColorDecorators.map((decorator) => decorator.value),
  weight: WeightDecorators.map((decorator) => decorator.value),
}

/** Gets type of decorator */
const GetDecoratorType = (decorator: string) => {
  if (DecoratorCategories.color.some((color) => color === decorator)) {
    return 'color'
  }
  if (DecoratorCategories.weight.some((weight) => weight === decorator)) {
    return 'weight'
  }
  if (
    DecoratorCategories.alignment.some((alignment) => alignment === decorator)
  ) {
    return 'alignment'
  }
  return undefined
}

/** Registers a behavior that clears all other decorators of same type and applies the selected decorator.
 */
export const ClearOtherDecorators = () => {
  const editor = useEditor()

  useEffect(() => {
    if (!editor) return

    const clearOtherDecoratorsBehavior = defineBehavior({
      on: 'decorator.add',
      guard: ({
        event,
      }: {
        // _originalEvent is a custom property
        // sent to the original event to prevent recursion
        // if they update this to not spread properties it will break
        event: { decorator: string; _originalEvent?: boolean }
      }) => {
        const decoratorType = GetDecoratorType(event.decorator)

        return (
          event.decorator !== 'clear-formatting' &&
          !event._originalEvent &&
          decoratorType
        )
      },
      actions: [
        ({ event }) => {
          const decoratorType = GetDecoratorType(event.decorator)
          if (!decoratorType)
            // Just to satisfy types
            return []

          const siblingsToRemove = DecoratorCategories[decoratorType]
            .filter((decorator) => decorator !== event.decorator)
            .map(
              (decorator) =>
                ({
                  type: 'raise',
                  event: { type: 'decorator.remove', decorator },
                }) as const
            )

          return [
            ...siblingsToRemove,
            {
              type: 'raise',
              event: {
                type: 'decorator.add',
                decorator: event.decorator,
                _originalEvent: true,
              },
            },
          ]
        },
      ],
    })

    return editor.registerBehavior({ behavior: clearOtherDecoratorsBehavior })
  }, [editor])

  return null
}
