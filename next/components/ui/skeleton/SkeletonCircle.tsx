import { cn } from '../../../lib/common-utils'
import type { SkeletonCircleProps } from '../../../types/components/Skeleton.types'
import { Box } from '../../common/Box'

export function SkeletonCircle({
  size = '8',
  className,
  ...rest
}: SkeletonCircleProps) {
  return (
    <Box
      className={cn('animate-pulse rounded-full', className)}
      style={{
        width: size,
        height: size,
      }}
      {...rest}
    />
  )
}
