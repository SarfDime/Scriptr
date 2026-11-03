import type { ButtonType } from '@shared/types/common.types'
import { getAttribute } from '@shared/utils/common-utils'
import type { ReactNode } from 'react'
import { cn } from '@/lib/common-utils'
import type {
  AccessibleNameProps,
  AdditionalComponentAttributes,
} from '@/types/component.types'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export type ButtonBaseProps = {
  type?: ButtonType
  isLoading?: boolean
  isActive?: boolean
  /** An element rendered beside the content. It is not a label: an icon-only
   * button needs `aria-label` too, which `ButtonProps` enforces. */
  icon?: ReactNode
} & AdditionalComponentAttributes

export type ButtonProps = ButtonBaseProps & AccessibleNameProps

/** A generic button component that extends the default HTML button element.
 * It renders a loading spinner if `isLoading` is set to true.
 * It also renders a custom icon if one is provided.
 * The component also accepts additional props that are passed to the underlying button element.
 */
export const Button = ({
  children,
  className,
  disabled,
  isActive,
  isLoading,
  icon,
  type,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type ?? 'button'}
      {...rest}
      {...getAttribute(Boolean(isActive), 'data-active', isActive)}
      disabled={disabled ?? isLoading}
      className={cn(
        'relative overflow-hidden',
        className,
        isLoading && 'pointer-events-none',
        disabled && 'select-none'
      )}
    >
      {isLoading && <LoadingSpinner />}
      {children}
      {icon && icon}
    </button>
  )
}
