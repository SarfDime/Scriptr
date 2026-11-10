'use client'

import { getAttribute } from '@shared/utils/common-utils'
import { type ReactNode, useId } from 'react'
import { Box, type BoxProps } from '@/components/common/Box'
import type { TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { BadgeProps } from '../Badge'
import { Skeleton } from '../skeleton/Skeleton'
import { FieldContent } from './FieldContent'
import { FieldContext, type FieldIds } from './field-context'

export type FieldProps = {
  label?: ReactNode
  helperText?: ReactNode
  errorText?: ReactNode
  badgeProps?: BadgeProps
  labelProps?: TextProps
  labelWrapperProps?: BoxProps
  helperProps?: TextProps
  errorProps?: TextProps
  valid?: boolean
  invalid?: boolean
  required?: boolean
  /** The children are several controls or composed content (a dropzone, a list
   * of links), so the label names the group instead of pointing at one
   * control. Without it, the label targets the single control inside, which
   * reads the generated id through `useFieldControl`. */
  grouped?: boolean
  showSkeleton?: boolean
  loading?: boolean
} & Omit<BoxProps, 'onChange'>

/** Renders a field with optional label, helper, and error texts, as well as validation badges.
 *
 * The label points at the field's control and the helper/error text describes
 * it: `Field` generates the ids and every control inside reads them through
 * `useFieldControl`. A field whose children are a group of controls passes
 * `grouped`, which makes the container the labelled group instead.
 *
 * This component conditionally displays a skeleton loader or a box container
 * based on the `showSkeleton` prop. It uses `FieldContent` to render the
 * main content of the field, including the label and any helper or error texts.
 * Validation status is indicated through the label badge's color palette.
 */
export const Field = (props: FieldProps) => {
  const {
    label,
    children,
    helperText,
    errorText,
    badgeProps,
    labelProps,
    errorProps,
    labelWrapperProps,
    helperProps,
    required,
    invalid,
    valid,
    grouped,
    showSkeleton,
    loading: _loading,
    ...rest
  } = props

  const fieldId = useId()
  const ids: FieldIds = {
    control: `${fieldId}-control`,
    label: `${fieldId}-label`,
    helper: `${fieldId}-helper`,
    error: `${fieldId}-error`,
  }
  const describedBy = [
    helperText ? ids.helper : null,
    invalid && errorText ? ids.error : null,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <FieldContent
      ids={ids}
      label={label}
      helperProps={helperProps}
      helperText={helperText}
      errorProps={errorProps}
      errorText={errorText}
      badgeProps={badgeProps}
      labelProps={labelProps}
      labelWrapperProps={labelWrapperProps}
      required={required}
      valid={valid}
      invalid={invalid}
      grouped={grouped}
    >
      {children}
    </FieldContent>
  )

  const field = (
    <FieldContext.Provider
      value={{ control: ids.control, describedBy: describedBy || undefined }}
    >
      {content}
    </FieldContext.Provider>
  )

  // The container only carries the group semantics a screen reader needs when
  // no single control can be the label's target.
  const groupProps = grouped
    ? {
        role: 'group',
        'aria-labelledby': label ? ids.label : undefined,
        'aria-describedby': describedBy || undefined,
      }
    : {}

  const className = cn('group/field gap-1 grid', rest.className)

  if (showSkeleton) {
    return (
      <Skeleton
        {...getAttribute(Boolean(invalid), 'data-invalid', true)}
        {...getAttribute(Boolean(required), 'data-required', true)}
        {...getAttribute(Boolean(valid), 'data-valid', true)}
        {...groupProps}
        {...rest}
        className={className}
      >
        {field}
      </Skeleton>
    )
  }

  return (
    <Box
      {...getAttribute(
        Boolean(invalid || (required && !valid)),
        'data-invalid',
        true
      )}
      {...getAttribute(Boolean(required), 'data-required', true)}
      {...getAttribute(Boolean(valid), 'data-valid', true)}
      {...groupProps}
      {...rest}
      className={className}
    >
      {field}
    </Box>
  )
}
