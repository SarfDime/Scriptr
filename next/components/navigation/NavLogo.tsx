import { localizedPath } from '@shared/utils/localized-path'
import { cn } from '@/lib/common-utils'
import { getServerLocale } from '@/lib/server-strings'
import { NextLink, type NextLinkBaseProps } from '../common/NextLink'

/** The wordmark, linking home in the reader's language. A Server Component: the
 * navbar, the header and the footer all render it and all render on the server,
 * so the address is built once per request instead of in the browser. */
export const NavLogo = async ({
  className,
  href,
  ...props
}: Omit<NextLinkBaseProps, 'href' | 'children'> & { href?: string }) => {
  const locale = await getServerLocale()

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
