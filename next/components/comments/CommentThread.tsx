import { MAX_THREAD_DEPTH } from '@shared/config/shared-constants'
import { Children, isValidElement, type ReactNode } from 'react'
import { Box } from '@/components/common/Box'
import { cn } from '@/lib/common-utils'

/**
 * Layout for the replies under one comment and, while still within
 * `MAX_THREAD_DEPTH`, a thread line down the left. Deeper replies stay flat at
 * the same indent.
 *
 * It takes already-rendered replies as `children` instead of rendering
 * `CommentItem` itself, which keeps it free of a circular import with it.
 * The thread line starts at the parent avatar's centre, hence the different
 * margins for the 28px root avatar vs the 24px reply ones.
 */
export function CommentThread({
  depth,
  children,
}: {
  depth: number
  children: ReactNode
}) {
  const isThreaded = depth < MAX_THREAD_DEPTH
  const replies = Children.toArray(children).filter(isValidElement)

  return (
    <Box
      className={cn(
        'ui-stack gap-4',
        isThreaded &&
          cn(
            'border-l-2 border-brand/25 pl-3 sm:pl-4',
            depth === 0 ? 'ml-3.5' : 'ml-3'
          )
      )}
    >
      {replies}
    </Box>
  )
}
