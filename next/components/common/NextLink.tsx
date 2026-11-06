import LaunchIcon from '@sanity/icons/Launch'
import { getAttribute } from '@shared/utils/common-utils'
import Link, { type LinkProps } from 'next/link'
import type { HTMLAttributes } from 'react'
import type {
  AccessibleNameProps,
  SanityIconProps,
} from '@/types/component.types'
import { cn, externalLink } from '../../lib/common-utils'

export type NextLinkBaseProps = {
  href: string
  externalIconProps?: SanityIconProps
  hideExternalIcon?: boolean
  disabled?: boolean
  isActive?: boolean
} & LinkProps &
  HTMLAttributes<HTMLAnchorElement>

export type NextLinkProps = NextLinkBaseProps & AccessibleNameProps

/** General link component with optional click and hover tracking */
export function NextLink({
  href,
  children,
  className,
  externalIconProps,
  hideExternalIcon,
  disabled,
  isActive,
  ...rest
}: NextLinkProps) {
  const { attributes, isExternal } = externalLink(href)

  return (
    <Link
      href={href}
      {...attributes}
      {...rest}
      {...getAttribute(Boolean(isActive), 'data-active', isActive)}
      {...getAttribute(Boolean(disabled), 'data-disabled', disabled)}
      {...getAttribute(Boolean(disabled), 'tabIndex', -1)}
      className={cn(
        isExternal &&
          !hideExternalIcon &&
          'inline-flex items-center justify-center gap-1',
        className
      )}
    >
      {children}
      {isExternal && !hideExternalIcon && <LaunchIcon {...externalIconProps} />}
    </Link>
  )
}
