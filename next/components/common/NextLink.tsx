import LaunchIcon from '@sanity/icons/Launch'
import Link, { type LinkProps } from 'next/link'
import type { HTMLAttributes, ReactNode } from 'react'
import type { SanityIconProps } from '@/types/component.types'
import { cn, externalLink } from '../../lib/common-utils'

export type NextLinkProps = {
  children: ReactNode
  href: string
  externalIconProps?: SanityIconProps
  hideExternalIcon?: boolean
} & LinkProps &
  HTMLAttributes<HTMLAnchorElement>

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
