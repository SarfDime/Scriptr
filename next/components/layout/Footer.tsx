'use client'

import { useUIStrings } from '@/providers/locale/use-strings'
import { NavLogo } from '../navigation/NavLogo'

/** One-line static footer: wordmark and copyright. It spans the full width of
 * the main area like the header (so it is full width when the navbar is
 * collapsed). The year is read at render time, so on prerendered pages it is the
 * build year until the page is regenerated.
 *
 * A Client Component because `PageLayout` — its parent — is rendered from client
 * pages too (the auth callback, the profile). The copy still comes out right in
 * the server HTML: `LocaleProvider` is seeded with the route's language, so
 * `useUIStrings` resolves it during SSR as well. */
export const Footer = () => {
  const UI_STRINGS = useUIStrings()

  return (
    <footer className='ui-above-opaque ui-sheen-horizontal rounded-none h-(--footer-height) w-full shrink-0 border-b-0 border-l-0 border-r-0 ui-cluster justify-between'>
      <NavLogo />
      <small className='ui-caption'>
        {UI_STRINGS.footer.copyright(new Date().getFullYear())}
      </small>
    </footer>
  )
}
