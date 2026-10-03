'use client'

import { useEditor } from '@portabletext/editor'
import { defineBehavior } from '@portabletext/editor/behaviors'
import {
  ALIGNMENT_DECORATORS,
  type AlignmentType,
  COLOR_DECORATORS,
  type ColorsType,
  type FontWeightType,
  WEIGHT_DECORATORS,
} from '@shared/config/shared-pt-config'
import { useEffect } from 'react'

/**
 * Same categorization your Studio version uses, just reading `.name`
 * instead of `.value` — that's the field your shared config actually
 * exports (see schema.ts, which builds the decorator schema off `.name`).
 */
const DecoratorCategories = {
  alignment: ALIGNMENT_DECORATORS.map((d) => d.name),
  color: COLOR_DECORATORS.map((d) => d.name),
  weight: WEIGHT_DECORATORS.map((d) => d.name),
}

const getDecoratorCategory = (decorator: string) => {
  if (DecoratorCategories.color.includes(decorator as ColorsType))
    return 'color'
  if (DecoratorCategories.weight.includes(decorator as FontWeightType))
    return 'weight'
  if (DecoratorCategories.alignment.includes(decorator as AlignmentType))
    return 'alignment'
  return undefined
}

/**
 * Mount this once inside `EditorProvider`, alongside other plugins
 * (EventListenerPlugin, Toolbar). Registers a behavior that, on
 * `decorator.add`, removes any other decorator in the same category
 * (alignment/color/weight) before applying the one just picked — so
 * choosing "center" clears "left"/"right" if either was already active.
 */
export const ClearOtherDecorators = () => {
  // TODO: Make a shared thing, is the same in sanity
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
        const category = getDecoratorCategory(event.decorator)
        return (
          event.decorator !== 'clear-formatting' &&
          !event._originalEvent &&
          Boolean(category)
        )
      },
      actions: [
        ({ event }) => {
          const category = getDecoratorCategory(event.decorator)
          if (!category) return [] // satisfies types; guard already filtered this out

          const siblingsToRemove = DecoratorCategories[category]
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
