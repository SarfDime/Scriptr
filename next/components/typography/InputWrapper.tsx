import { CloseIcon } from '@sanity/icons/Close'
import type {
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
} from 'react'
import { INPUT_MAX_LENGTH } from '@/lib/constants'
import { cn } from '../../lib/common-utils'
import { Box } from '../common/Box'
import { Button } from '../common/Button'
import type { FieldProps } from '../ui/Field'
import { Field } from '../ui/Field'

export type InputWrapperProps = {
  inputProps?: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
  fieldProps?: FieldProps
  inputVal?: string
  inputClearButton?: boolean
  inputOnClear?: () => void
  inputOnChange?: ChangeEventHandler<HTMLInputElement>
  inputOnClick?: () => void
}

/** A component that wraps an input field with a clear button
 * and a maximum length
 */
export function InputWrapper({
  fieldProps,
  inputVal,
  inputClearButton,
  inputOnClear,
  inputOnChange,
  inputOnClick,
  inputProps,
}: InputWrapperProps) {
  return (
    <Field {...fieldProps}>
      <Box className={'relative flex w-full'}>
        <input
          {...inputProps}
          value={inputVal}
          onChange={inputOnChange}
          onClick={inputOnClick}
          maxLength={inputProps?.maxLength ?? INPUT_MAX_LENGTH}
          className={cn(
            'focus-visible:outline-none focus-visible:ring-brand',
            inputProps?.className
          )}
        />

        {inputClearButton && inputVal !== '' && (
          <Button
            className='absolute top-0 right-0 bottom-0 h-full rounded-none px-2 opacity-70 hover:bg-gray-100 hover:opacity-100'
            onClick={inputOnClear}
            icon={<CloseIcon />}
            type='button'
          />
        )}
      </Box>
    </Field>
  )
}
