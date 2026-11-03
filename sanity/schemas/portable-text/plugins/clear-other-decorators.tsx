import { useEditor } from '@portabletext/editor'
import { defineBehavior } from '@portabletext/editor/behaviors'
import {
  DECORATOR_CATEGORIES,
  getDecoratorCategory,
} from '@shared/config/shared-pt-config'
import { useEffect } from 'react'

/**
 * Registers a behavior that clears every other decorator in the same set and
 * then applies the selected one, so choosing "center" clears "left"/"right".
 *
 * The categories themselves live in `shared-pt-config` because the web editor
 * enforces the same rule and the map has to agree in both.
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
        // _originalEvent is a custom property re-sent on the replayed event
        // to prevent recursion — if a future editor version stops
        // forwarding unknown event properties through `raise`, this breaks.
        event: { decorator: string; _originalEvent?: boolean }
      }) =>
        event.decorator !== 'clear-formatting' &&
        !event._originalEvent &&
        Boolean(getDecoratorCategory(event.decorator)),
      actions: [
        ({ event }) => {
          const category = getDecoratorCategory(event.decorator)
          if (!category) return []

          const siblingsToRemove = DECORATOR_CATEGORIES[category]
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
