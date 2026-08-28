import { useState } from 'react'

import { cn, getPlacementClasses } from '../../lib/common-utils'
import type { ComponentPlacement } from '../../types/component.types'
import { Box, type BoxProps } from '../common/Box'

type PopoverProps = {
  trigger: React.ReactNode
  innerWrapperClass?: string
} & BoxProps &
  ComponentPlacement

export const Popover = ({
  children,
  trigger,
  className,
  innerWrapperClass,
  placement = 'center',
  offsetY,
  offsetX,
  ...rest
}: PopoverProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Box
      className={cn('relative inline-block', className)}
      onMouseOver={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      {...rest}
    >
      {trigger}
      <Box
        className={cn(
          'absolute z-999 transition-opacity duration-200',
          getPlacementClasses({ placement, offsetY, offsetX }),
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          innerWrapperClass
        )}
        tabIndex={-1}
      >
        {children}
      </Box>
    </Box>
  )
}
