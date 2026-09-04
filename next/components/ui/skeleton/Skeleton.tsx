import { cn } from '../../../lib/common-utils'
import type { SkeletonBoxProps } from '../../../types/components/Skeleton.types'
import { Box } from '../../common/Box'

export function Skeleton({
  className,
  children,
  loading,
  ...rest
}: SkeletonBoxProps) {
  return (
    <Box
      className={cn(
        'relative overflow-hidden rounded-md',
        'before:pointer-events-none before:absolute before:inset-0 before:z-50 before:from-brand before:to-brand-700 before:opacity-100',
        loading && 'before:animate-pulse',
        !loading && 'before:opacity-0 before:duration-2000',
        className
      )}
      {...rest}
    >
      {children}
    </Box>
  )
}
