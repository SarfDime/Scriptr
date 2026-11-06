'use client'

import { useEffect, useId, useState } from 'react'

import { cn, getPlacementClasses } from '../../lib/common-utils'
import { Z_INDEX } from '../../styles/style'
import type { ComponentPlacement } from '../../types/component.types'
import { Box, type BoxProps } from '../common/Box'

/**
 * `hover` is a tooltip: it opens on hover or focus and closes when the pointer
 * or the focus leaves. `click` is a disclosure panel — the trigger toggles it,
 * an outside press or Escape closes it, and its content only exists while it is
 * open, so a long list costs nothing while it is closed.
 */
type PopoverMode = 'hover' | 'click'

type PopoverProps = {
  trigger: React.ReactNode
  innerWrapperClass?: string
  /** Defaults to `hover`, which is what the tooltips want. */
  mode?: PopoverMode
} & BoxProps &
  ComponentPlacement

/** Marks the panel, so a click inside it is content rather than a toggle. */
const PANEL_ATTRIBUTE = 'data-popover-panel'

export const Popover = ({
  children,
  trigger,
  className,
  innerWrapperClass,
  mode = 'hover',
  placement = 'center',
  offsetY,
  offsetX,
  ...rest
}: PopoverProps) => {
  const [isHovered, setIsHovered] = useState(false)
  // Hover and focus never fire on a tap in mobile Safari, so touch devices get
  // an explicit toggle instead.
  const [isPinned, setIsPinned] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const rootId = useId()
  const isClickMode = mode === 'click'
  const isVisible = isClickMode ? isOpen : isHovered || isPinned

  useEffect(() => {
    if (!isClickMode || !isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      // `Box` forwards no ref, so the root is found by its id instead.
      const root = document.getElementById(rootId)
      if (root?.contains(event.target as Node)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isClickMode, isOpen, rootId])

  const handleClick = (event: React.MouseEvent) => {
    if (isClickMode) {
      // A click on the panel itself (a row, a link) is content, not a toggle.
      if ((event.target as Element).closest?.(`[${PANEL_ATTRIBUTE}]`)) return
      setIsOpen((open) => !open)
      return
    }

    if (window.matchMedia('(hover: hover)').matches) return
    setIsPinned((pinned) => !pinned)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape') return
    setIsPinned(false)
    setIsHovered(false)
    setIsOpen(false)
  }

  return (
    <Box
      id={rootId}
      className={cn('relative inline-block', className)}
      onMouseOver={isClickMode ? undefined : () => setIsHovered(true)}
      onMouseLeave={isClickMode ? undefined : () => setIsHovered(false)}
      onFocus={isClickMode ? undefined : () => setIsHovered(true)}
      onBlur={isClickMode ? undefined : () => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {trigger}
      {(!isClickMode || isOpen) && (
        <Box
          {...{ [PANEL_ATTRIBUTE]: true }}
          className={cn(
            'absolute transition-opacity duration-200',
            Z_INDEX.POPOVER,
            getPlacementClasses({ placement, offsetY, offsetX }),
            isClickMode && 'mt-1',

            isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
            innerWrapperClass
          )}
          tabIndex={-1}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}
