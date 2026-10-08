import type { ChangeEvent } from 'react'
import type { AdditionalComponentAttributes } from '@/types/component.types'
import { cn } from '../../lib/common-utils'
import type { FieldProps } from '../ui/field/Field'
import { Field } from '../ui/field/Field'

type TextareaWrapperProps = {
  fieldProps?: FieldProps
  inputOnChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  inputOnClick?: () => void
} & AdditionalComponentAttributes &
  React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >

/** A component that renders a textarea input field with a given set of props. */
export function TextArea({
  fieldProps,
  inputOnChange,
  inputOnClick,
  ...rest
}: TextareaWrapperProps) {
  return (
    <Field {...fieldProps}>
      <textarea
        {...rest}
        className={cn(
          'focus-visible:outline-none focus-visible:ring-brand ui-above-inside',
          rest?.className
        )}
        onChange={inputOnChange}
        onClick={inputOnClick}
      />
    </Field>
  )
}
