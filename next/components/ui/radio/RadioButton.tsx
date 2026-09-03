import { CheckmarkIcon } from '@sanity/icons/Checkmark'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { cn } from '../../../lib/common-utils'
import type { RadioProps } from '../../../types/components/Radio.types'
import { Text } from '../../typography/Text'

/** A single radio button option component with a checkmark icon and label.
 * Part of a radio group for selecting one option from multiple choices.
 */
export const Radio = ({
  disabled,
  label,
  description,
  onChange,
  checked,
  value,
  checkMarkProps,
  labelProps,
  className,
  hasBorder = false,
  ...rest
}: RadioProps) => {
  return (
    <Button
      {...rest}
      className={cn(
        'group flex items-center justify-start gap-2 overflow-visible rounded-none p-0 text-start outline-0',
        hasBorder && !checked ? 'border-gray-300' : '',
        hasBorder ? 'rounded-md border p-2 hover:border-brand' : '',
        checked && hasBorder ? 'border-brand focus:border-brand' : '',
        className
      )}
      onClick={() => onChange?.(value)}
    >
      <CheckmarkIcon
        {...checkMarkProps}
        className={cn(
          'h-5 w-5 shrink-0 rounded-full bg-jade text-white [&>path]:stroke-2',
          !checked && 'border-2 border-gray-400 bg-white text-transparent',
          description ? 'mt-1.5 mb-auto' : '',
          checkMarkProps?.className
        )}
      />
      <Box
        className={cn(
          'flex flex-col items-start gap-1',
          description ? 'gap-0' : ''
        )}
      >
        <Text
          {...labelProps}
          className={cn(
            'text-start',
            disabled && 'disabled',
            'w-full text-fg! hover:cursor-pointer hover:text-fg-700',
            checked && 'text-fg-700 hover:text-fg-600',
            hasBorder && !checked && 'text-fg',
            checked && hasBorder && 'text-brand!',
            hasBorder || description
              ? 'font-semibold text-lg duration-100 hover:text-brand active:text-brand group-hover:text-brand group-focus:text-brand group-active:text-brand'
              : '',

            labelProps?.className
          )}
        >
          {label}
        </Text>
        {description}
      </Box>
    </Button>
  )
}
