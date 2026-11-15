'use client'

import { useUIStrings } from '@/providers/locale/use-strings'

/**
 * The footer's copyright line, with the year read at render time so a prerendered
 * page does not carry the build year for a year. A client leaf for exactly that
 * reason — the copy around it is resolved once on the server, and the footer
 * itself stays a Server Component.
 */
export const FooterCopyright = () => {
  const ui = useUIStrings()

  return <>{ui.footer.copyright(new Date().getFullYear())}</>
}
