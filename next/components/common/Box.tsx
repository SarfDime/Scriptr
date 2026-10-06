import { getAttribute } from '@shared/utils/common-utils'
import { cn } from '@/lib/common-utils'
import type {
  AdditionalComponentAttributes,
  BoxTags,
} from '@/types/component.types'

export type BoxProps = AdditionalComponentAttributes & {
  as?: BoxTags
} // TODO: Create a omitted children type export for BoxProps

/** A utility component for wrapping arbitrary content in a layout element (eg. div, section, list). */
export const Box = ({
  children,
  className,
  disabled,
  as = 'div',
  ...rest
}: BoxProps) => {
  const BoxTag = as

  return (
    <BoxTag
      className={cn('ui-box', className, disabled && 'disabled')}
      {...rest}
      {...getAttribute(Boolean(disabled), 'tabIndex', disabled ? -1 : 0)}
      aria-disabled={disabled}
      data-disabled={disabled}
    >
      {children}
    </BoxTag>
  )
}
