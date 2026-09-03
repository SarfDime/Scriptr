import { useEditor } from '@portabletext/editor'
import {
  type BehaviorAction,
  defineBehavior,
} from '@portabletext/editor/behaviors'
import { useEffect } from 'react'
import { DEFAULT_ANNOTATIONS, DEFAULT_DECORATORS } from 'sanity'
import { Annotations } from '../annotations'
import { AllDecorators } from '../decorators'
import { DefaultStyles } from '../style-blocks'

/**
 * Aggregates all available formatting options including decorators, styles, lists, and annotations.
 */
const FormattingBlocks = {
  decorators: [...DEFAULT_DECORATORS, ...AllDecorators].map(
    (decorator) => decorator.value
  ),

  styles: [
    ...DefaultStyles.flatMap((style) =>
      style.value !== '-' ? [style.value] : []
    ),
    'quote',
  ],
  annotations: [...Annotations, ...DEFAULT_ANNOTATIONS].map((annotation) => {
    return {
      name: annotation.name,
    }
  }),
}

/**
 * Registers a behavior that clears all formatting (decorators, styles, lists, and annotations) when triggered.
 */
export const ClearFormattingPlugin = () => {
  const editor = useEditor()

  useEffect(() => {
    if (!editor) return

    const clearFormattingBehavior = defineBehavior({
      on: 'decorator.toggle',
      guard: ({ event }) => {
        return event?.decorator === 'clear-formatting'
      },
      actions: [
        () => {
          const events: Array<BehaviorAction> = [
            ...FormattingBlocks.decorators.map((decorator) => {
              return {
                type: 'raise',
                event: { type: 'decorator.remove', decorator },
              } as const
            }),
            ...FormattingBlocks.styles.map((style) => {
              return {
                type: 'raise',
                event: { type: 'style.remove', style },
              } as const
            }),
            ...FormattingBlocks.annotations.map((annotation) => {
              return {
                type: 'raise',
                event: {
                  type: 'annotation.remove',
                  annotation,
                },
              } as const
            }),
          ]
          return events
        },
      ],
    })

    const unregisterBehavior = editor.registerBehavior({
      behavior: clearFormattingBehavior,
    })

    return () => unregisterBehavior()
  }, [editor])

  return null
}
