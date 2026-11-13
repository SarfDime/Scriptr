import { ChevronDownIcon } from '@sanity/icons/ChevronDown'

import { cn } from '../../../lib/common-utils'
import type { CollapseTriggerProps } from '../../../types/components/Collapse.types'
import { Button } from '../../common/Button'
import { Title } from '../../typography/Title'

/** A component that renders a button to toggle a collapsible container.
 * If `title` is provided, it will be rendered as a title element.
 * If `children` is provided, it will be used as the button content instead of the default output.
 * `showArrow` will render a chevron icon to indicate the collapsible state.
 * You can pass additional props to the button component.
 */
export const CollapseTrigger = ({
  isOpen,
  title,
  showArrow,
  children,
  triggerTitleProps,
  triggerArrowProps,
  currentIsOpen,
  contentId,
  toggleCollapse,
  ...rest
}: CollapseTriggerProps) => {
  return (
    <Button
      onClick={toggleCollapse}
      isActive={isOpen}
      aria-expanded={currentIsOpen}
      aria-controls={contentId}
      {...rest}
      className={cn(
        'group/trigger collapsible-trigger w-full p-0',
        rest?.className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {title && <Title {...triggerTitleProps}>{title}</Title>}
          {showArrow && (
            <ChevronDownIcon
              {...triggerArrowProps}
              className={cn(
                'transition duration-200 group-aria-expanded/trigger:rotate-180',
                triggerArrowProps?.className
              )}
            />
          )}
        </>
      )}
    </Button>
  )
}
