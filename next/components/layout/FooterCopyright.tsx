'use client'

import { useMounted } from '@/hooks/useMounted'
import { useUIStrings } from '@/providers/locale/use-strings'

/**
 * The footer's copyright line. The shell carries the year the page was
 * prerendered in (`initialNow`); the browser reads its own year once mounted, so
 * a prerendered page does not carry the build year into the next one. A client
 * leaf for exactly that reason — the rest of the footer stays a Server
 * Component.
 */
export const FooterCopyright = ({ initialNow }: { initialNow: string }) => {
  const ui = useUIStrings()
  const mounted = useMounted()
  const year = mounted
    ? new Date().getFullYear()
    : new Date(initialNow).getFullYear()

  return <>{ui.footer.copyright(year)}</>
}
