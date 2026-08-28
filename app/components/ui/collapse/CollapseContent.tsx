import { cn } from '../../../lib/common-utils'
import type { CollapseContentProps } from '../../../types/components/Collapse.types'
import { Box } from '../../common/Box'

/** A component that renders the content of a collapsible section. */
export const CollapseContent = ({
  contentInnerProps,
  currentIsOpen,
  children,
  className,
  ...rest
}: CollapseContentProps) => {
  return (
    <Box
      {...rest}
      className={cn(
        'collapsible-content group/collapsible-content absolute grid overflow-hidden duration-200 ease-in-out',
        currentIsOpen
          ? 'max-h-screen grid-rows-[1fr]'
          : 'max-h-0 grid-rows-[0fr]',
        className
      )}
    >
      <Box
        {...contentInnerProps}
        className={cn('overflow-hidden', contentInnerProps?.className)}
      >
        {children}
      </Box>
    </Box>
  )
}
