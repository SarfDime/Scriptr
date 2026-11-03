import LaunchIcon from '@sanity/icons/Launch'
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
  ...rest
}: NextLinkProps) {
  const { attributes, isExternal } = externalLink(href)

  return (
    <Link
      href={href}
      {...attributes}
      {...rest}
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
