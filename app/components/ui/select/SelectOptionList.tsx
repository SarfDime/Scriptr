import { cn } from '../../../lib/common-utils'
import type { SelectOptionListProps } from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { SelectOption } from './SelectOption'

/** A component that renders a list of selectable options.
 * It uses the SelectOption component to render each option in the list.
 */
export const SelectOptionList = <T,>({
  options,
  handleSelect,
  buttonProps,
  ...rest
}: SelectOptionListProps<T>) => {
  return (
    <Box
      as='ul'
      {...rest}
      className={cn(
        'absolute top-full z-90 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background-100 text-base opacity-start shadow-md focus:outline-none sm:text-sm',
        rest?.className
      )}
    >
      {options?.map((option, index) => (
        <SelectOption
          key={`${index}-select-option-${option?.value}`}
          option={option}
          buttonProps={buttonProps}
          handleSelect={handleSelect}
        />
      ))}
    </Box>
  )
}
