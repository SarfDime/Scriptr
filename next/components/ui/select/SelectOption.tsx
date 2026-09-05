import { cn } from '../../../lib/common-utils'
import type { SelectOptionProps } from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { Button } from '../../common/Button'

/** `SelectOption` - A component that renders a selectable option within a list.
 * It uses a button to display the option's label and triggers a selection handler when clicked.
 */
export const SelectOption = <T,>({
  option,
  selectedId,
  handleSelect,
  buttonProps,
  ...rest
}: SelectOptionProps<T>) => {
  const { id, label, disabled } = option
  return (
    <Box as='li' {...rest}>
      <Button
        {...buttonProps}
        disabled={disabled}
        isActive={id === selectedId}
        onClick={() => handleSelect?.(option)}
        className={cn(
          'button basic relative w-full cursor-pointer select-none items-start justify-between rounded-sm px-3.5 py-3 text-left',
          buttonProps?.className
        )}
      >
        {label}
      </Button>
    </Box>
  )
}
