'use client'

import { CloseIcon } from '@sanity/icons/Close'
import { INPUT_MAX_LENGTH } from '@shared/config/next-constants'
import type {
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
} from 'react'
import { useUIStrings } from '@/providers/locale/use-strings'
import { cn } from '../../lib/common-utils'
import { Box, type BoxPropsWithoutChildren } from '../common/Box'
import { Button } from '../common/Button'
import type { FieldProps } from '../ui/field/Field'
import { Field } from '../ui/field/Field'
import { FieldInput } from '../ui/field/FieldControl'

export type InputWrapperProps = {
  inputProps?: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
  wrapperProps?: BoxPropsWithoutChildren
  inputVal?: string
  inputClearButton?: boolean
  inputOnClear?: () => void
  inputOnChange?: ChangeEventHandler<HTMLInputElement>
  inputOnClick?: () => void
} & FieldProps

/** A component that wraps an input field with a clear button
 * and a maximum length
 */
export function InputWrapper({
  inputVal,
  inputClearButton,
  inputOnClear,
  inputOnChange,
  inputOnClick,
  inputProps,
  wrapperProps,
  children,
  ...rest
}: InputWrapperProps) {
  const ui = useUIStrings()
  return (
    <Field {...rest}>
      <Box
        {...wrapperProps}
        className={cn(
          'relative flex w-full overflow-hidden',
          'ui-above-inside border-0 py-0 placeholder:text-fg-50 ring-(--field-edge) group-data-valid/field:ring-brand-200',
          'rounded-lg h-10 grow w-full ring-1 ring-inset px-2 focus-within:ring-brand',
          'group-data-invalid/field:ring-error-red group-data-invalid/field:focus-within:ring-error-red',
          wrapperProps?.className
        )}
      >
        {children}
        <FieldInput
          {...inputProps}
          value={inputVal}
          onChange={inputOnChange}
          onClick={inputOnClick}
          maxLength={inputProps?.maxLength ?? INPUT_MAX_LENGTH}
          className={cn(
            'focus-visible:outline-none grow',
            inputProps?.className
          )}
        />

        {inputClearButton && inputVal !== '' && (
          <Button
            className='button absolute top-0 right-0 bottom-0 h-full rounded-none px-2 opacity-70 hover:bg-gray-100 hover:opacity-100'
            onClick={inputOnClear}
            icon={<CloseIcon />}
            type='button'
            aria-label={ui.general.clearInput}
          />
        )}
      </Box>
    </Field>
  )
}
