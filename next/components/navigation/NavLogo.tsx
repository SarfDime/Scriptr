import { cn } from '@/lib/common-utils'
import { NextLink, type NextLinkBaseProps } from '../common/NextLink'

export const NavLogo = ({
  className,
  href,
  ...props
}: Omit<NextLinkBaseProps, 'href' | 'children'> & { href?: string }) => (
  <NextLink
    {...props}
    href={href ?? '/'}
    className={cn(
      'ui-title font-black font-olive tracking-tighter leading-3',
      className
    )}
  >
    Scriptr<span className='text-brand'>.</span>
  </NextLink>
)
