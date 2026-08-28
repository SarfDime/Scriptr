import { SpinnerIcon } from '@sanity/icons/Spinner'

import { cn } from '../../lib/common-utils'
import type { IconProps } from '../../types/component.types'
import type { BoxProps } from '../common/Box'
import { Box } from '../common/Box'

export const LoadingSpinner = ({
  iconProps,
  ...rest
}: { iconProps?: IconProps } & BoxProps) => {
  return (
    <Box
      className={cn(
        'pointer-events-none absolute inset-0 z-50 flex items-center justify-center gap-1 bg-gray-400 opacity-100',
        rest?.className
      )}
      {...rest}
    >
      <SpinnerIcon
        className={cn('h-5 w-5 animate-spin', iconProps?.className)}
      />
    </Box>
  )
}
