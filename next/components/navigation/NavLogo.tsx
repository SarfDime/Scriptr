import { BrandMark } from '@shared/components/brand-mark'
import { localizedPath } from '@shared/utils/localized-path'
import { cn } from '@/lib/common-utils'
import { getServerLocale } from '@/lib/server-strings'
import { NextLink, type NextLinkBaseProps } from '../common/NextLink'

/** The wordmark, linking home in the reader's language. A Server Component: the
 * navbar, the header and the footer all render it and all render on the server,
 * so the address is built once per request instead of in the browser.
 *
 * The mark stands in for the S, so the link carries the name it no longer
 * spells out. */
export const NavLogo = async ({
  className,
  href,
  ...props
}: Omit<NextLinkBaseProps, 'href' | 'children'> & { href?: string }) => {
  const locale = await getServerLocale()

  return (
    <NextLink
      aria-label='Scriptr'
      {...props}
      href={href ?? localizedPath('/', locale)}
      className={cn(
        'ui-title font-black font-olive tracking-tighter leading-3',
        className
      )}
    >
      {/* Preflight sets `vertical-align: middle` on every svg; the mark has to
        sit on the baseline like the capital it replaces. */}
      <BrandMark className='inline-block h-[1em] w-auto align-baseline text-brand' />
      criptr<span className='text-brand'>.</span>
    </NextLink>
  )
}
