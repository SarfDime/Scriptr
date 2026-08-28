import Link, { type LinkProps } from 'next/link'
import type { HTMLAttributes } from 'react'
import type { IconProps } from '@/types/component.types'
import { cn, externalLink } from '../../lib/common-utils'

export type NextLinkProps = {
  children: React.ReactNode
  href: string
  className?: string
  hideExternalIcon?: boolean
  externalIconProps?: IconProps
  skipLocalization?: boolean
} & LinkProps &
  HTMLAttributes<HTMLAnchorElement>

/** General link component with optional click and hover tracking */
export function NextLink({
  href,
  children,
  onClick,
  hideExternalIcon,
  externalIconProps,
  skipLocalization,
  ...rest
}: NextLinkProps) {
  const { attributes, isExternal } = externalLink(href)

  return (
    <Link
      href={href}
      {...attributes}
      {...rest}
      className={cn(
        isExternal && 'inline-flex items-center justify-center gap-1',
        rest?.className
      )}
    >
      {children}
    </Link>
  )
}
