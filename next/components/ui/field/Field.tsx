import { getAttribute } from '@shared/utils/common-utils'
import type { ReactNode } from 'react'
import { Box, type BoxProps } from '@/components/common/Box'
import type { TextProps } from '@/components/typography/Text'
import { cn } from '@/lib/common-utils'
import type { BadgeProps } from '../Badge'
import { Skeleton } from '../skeleton/Skeleton'
import { FieldContent } from './FieldContent'

export type FieldProps = {
  label?: ReactNode
  helperText?: ReactNode
  errorText?: ReactNode
  requiredText?: ReactNode
  validText?: ReactNode
  badgeProps?: BadgeProps
  labelProps?: TextProps
  helperProps?: TextProps
  errorProps?: TextProps
  valid?: boolean
  invalid?: boolean
  required?: boolean
  showSkeleton?: boolean
  loading?: boolean
} & Omit<BoxProps, 'onChange'>

/** Renders a field with optional label, helper, and error texts, as well as validation badges.
 *
 * This component conditionally displays a skeleton loader or a box container
 * based on the `showSkeleton` prop. It uses `FieldContent` to render the
 * main content of the field, including the label and any helper or error texts.
 * Validation status is indicated through badges.
 */
export const Field = (props: FieldProps) => {
  const {
    label,
    children,
    helperText,
    errorText,
    requiredText,
    validText,
    badgeProps,
    labelProps,
    errorProps,
    helperProps,
    required,
    invalid,
    valid,
    showSkeleton,
    ...rest
  } = props

  return (
    <>
      {showSkeleton ? (
        <Skeleton
          {...getAttribute(Boolean(invalid), 'data-invalid', true)}
          {...getAttribute(Boolean(required), 'data-required', true)}
          {...getAttribute(Boolean(valid), 'data-valid', true)}
          {...rest}
          className={cn('group/field', rest.className)}
        >
          <FieldContent
            label={label}
            helperProps={helperProps}
            helperText={helperText}
            errorProps={errorProps}
            errorText={errorText}
            requiredText={requiredText}
            validText={validText}
            badgeProps={badgeProps}
            labelProps={labelProps}
            required={required}
            valid={valid}
          >
            {children}
          </FieldContent>
        </Skeleton>
      ) : (
        <Box
          {...getAttribute(Boolean(required && !valid), 'data-invalid', true)}
          {...getAttribute(Boolean(required), 'data-required', true)}
          {...getAttribute(Boolean(valid), 'data-valid', true)}
          {...rest}
          className={cn('group/field', rest.className)}
        >
          <FieldContent
            label={label}
            helperProps={helperProps}
            helperText={helperText}
            errorProps={errorProps}
            errorText={errorText}
            requiredText={requiredText}
            validText={validText}
            badgeProps={badgeProps}
            labelProps={labelProps}
            required={required}
            valid={valid}
          >
            {children}
          </FieldContent>
        </Box>
      )}
    </>
  )
}
