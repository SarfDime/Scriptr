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
  const [isHovered, setIsHovered] = useState(false)
  // Hover and focus never fire on a tap in mobile Safari, so touch devices get
  // an explicit toggle instead.
  const [isPinned, setIsPinned] = useState(false)
  const isVisible = isHovered || isPinned

  const handleClick = () => {
    if (window.matchMedia('(hover: hover)').matches) return
    setIsPinned((pinned) => !pinned)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return
    setIsPinned(false)
    setIsHovered(false)
  }

  return (
    <Box
      className={cn('relative inline-block', className)}
      onMouseOver={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
