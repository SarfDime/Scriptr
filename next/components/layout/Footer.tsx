import { UI_STRINGS } from '@shared/config/strings'
import { NavLogo } from '../navigation/NavLogo'

/** One-line static footer: wordmark and copyright. Server Component with no
 * request-time APIs, so it keeps every statically generated route static. It
 * spans the full width of the main area like the header (so it is full width
 * when the navbar is collapsed). The year is read at render time, so on
 * prerendered pages it is the build year until the page is regenerated. */
export const Footer = () => (
  <footer className='ui-above rounded-none h-(--footer-height) w-full shrink-0 border-b-0 border-l-0 border-r-0 sticky bottom-0 ui-cluster justify-between'>
    <NavLogo />
    <small className='ui-caption'>
      {UI_STRINGS.footer.copyright(new Date().getFullYear())}
    </small>
  </footer>
)
