import type { RadioGroupProps } from '@/types/components/Radio.types'
import { cn } from '../../../lib/common-utils'
import { Box } from '../../common/Box'
import { Radio } from './RadioButton'

/**
 * A radio button group component that renders multiple radio options.
 * Allows users to select one option from a list of choices.
 */
export const RadioGroup = ({
  disabled,
  name,
  onChange,
  options,
  className,
  value,
  hasBorder = false,
  ...rest
}: RadioGroupProps) => {
  return (
    <Box
      {...rest}
      className={cn('flex flex-col justify-items-start gap-2', className)}
    >
      {options?.map(({ label: optionLabel, description, value: option }) => {
        const checkedValue = (() => {
          if (typeof value === 'string') return value === option
          if (Array.isArray(value))
            return (
              value.find((item) => item?.value === option)?.checked ?? false
            )
          return false
        })()

        return (
          <Radio
            key={option}
            id={option}
            disabled={disabled}
            label={optionLabel}
            description={description}
            onChange={onChange}
            value={option}
            hasBorder={hasBorder}
            checked={checkedValue}
          />
        )
      })}
    </Box>
  )
}
