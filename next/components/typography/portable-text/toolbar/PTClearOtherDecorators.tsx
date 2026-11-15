'use client'

import { useEditor } from '@portabletext/editor'
import { defineBehavior } from '@portabletext/editor/behaviors'
import {
  DECORATOR_CATEGORIES,
  getDecoratorCategory,
} from '@shared/config/shared-pt-config'
import { useEffect } from 'react'

/**
 * Mount this once inside `EditorProvider`, alongside other plugins
 * (EventListenerPlugin, Toolbar). Registers a behavior that, on
 * `decorator.add`, removes any other decorator in the same category
 * (alignment/color/weight) before applying the one just picked — so
 * choosing "center" clears "left"/"right" if either was already active.
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
      }) => {
        return (
          event.decorator !== 'clear-formatting' &&
          !event._originalEvent &&
          Boolean(getDecoratorCategory(event.decorator))
        )
      },
      actions: [
        ({ event }) => {
          const category = getDecoratorCategory(event.decorator)
          if (!category) return [] // satisfies types; guard already filtered this out

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
