import Asterisk from '@sanity/icons/Asterisk'
import { Box } from '@/components/common/Box'
import { cn } from '../../../lib/common-utils'
import { Text } from '../../typography/Text'
import { Badge } from '../Badge'
import type { FieldProps } from './Field'

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
}: Omit<FieldProps, 'showSkeleton' | 'loading' | 'rest'>) => {
  return (
    <>
      {(label || helperText) && (
        <Box
          {...labelWrapperProps}
          className={cn('ui-cluster gap-1', labelWrapperProps?.className)}
        >
          {label && (
            <Text as='label' {...labelProps}>
              <Badge
                {...badgeProps}
                variant='outline'
                className={cn(
                  'rounded-md px-1.5 ui-center',
                  badgeProps?.className
                )}
                colorPalette={getLabelPalette({ invalid, valid })}
              >
                {label}
                {required && <Asterisk className='h-3 w-3 overwrite mb-1' />}
              </Badge>
            </Text>
          )}
          {helperText && (
            <Text
              {...helperProps}
              className={cn(
                'text-fg-400 text-xs pl-0.5',
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
          {...errorProps}
          className={cn('text-error-red ui-caption', errorProps?.className)}
        >
          {errorText}
        </Text>
      )}
    </>
  )
}
