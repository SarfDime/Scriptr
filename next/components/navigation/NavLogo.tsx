'use client'

import { localizedPath } from '@shared/utils/localized-path'
import { cn } from '@/lib/common-utils'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { NextLink, type NextLinkBaseProps } from '../common/NextLink'

export const NavLogo = ({
  className,
  href,
  ...props
}: Omit<NextLinkBaseProps, 'href' | 'children'> & { href?: string }) => {
  const { locale } = useLocale()

  return (
    <NextLink
      {...props}
      href={href ?? localizedPath('/', locale)}
      className={cn(
        'ui-title font-black font-olive tracking-tighter leading-3',
        className
      )}
    >
      Scriptr<span className='text-brand'>.</span>
    </NextLink>
  )
}
