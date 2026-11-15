import { NavLogo } from '../navigation/NavLogo'
import { FooterCopyright } from './FooterCopyright'

/** One-line static footer: wordmark and copyright. It spans the full width of
 * the main area like the header (so it is full width when the navbar is
 * collapsed). A Server Component — the year is the `FooterCopyright` client
 * leaf, so nothing else here needs the browser. */
export const Footer = () => {
  return (
    <footer className='ui-above-opaque ui-sheen-horizontal rounded-none h-(--footer-height) w-full shrink-0 border-b-0 border-l-0 border-r-0 ui-cluster justify-between'>
      <NavLogo />
      <small className='ui-caption'>
        <FooterCopyright />
      </small>
    </footer>
  )
}
