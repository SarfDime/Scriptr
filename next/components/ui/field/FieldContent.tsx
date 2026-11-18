import Asterisk from '@sanity/icons/Asterisk'
import { Box } from '@/components/common/Box'
import { cn } from '../../../lib/common-utils'
import { Text } from '../../typography/Text'
import { Badge } from '../Badge'
import type { FieldProps } from './Field'
import type { FieldIds } from './field-context'

/** Palette for the label badge: invalid wins over valid, neutral otherwise. */
const getLabelPalette = ({
  invalid,
  valid,
}: Pick<FieldProps, 'invalid' | 'valid'>) => {
  if (invalid) return `cp-danger`
  if (valid) return 'cp-success'
  return 'cp-gray'
}

/** FieldContent is a component that renders a field with the given props.
 *
 * The component renders the `label` as a single badge inside a `label`
 * element, and the `children` as the main content of the field. The badge's
 * color palette reflects validation state: red when `invalid`, green when
 * `valid`, gray otherwise.
 * If `helperText` is provided, it renders it as a `p` element next to the label.
 * If `invalid` and `errorText` are provided, it renders the error below the
 * main content with an error color.
 */
export const FieldContent = ({
  ids,
  label,
  children,
  helperText,
  errorText,
  badgeProps,
  labelProps,
  errorProps,
  helperProps,
  labelWrapperProps,
  valid,
  invalid,
  required,
  grouped,
}: Omit<FieldProps, 'showSkeleton' | 'loading' | 'rest'> & {
  ids: FieldIds
}) => {
  return (
    <>
      {(label || helperText) && (
        <Box
          {...labelWrapperProps}
          className={cn('ui-cluster gap-1', labelWrapperProps?.className)}
        >
          {label && (
            <Text
              as='label'
              id={ids.label}
              // A grouped field has no single control to point at; the
              // container's `aria-labelledby` names the group instead.
              htmlFor={grouped ? undefined : ids.control}
              {...labelProps}
            >
              <Badge
                {...badgeProps}
                variant='outline'
                className={cn(
                  'rounded-md px-1.5 ui-center text-sm',
                  badgeProps?.className
                )}
                colorPalette={getLabelPalette({ invalid, valid })}
              >
                {label}
                {required && (
                  <Asterisk
                    className={cn(
                      'h-3 w-3 overwrite mb-1',
                      invalid || !valid ? 'text-error-red' : 'text-jade'
                    )}
                  />
                )}
              </Badge>
            </Text>
          )}
          {helperText && (
            <Text
              id={ids.helper}
              {...helperProps}
              className={cn(
                'text-fg-400 text-sm pl-0.5',
                helperProps?.className
              )}
            >
              {helperText}
            </Text>
          )}
        </Box>
      )}

      {children}
      {invalid && errorText && (
        <Text
          id={ids.error}
          {...errorProps}
          role='alert'
          className={cn('text-error-red ui-body', errorProps?.className)}
        >
          {errorText}
        </Text>
      )}
    </>
  )
}
