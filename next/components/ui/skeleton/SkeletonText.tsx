import { cn } from '../../../lib/common-utils'
import type { SkeletonTextProps } from '../../../types/components/Skeleton.types'
import { Box } from '../../common/Box'

export function SkeletonText({
  noOfLines = 3,
  className,
  ...rest
}: SkeletonTextProps) {
  return (
    <Box {...rest} className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: noOfLines }).map((_, index) => (
        <Box
          // A skeleton line has no identity of its own: the position is the key.
          key={`skeleton-text-${index}`}
          className={cn('h-4 animate-pulse rounded', {
            'max-w-[80%]': index === noOfLines - 1,
          })}
        />
      ))}
    </Box>
  )
}
