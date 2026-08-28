import { cn } from '../../../lib/common-utils'
import type { SelectOptionProps } from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { Button } from '../../common/Button'
import { NextLink } from '../../common/NextLink'

/** `SelectOption` - A component that renders a selectable option within a list.
 * It uses a button to display the option's label and triggers a selection handler when clicked.
 */
export const SelectOption = <T,>({
  option,
  handleSelect,
  buttonProps,
  ...rest
}: SelectOptionProps<T>) => {
  const { label, href, disabled } = option
  return (
    <Box as='li' {...rest}>
      {href && !disabled ? (
        <NextLink
          href={href}
          onClick={() => handleSelect?.(option)}
          skipLocalization
          className={cn(
            'button relative w-full cursor-pointer select-none items-start justify-between rounded-sm px-3.5 py-3 text-left hover:bg-gray-100',
            buttonProps?.className
          )}
        >
          {label}
        </NextLink>
      ) : (
        <Button
          disabled={disabled}
          type='button'
          onClick={() => handleSelect?.(option)}
          className={cn(
            'relative w-full cursor-pointer select-none items-start justify-between rounded-sm px-3.5 py-3 text-left hover:bg-gray-100',
            buttonProps?.className
          )}
        >
          {label}
        </Button>
      )}
    </Box>
  )
}
