import type { ReactNode } from 'react'
import { cn, getAttribute } from '../../lib/common-utils'
import type { ButtonType } from '../../types/common.types'
import type { AdditionalComponentAttributes } from '../../types/component.types'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export type ButtonProps = {
  label?: string
  type?: ButtonType
  isLoading?: boolean
  isActive?: boolean
  icon?: ReactNode
} & AdditionalComponentAttributes

/** A generic button component that extends the default HTML button element.
 * It renders a loading spinner if `isLoading` is set to true.
 * It also renders a custom icon if one is provided.
 * The component also accepts additional props that are passed to the underlying button element.
 */
export const Button = ({
  label,
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
      {label || children}
      {icon && icon}
    </button>
  )
}
