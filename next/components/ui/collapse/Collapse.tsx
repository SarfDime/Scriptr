'use client'

import { useId, useState } from 'react'

import { cn } from '../../../lib/common-utils'
import type { CollapseProps } from '../../../types/components/Collapse.types'
import { Box } from '../../common/Box'
import { CollapseContent } from './CollapseContent'
import { CollapseTrigger } from './CollapseTrigger'

/** A component that renders a collapsible section.
 * The trigger shows the title and an arrow (hidden if showArrow is false), or
 * the `triggerProps.children` when they are provided. `triggerActions` renders
 * controls in the trigger row that must not toggle the section.
 */
export const Collapsible = ({
  title,
  children,
  triggerActions,
  showArrow = true,
  rootProps,
  contentProps,
  triggerProps,
  triggerTitleProps,
  triggerArrowProps,
}: CollapseProps) => {
  const contentId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const trigger = (
    <CollapseTrigger
      {...triggerProps}
      title={title}
      isOpen={isOpen}
      showArrow={showArrow}
      triggerArrowProps={triggerArrowProps}
      triggerTitleProps={triggerTitleProps}
      currentIsOpen={isOpen}
      aria-expanded={isOpen}
      contentId={contentId}
      toggleCollapse={() => setIsOpen((open) => !open)}
    />
  )

  return (
    <Box
      {...rootProps}
      className={cn(
        'collapsible-root group/collapsible-root',
        rootProps?.className
      )}
    >
      {triggerActions ? (
        <Box className='ui-cluster justify-between'>
          {trigger}
          {triggerActions}
        </Box>
      ) : (
        trigger
      )}
      <CollapseContent {...contentProps} id={contentId} currentIsOpen={isOpen}>
        {children}
      </CollapseContent>
    </Box>
  )
}
