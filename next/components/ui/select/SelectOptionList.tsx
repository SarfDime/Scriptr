import { cn } from '../../../lib/common-utils'
import type { SelectOptionListProps } from '../../../types/components/Select.types'
import { Box } from '../../common/Box'
import { SelectOption } from './SelectOption'

/** A component that renders a list of selectable options.
 * It uses the SelectOption component to render each option in the list.
 */
export const SelectOptionList = <T,>({
  options,
  selectedId,
  handleSelect,
  buttonProps,
  ...rest
}: SelectOptionListProps<T>) => {
  return (
    <Box
      as='ul'
      {...rest}
      className={cn(
        'absolute top-full z-90 mt-1 max-h-60 min-w-max w-full overflow-auto rounded-md bg-background-100 text-base opacity-start shadow-xl focus:outline-none sm:text-sm border border-grey-300',
        rest?.className
      )}
    >
      {options?.map((option, _index) => (
        <SelectOption
          key={option.id}
          option={option}
          buttonProps={buttonProps}
          handleSelect={handleSelect}
          selectedId={selectedId}
        />
      ))}
    </Box>
  )
}
