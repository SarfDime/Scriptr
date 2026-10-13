import { cn } from '../../../lib/common-utils'
import type { SelectOptionProps } from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { Button } from '../../common/Button'
import { Text } from '../../typography/Text'

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
  const { id, label, icon, disabled } = option
  return (
    <Box as='li' {...rest}>
      <Button
        {...buttonProps}
        disabled={disabled}
        isActive={id === selectedId}
        onClick={() => handleSelect?.(option)}
        className={cn(
          'button text text-fg relative w-full min-w-0 justify-start cursor-pointer select-none gap-2 rounded-sm px-2.5 py-2.5 text-left',
          buttonProps?.className
        )}
      >
        {icon}
        <Text className='min-w-0 flex-1 truncate'>{label}</Text>
      </Button>
    </Box>
  )
}
