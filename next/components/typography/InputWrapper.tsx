import { CloseIcon } from '@sanity/icons/Close'
import { INPUT_MAX_LENGTH } from '@shared/config/next-constants'
import type {
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
} from 'react'
import { cn } from '../../lib/common-utils'
import { Box, type BoxProps } from '../common/Box'
import { Button } from '../common/Button'
import type { FieldProps } from '../ui/field/Field'
import { Field } from '../ui/field/Field'

export type InputWrapperProps = {
  inputProps?: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
  fieldProps?: FieldProps
  wrapperProps?: Omit<BoxProps, 'children'>
  inputVal?: string
  inputClearButton?: boolean
  inputOnClear?: () => void
  inputOnChange?: ChangeEventHandler<HTMLInputElement>
  inputOnClick?: () => void
  children?: React.ReactNode
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
  wrapperProps,
  children,
}: InputWrapperProps) {
  return (
    <Field {...fieldProps}>
      <Box
        {...wrapperProps}
        className={cn('relative flex w-full', wrapperProps?.className)}
      >
        {children}
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
