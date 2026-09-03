import { cn } from '../../../lib/common-utils'
import { Text } from '../../typography/Text'
import { Badge } from '../Badge'
import type { FieldProps } from './Field'

/** FieldContent is a component that renders a field with the given props.
 *
 * The component renders the `label` as a `label` element, and the `children` as the main content of the field.
 * If `helperText` is provided, it renders it as a `p` element below the main content.
 * If `errorText` is provided, it renders it as a `p` element below the main content with an error color.
 * If `required` is true and `valid` is false, it renders a red "Required" badge next to the label.
 * If `valid` is true, it renders a green "Valid" badge next to the label.
 */
export const FieldContent = ({
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
  valid,
}: Omit<FieldProps, 'showSkeleton' | 'loading' | 'rest'>) => {
  return (
    <>
      {label && (
        <Text as='label' {...labelProps}>
          {label}
          {required && !valid && (
            <Badge colorPalette='red' variant='outline' {...badgeProps}>
              {requiredText || 'Required'}
            </Badge>
          )}
          {valid && (
            <Badge variant='outline' colorPalette='brand' {...badgeProps}>
              {validText || 'Valid'}
            </Badge>
          )}
          {!valid && errorText && (
            <Text
              {...errorProps}
              className={cn('ml-auto text-error-red', errorProps?.className)}
            >
              {errorText}
            </Text>
          )}
        </Text>
      )}
      {children}
      {helperText && <Text {...helperProps}>{helperText}</Text>}
    </>
  )
}
