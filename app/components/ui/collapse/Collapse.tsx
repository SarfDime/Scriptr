'use client'

import { useState } from 'react'

import { cn } from '../../../lib/common-utils'
import type { CollapseProps } from '../../../types/components/Collapse.types'
import { Box } from '../../common/Box'
import { CollapseContent } from './CollapseContent'
import { CollapseTrigger } from './CollapseTrigger'

/** A component that renders a collapsible section.
 * It can take a title, children, a custom trigger, and other props.
 * It will render a collapsible section with a default trigger
 * that shows the title and an arrow. The arrow is hidden if showArrow is set to false.
 */
export const Collapsible = ({
  title,
  children,
  customTrigger,
  showArrow = true,
  rootProps,
  contentProps,
  triggerProps,
  triggerTitleProps,
  triggerArrowProps,
}: CollapseProps) => {
  const [isOpen, setIsOpen] = useState(customTrigger?.isOpen ?? false)
  const toggleCollapse = () => {
    if (customTrigger) {
      customTrigger?.toggle?.()
      return
    }
    setIsOpen(!isOpen)
  }

  const currentIsOpen = customTrigger ? customTrigger?.isOpen : isOpen

  return (
    <Box
      {...rootProps}
      className={cn(
        'collapsible-root group/collapsible-root',
        rootProps?.className
      )}
    >
      {customTrigger?.trigger ? (
        customTrigger?.trigger
      ) : (
        <CollapseTrigger
          {...triggerProps}
          title={title}
          isOpen={isOpen}
          showArrow={showArrow}
          triggerArrowProps={triggerArrowProps}
          triggerTitleProps={triggerTitleProps}
          currentIsOpen={currentIsOpen}
          aria-expanded={currentIsOpen}
          aria-controls='menu-list'
          toggleCollapse={toggleCollapse}
        />
      )}
      <CollapseContent {...contentProps} currentIsOpen={currentIsOpen}>
        {children}
      </CollapseContent>
    </Box>
  )
}
