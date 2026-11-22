'use client'

import ChevronDownIcon from '@sanity/icons/ChevronDown'
import { Children, isValidElement, type ReactNode, useState } from 'react'
import { useUIStrings } from '@/providers/locale/use-strings'
import { Text } from '../typography/Text'
import { Box } from './Box'
import { Button } from './Button'

type ShowMoreListProps = {
  children: ReactNode
  /** Items on screen before the first Show more. */
  initial?: number
  /** Items each Show more adds. */
  step?: number
  /** Applied to the list wrapper, not the button. */
  className?: string
}

/** Lists are already rendered by their caller; this only reveals them a page
 * at a time. The count resets when the list's items change — another year, a
 * filter — so switching never lands on an already-expanded list. */
export const ShowMoreList = ({
  children,
  initial = 4,
  step = 4,
  className,
}: ShowMoreListProps) => {
  const ui = useUIStrings()
  const items = Children.toArray(children)
  const signature = items
    .map((item) => (isValidElement(item) ? String(item.key) : ''))
    .join('|')
  const [renderedSignature, setRenderedSignature] = useState(signature)
  const [visibleCount, setVisibleCount] = useState(initial)

  if (signature !== renderedSignature) {
    setRenderedSignature(signature)
    setVisibleCount(initial)
  }

  return (
    <>
      <Box className={className}>{items.slice(0, visibleCount)}</Box>
      {items.length > visibleCount && (
        <Button
          onClick={() => setVisibleCount((count) => count + step)}
          className='button subtle w-full gap-2 py-3 ui-body'
        >
          <Text>{ui.general.showMore}</Text> <ChevronDownIcon />
        </Button>
      )}
    </>
  )
}
